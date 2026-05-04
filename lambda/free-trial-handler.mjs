/**
 * Free Trial Registration Lambda Handler
 *
 * AWS 콘솔에서 직접 배포하는 Lambda 함수입니다.
 * 런타임: Node.js 20.x
 * 핸들러: free-trial-handler.handler
 *
 * ============================================
 * 환경 변수 (Lambda 콘솔에서 설정):
 * ============================================
 * FREE_TRIAL_TABLE_NAME : DynamoDB 테이블 이름 (예: FreeTrial)
 *
 * ============================================
 * DynamoDB 테이블 스키마:
 * ============================================
 * 테이블명: FreeTrial
 * 파티션 키: email (String)
 * 추가 속성: telegram (String), registeredAt (String/ISO), trialEnd (String/ISO)
 *
 * ============================================
 * 필요한 IAM 권한:
 * ============================================
 * - dynamodb:PutItem (FreeTrial 테이블)
 * - dynamodb:GetItem (FreeTrial 테이블)
 *
 * ============================================
 * API Gateway 설정:
 * ============================================
 * 1. API Gateway > REST API 생성 (또는 기존 API에 리소스 추가)
 * 2. 리소스 /free-trial 추가
 * 3. POST 메서드 → 이 Lambda 연결
 * 4. CORS 활성화
 * 5. 배포 → 스테이지 (prod)
 * 6. 프론트 .env에 VITE_FREE_TRIAL_API_URL 설정
 *
 * ============================================
 * 응답 형식:
 * ============================================
 * 201 Created   : 신청 성공 { message: "ok" }
 * 409 Conflict  : 이미 신청 { alreadyRegistered: true, message: "..." }
 * 400 Bad Request: 입력 오류 { message: "..." }
 * 500 Error     : 서버 오류 { message: "..." }
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

const TABLE_NAME = process.env.FREE_TRIAL_TABLE_NAME || "FreeTrial";

const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);

const HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};

export const handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: HEADERS, body: "" };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const email = (body.email || "").trim().toLowerCase();
    const telegram = (body.telegram || "").trim().replace(/^@/, "");

    // 입력값 검증
    if (!email || !telegram) {
      return {
        statusCode: 400,
        headers: HEADERS,
        body: JSON.stringify({ message: "이메일과 텔레그램 아이디를 모두 입력해 주세요." }),
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        statusCode: 400,
        headers: HEADERS,
        body: JSON.stringify({ message: "올바른 이메일 형식이 아닙니다." }),
      };
    }

    // 중복 확인
    const existing = await docClient.send(
      new GetCommand({ TableName: TABLE_NAME, Key: { email } })
    );

    if (existing.Item) {
      return {
        statusCode: 409,
        headers: HEADERS,
        body: JSON.stringify({
          alreadyRegistered: true,
          message: "해당 이메일로 이미 무료 체험을 신청하셨습니다.",
        }),
      };
    }

    // 신규 등록
    const now = new Date();
    const trialEnd = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // +3일

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          email,
          telegram,
          registeredAt: now.toISOString(),
          trialEnd: trialEnd.toISOString(),
          status: "active",
        },
        // 혹시 모를 race condition 방지 - email이 없을 때만 삽입
        ConditionExpression: "attribute_not_exists(email)",
      })
    );

    return {
      statusCode: 201,
      headers: HEADERS,
      body: JSON.stringify({ message: "ok" }),
    };
  } catch (err) {
    // ConditionExpression 실패 = 동시 중복 요청
    if (err.name === "ConditionalCheckFailedException") {
      return {
        statusCode: 409,
        headers: HEADERS,
        body: JSON.stringify({
          alreadyRegistered: true,
          message: "해당 이메일로 이미 무료 체험을 신청하셨습니다.",
        }),
      };
    }

    console.error("[free-trial-handler] error:", err);
    return {
      statusCode: 500,
      headers: HEADERS,
      body: JSON.stringify({ message: "서버 오류가 발생했습니다." }),
    };
  }
};
