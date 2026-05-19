/**
 * TradingView Webhook → DynamoDB Lambda Handler
 * 
 * AWS 콘솔에서 직접 배포하는 Lambda 함수입니다.
 * 런타임: Node.js 20.x
 * 핸들러: handler.handler
 * 
 * ============================================
 * 환경 변수 (Lambda 콘솔에서 설정):
 * ============================================
 * WEBHOOK_SECRET    : TradingView Alert에 넣을 비밀키 (예: sigmarket-webhook-secret-2025)
 * SIGNAL_TABLE_NAME : 직접 생성한 DynamoDB 테이블 이름 (예: Signal)
 * 
 * ============================================
 * 필요한 IAM 권한:
 * ============================================
 * - dynamodb:PutItem   (Signal 테이블)
 * - dynamodb:GetItem   (Signal 테이블 — 오픈 포지션 조회)
 * - dynamodb:DeleteItem (Signal 테이블 — 오픈 포지션 삭제)
 * 
 * ============================================
 * API Gateway 설정:
 * ============================================
 * 1. API Gateway > REST API 생성
 * 2. 리소스 /webhook 추가
 * 3. POST 메서드 → 이 Lambda 연결
 * 4. CORS 활성화
 * 5. 배포 → 스테이지 생성 (prod)
 * 6. URL: https://xxxxx.execute-api.region.amazonaws.com/prod/webhook
 * 
 * ============================================
 * TradingView Alert 메시지 (JSON):
 * ============================================
 * {
 *   "secret": "sigmarket-webhook-secret-2025",
 *   "symbol": "{{ticker}}",
 *   "price": "{{close}}",
 *   "position": "LONG"
 * }
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, ScanCommand, GetCommand, DeleteCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "";
const TABLE_NAME = process.env.SIGNAL_TABLE_NAME || "";

const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);

const SYMBOL_ICONS = {
  BTC: "₿", ETH: "Ξ", XRP: "✕", SOL: "◎",
  BNB: "◆", ADA: "◇", DOGE: "Ð", DOT: "●",
  AVAX: "▲", MATIC: "◈", LINK: "⬡", UNI: "🦄",
};

/**
 * 수익률 계산
 * LONG: (exitPrice - entryPrice) / entryPrice * 100
 * SHORT: (entryPrice - exitPrice) / entryPrice * 100
 */
function calcProfitRate(position, entryPrice, exitPrice) {
  const entry = parseFloat(entryPrice);
  const exit = parseFloat(exitPrice);
  if (isNaN(entry) || isNaN(exit) || entry === 0) return 0;
  return position === "LONG"
    ? parseFloat(((exit - entry) / entry * 100).toFixed(4))
    : parseFloat(((entry - exit) / entry * 100).toFixed(4));
}

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

export const handler = async (event) => {
  // 인입 요청 로깅 (CloudWatch에서 확인)
  console.log("EVENT", JSON.stringify({
    method: event.httpMethod,
    path: event.path,
    resource: event.resource,
    headers: event.headers,
    query: event.queryStringParameters,
    body: event.body,
  }));

  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  // GET — 프론트엔드에서 시그널 목록 조회
  if (event.httpMethod === "GET") {
    try {
      const allItems = [];
      let lastKey = undefined;

      // 페이지네이션으로 전체 Signal 레코드 수집
      do {
        const result = await docClient.send(
          new ScanCommand({
            TableName: TABLE_NAME,
            FilterExpression: "#typename = :typename",
            ExpressionAttributeNames: { "#typename": "__typename" },
            ExpressionAttributeValues: { ":typename": "Signal" },
            ExclusiveStartKey: lastKey,
          })
        );
        allItems.push(...(result.Items || []));
        lastKey = result.LastEvaluatedKey;
      } while (lastKey);

      // createdAt 기준 내림차순 정렬
      const signals = allItems.sort(
        (a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")
      );
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ signals }),
      };
    } catch (err) {
      console.error("Scan error:", err);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Failed to fetch signals" }),
      };
    }
  }

  // POST — TradingView 웹훅 수신
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    console.error("Invalid JSON body:", event.body);
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Invalid JSON body" }),
    };
  }

  try {
    // 시크릿 키 검증
    if (body.secret !== WEBHOOK_SECRET) {
      console.error("Invalid webhook secret");
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: "Unauthorized" }),
      };
    }

    // 필수 필드 검증
    if (!body.symbol || !body.price || !body.position) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Missing required fields: symbol, price, position",
        }),
      };
    }

    // position 검증
    const position = body.position.toUpperCase();
    if (position !== "LONG" && position !== "SHORT") {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'position must be "LONG" or "SHORT"' }),
      };
    }

    // 날짜/시간 (한국 시간 KST, UTC+9)
    const now = new Date();
    const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const date = kst.toISOString().split("T")[0].replace(/-/g, "/");
    const time = kst.toISOString().slice(11, 16);

    // 심볼 정리 (BTCUSDT → BTC)
    const symbol = body.symbol
      .toUpperCase()
      .replace(/USDT$/, "")
      .replace(/USD$/, "")
      .replace(/PERP$/, "");

    const icon = SYMBOL_ICONS[symbol] || "●";
    const signalId = `${symbol}-${Date.now()}`;
    const positionKey = `position-${symbol}`;

    // ── 오픈 포지션 포인터 조회 ───────────────────────────
    const posResult = await docClient.send(
      new GetCommand({ TableName: TABLE_NAME, Key: { id: positionKey } })
    );
    const openPos = posResult.Item;

    if (openPos && openPos.position !== position) {
      // 반대 시그널 → 기존 시그널 레코드에 성과 칼럼 추가
      const profitRate = calcProfitRate(openPos.position, openPos.price, body.price);

      await docClient.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: { id: openPos.openSignalId },
          UpdateExpression:
            "SET profitRate = :pr, exitPrice = :ep, exitDate = :ed, exitTime = :et, #st = :s, updatedAt = :ua",
          ExpressionAttributeNames: { "#st": "status" },
          ExpressionAttributeValues: {
            ":pr": profitRate,
            ":ep": body.price,
            ":ed": date,
            ":et": time,
            ":s": "closed",
            ":ua": now.toISOString(),
          },
        })
      );

      // 포지션 포인터 삭제
      await docClient.send(
        new DeleteCommand({ TableName: TABLE_NAME, Key: { id: positionKey } })
      );

      console.log(`Signal closed: ${symbol} ${openPos.position} profitRate: ${profitRate}%`);
    }

    // ── 새 시그널 저장 ────────────────────────────────────
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          id: signalId,
          symbol,
          date,
          time,
          price: body.price,
          position,
          icon,
          indicator: body.indicator || null,
          status: "open",
          isNew: true,
          source: "tradingview",
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          __typename: "Signal",
        },
      })
    );

    // ── 포지션 포인터 갱신 ────────────────────────────────
    // 같은 방향 연속 시그널이면 포인터를 덮지 않음 (기존 오픈 시그널 id 보존)
    if (!openPos || openPos.position !== position) {
      await docClient.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: {
            id: positionKey,
            openSignalId: signalId,
            position,
            price: body.price,
            indicator: body.indicator || null,
            symbol,
            createdAt: now.toISOString(),
          },
        })
      );
    }

    console.log(`Signal saved: ${symbol} ${position} @ ${body.price}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: "Signal received",
        signal: { id: signalId, symbol, position, price: body.price, date, time },
      }),
    };
  } catch (error) {
    console.error("Webhook error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
