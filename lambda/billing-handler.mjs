/**
 * PortOne v2 정기구독 Lambda Handler
 *
 * ============================================
 * 환경 변수 (Lambda 콘솔에서 설정):
 * ============================================
 * PORTONE_SECRET_KEY       : 포트원 시크릿 키 (포트원 콘솔 > 결제연동 > API Keys)
 * PORTONE_STORE_ID         : 포트원 스토어 ID (포트원 콘솔 > 내 식별코드)
 * SUBSCRIPTIONS_TABLE_NAME : DynamoDB 구독 테이블 이름 (예: Subscriptions)
 * COGNITO_USER_POOL_ID     : Cognito 유저풀 ID (예: ap-northeast-2_4UqFR7cjW)
 *
 * ============================================
 * 필요한 IAM 권한:
 * ============================================
 * - dynamodb:PutItem, GetItem, UpdateItem (Subscriptions 테이블)
 * - cognito-idp:AdminAddUserToGroup, AdminRemoveUserFromGroup
 *
 * ============================================
 * DynamoDB Subscriptions 테이블:
 * ============================================
 * - 파티션 키: userId (String)
 * - 속성: billingKey, plan, billing, amount,
 *         status, paymentId, orderId, nextPaymentAt, createdAt, updatedAt
 *
 * ============================================
 * API Gateway 엔드포인트:
 * ============================================
 * POST /billing/authorize  - 빌링키로 첫 결제 + Cognito 그룹 추가
 * POST /billing/cancel     - 구독 취소 + Cognito 그룹 제거
 * GET  /billing/status     - 구독 상태 조회 (?userId=...)
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import {
  CognitoIdentityProviderClient,
  AdminAddUserToGroupCommand,
  AdminRemoveUserFromGroupCommand,
  ListUsersCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const PORTONE_SECRET_KEY = process.env.PORTONE_SECRET_KEY || "";
const PORTONE_STORE_ID = process.env.PORTONE_STORE_ID || "";
const TABLE_NAME = process.env.SUBSCRIPTIONS_TABLE_NAME || "";
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || "";
const PORTONE_API_BASE = "https://api.portone.io";

const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);
const cognitoClient = new CognitoIdentityProviderClient({ region: "ap-northeast-2" });

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Type": "application/json",
};

const PLAN_AMOUNTS = {
  "standard-monthly":     49000,
  "standard-yearly":     468000,  // 39000 × 12
  "professional-monthly": 99000,
  "professional-yearly":  948000, // 79000 × 12
};

const ORDER_NAMES = {
  "standard-monthly":     "Sigmarket Standard 월간 구독",
  "standard-yearly":      "Sigmarket Standard 연간 구독",
  "professional-monthly": "Sigmarket Professional 월간 구독",
  "professional-yearly":  "Sigmarket Professional 연간 구독",
};

function portoneAuth() {
  return `PortOne ${PORTONE_SECRET_KEY}`;
}

// JWT payload를 서명 검증 없이 디코드 (API Gateway Cognito Authorizer가 서명 검증)
function decodeJwt(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(Buffer.from(payload, "base64").toString("utf8"));
  } catch (_e) {
    return null;
  }
}

function verifyTokenAndGetSub(event) {
  const authHeader = event.headers?.Authorization || event.headers?.authorization || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  return decodeJwt(token);
}

function getNextPaymentAt(billing) {
  const d = new Date();
  if (billing === "yearly") d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}

// sub로 실제 Cognito username 조회
async function getCognitoUsernameBySubOrEmail(sub, email) {
  // sub로만 조회 (email은 중복 계정이 있을 수 있어 제외)
  try {
    const res = await cognitoClient.send(new ListUsersCommand({
      UserPoolId: USER_POOL_ID,
      Filter: `sub = "${sub}"`,
      Limit: 1,
    }));
    if (res.Users?.[0]?.Username) {
      console.log("getCognitoUsername: found username=", res.Users[0].Username, "for sub=", sub);
      return res.Users[0].Username;
    }
  } catch (e) {
    console.error("getCognitoUsername ListUsers error:", e?.message);
  }
  console.error("getCognitoUsername: no user found for sub=", sub);
  return null;
}

async function removeFromPlanGroups(cognitoUsername) {
  for (const group of ["free", "standard", "professional"]) {
    try {
      await cognitoClient.send(
        new AdminRemoveUserFromGroupCommand({ UserPoolId: USER_POOL_ID, Username: cognitoUsername, GroupName: group })
      );
    } catch (_e) { /* ignore if not in group */ }
  }
}

function ok(body) {
  return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify(body) };
}

function err(statusCode, message) {
  return { statusCode, headers: CORS_HEADERS, body: JSON.stringify({ error: message }) };
}

export const handler = async (event) => {
  const path = event.path || event.rawPath || "";
  const method = event.httpMethod || event.requestContext?.http?.method || "";

  console.log("billing-handler:", method, path);

  if (method === "OPTIONS") {
    return { statusCode: 200, headers: CORS_HEADERS, body: "" };
  }

  try {
    // ─── POST /billing/authorize ───────────────────────────────────────────
    if (method === "POST" && path.endsWith("/billing/authorize")) {
      const body = event.isBase64Encoded
        ? Buffer.from(event.body || "", "base64").toString("utf8")
        : (event.body || "{}")
      const { billingKey, userId, plan, billing } = JSON.parse(body);
      const claims = verifyTokenAndGetSub(event);
      console.log("authorize claims.sub:", claims?.sub, "userId:", userId);
      if (!claims || claims.sub !== userId) return err(401, "Unauthorized");
      const cognitoUsername = await getCognitoUsernameBySubOrEmail(claims.sub, claims.email);
      console.log("authorize cognitoUsername resolved:", cognitoUsername);

      console.log("authorize: env check TABLE_NAME=", TABLE_NAME, "POOL=", USER_POOL_ID, "HAS_KEY=", !!PORTONE_SECRET_KEY);
      const planBillingKey = `${plan}-${billing}`;
      const amount = PLAN_AMOUNTS[planBillingKey];
      if (!amount) return err(400, "유효하지 않은 플랜입니다");

      // 1. 빌링키로 첫 결제 실행
      const paymentId = `${plan}-${billing}-${userId.slice(0, 8)}-${Date.now()}`;
      console.log("authorize: step1 charge billingKey=", billingKey?.slice(0, 10));
      const payRes = await fetch(`${PORTONE_API_BASE}/payments/${paymentId}/billing-key`, {
        method: "POST",
        headers: { Authorization: portoneAuth(), "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: PORTONE_STORE_ID,
          billingKey,
          orderName: ORDER_NAMES[planBillingKey],
          amount: { total: amount },
          currency: "KRW",
          customer: {
            id: userId,
            email: claims.email || "",
            fullName: (claims.email || "고객").split("@")[0],
          },
        }),
      });
      const payData = await payRes.json();
      console.log("authorize: step1 result ok=", payRes.ok, "status=", payRes.status);
      if (!payRes.ok) return err(400, payData.message || "결제 실패");

      // 2. DynamoDB 저장
      console.log("authorize: step2 DynamoDB PutItem userId=", userId);
      const now = new Date().toISOString();
      const nextPaymentAt = getNextPaymentAt(billing);
      await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          userId, billingKey, plan, billing, amount,
          status: "active",
          paymentId,
          nextPaymentAt,
          createdAt: now,
          updatedAt: now,
        },
      }));
      console.log("authorize: step2 DynamoDB OK");

      // 3. Cognito 그룹 업데이트
      console.log("authorize: step3 Cognito group update cognitoUsername=", cognitoUsername, "plan=", plan);
      await removeFromPlanGroups(cognitoUsername);
      await cognitoClient.send(
        new AdminAddUserToGroupCommand({ UserPoolId: USER_POOL_ID, Username: cognitoUsername, GroupName: plan })
      );
      console.log("authorize: step3 Cognito OK");

      return ok({ success: true, plan, billing, amount, nextPaymentAt });
    }

    // ─── POST /billing/cancel ──────────────────────────────────────────────
    if (method === "POST" && path.endsWith("/billing/cancel")) {
      const { userId } = JSON.parse(event.body || "{}");

      const claims = verifyTokenAndGetSub(event);
      if (!claims || claims.sub !== userId) return err(401, "Unauthorized");
      const cognitoUsername = await getCognitoUsernameBySubOrEmail(claims.sub, claims.email);

      const result = await docClient.send(new GetCommand({ TableName: TABLE_NAME, Key: { userId } }));
      if (!result.Item) return err(404, "구독 정보를 찾을 수 없습니다");
      if (result.Item.status === "cancelled") return err(400, "이미 취소된 구독입니다");

      // 포트원 빌링키 삭제 (선택적, 실패해도 DB 취소는 진행)
      try {
        await fetch(`${PORTONE_API_BASE}/billing-keys/${result.Item.billingKey}`, {
          method: "DELETE",
          headers: { Authorization: portoneAuth() },
        });
      } catch (e) {
        console.warn("billing-key delete failed:", e?.message);
      }

      await docClient.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { userId },
        UpdateExpression: "SET #status = :cancelled, updatedAt = :now",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: { ":cancelled": "cancelled", ":now": new Date().toISOString() },
      }));

      await removeFromPlanGroups(cognitoUsername);

      return ok({ success: true });
    }

    // ─── GET /billing/status ───────────────────────────────────────────────
    if (method === "GET" && path.endsWith("/billing/status")) {
      const userId = event.queryStringParameters?.userId;

      const claims = verifyTokenAndGetSub(event);
      if (!claims || claims.sub !== userId) return err(401, "Unauthorized");

      const result = await docClient.send(new GetCommand({ TableName: TABLE_NAME, Key: { userId } }));
      if (!result.Item) return ok({ status: "none" });

      const { plan, billing, amount, status, nextPaymentAt, createdAt } = result.Item;
      return ok({ plan, billing, amount, status, nextPaymentAt, createdAt });
    }

    // ─── POST /billing/bank-transfer ────────────────────────────────────────
    if (method === "POST" && path.endsWith("/billing/bank-transfer")) {
      const body = event.isBase64Encoded
        ? Buffer.from(event.body || "", "base64").toString("utf8")
        : (event.body || "{}")
      const { userId, plan, billing, payerEmail } = JSON.parse(body);
      const claims = verifyTokenAndGetSub(event);
      if (!claims || claims.sub !== userId) return err(401, "Unauthorized");

      const planBillingKey = `${plan}-${billing}`;
      const amount = PLAN_AMOUNTS[planBillingKey];
      if (!amount) return err(400, "유효하지 않은 플랜입니다");

      const now = new Date().toISOString();
      await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          userId,
          plan,
          billing,
          amount,
          payerEmail: payerEmail || claims.email || "",
          status: "pending",
          paymentMethod: "bank_transfer",
          createdAt: now,
          updatedAt: now,
        },
      }));

      return ok({ success: true, message: "입금 확인 후 구독이 활성화됩니다" });
    }

    // ─── GET /billing/pending (admin) ─────────────────────────────────────
    if (method === "GET" && path.endsWith("/billing/pending")) {
      const claims = verifyTokenAndGetSub(event);
      if (!claims) return err(401, "Unauthorized");
      const groups = claims["cognito:groups"] || [];
      if (!groups.includes("admin")) return err(403, "Forbidden");

      const result = await docClient.send(new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "#status = :pending",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: { ":pending": "pending" },
      }));

      const items = (result.Items || []).sort((a, b) =>
        (b.createdAt || "").localeCompare(a.createdAt || "")
      );
      return ok({ items });
    }

    // ─── POST /billing/activate (admin) ───────────────────────────────────
    if (method === "POST" && path.endsWith("/billing/activate")) {
      const body = event.isBase64Encoded
        ? Buffer.from(event.body || "", "base64").toString("utf8")
        : (event.body || "{}")
      const { userId } = JSON.parse(body);
      const claims = verifyTokenAndGetSub(event);
      if (!claims) return err(401, "Unauthorized");
      const groups = claims["cognito:groups"] || [];
      if (!groups.includes("admin")) return err(403, "Forbidden");

      const existing = await docClient.send(new GetCommand({ TableName: TABLE_NAME, Key: { userId } }));
      if (!existing.Item) return err(404, "구독 정보를 찾을 수 없습니다");
      if (existing.Item.status !== "pending") return err(400, "대기 중인 구독이 아닙니다");

      const { plan, billing, payerEmail } = existing.Item;
      const cognitoUsername = await getCognitoUsernameBySubOrEmail(userId, payerEmail || "");
      if (!cognitoUsername) return err(404, "사용자를 찾을 수 없습니다");

      const nextPaymentAt = getNextPaymentAt(billing);
      await docClient.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { userId },
        UpdateExpression: "SET #status = :active, nextPaymentAt = :next, updatedAt = :now",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: {
          ":active": "active",
          ":next": nextPaymentAt,
          ":now": new Date().toISOString(),
        },
      }));

      await removeFromPlanGroups(cognitoUsername);
      await cognitoClient.send(
        new AdminAddUserToGroupCommand({ UserPoolId: USER_POOL_ID, Username: cognitoUsername, GroupName: plan })
      );

      return ok({ success: true, plan, billing, nextPaymentAt });
    }

    return err(404, "Not found");

  } catch (e) {
    console.error("billing-handler error:", JSON.stringify({
      message: e?.message,
      name: e?.name,
      code: e?.Code || e?.code,
      stack: e?.stack,
    }));
    return err(500, e?.message || "서버 오류가 발생했습니다");
  }
};
