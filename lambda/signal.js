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
 * - dynamodb:PutItem (Signal 테이블)
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
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "";
const TABLE_NAME = process.env.SIGNAL_TABLE_NAME || "";

const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);

const SYMBOL_ICONS = {
  BTC: "₿", ETH: "Ξ", XRP: "✕", SOL: "◎",
  BNB: "◆", ADA: "◇", DOGE: "Ð", DOT: "●",
  AVAX: "▲", MATIC: "◈", LINK: "⬡", UNI: "🦄",
};

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

export const handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  // GET — 프론트엔드에서 시그널 목록 조회
  if (event.httpMethod === "GET") {
    try {
      const result = await docClient.send(
        new ScanCommand({
          TableName: TABLE_NAME,
          Limit: 20,
        })
      );
      // createdAt 기준 내림차순 정렬
      const signals = (result.Items || []).sort(
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

    // DynamoDB에 저장
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
          isNew: true,
          source: "tradingview",
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          __typename: "Signal",
        },
      })
    );

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
