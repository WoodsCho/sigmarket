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
 * FREE_TRIAL_TABLE  : 무료 체험 사용자 테이블 (예: FreeTrial)
 * TELEGRAM_BOT_TOKEN: BotFather 토큰 (예: 123456:ABC-DEF...)
 * 
 * ============================================
 * 필요한 IAM 권한:
 * ============================================
 * - dynamodb:PutItem   (Signal 테이블)
 * - dynamodb:GetItem   (Signal 테이블 — 오픈 포지션 조회)
 * - dynamodb:DeleteItem (Signal 테이블 — 오픈 포지션 삭제)
 * - dynamodb:Scan      (FreeTrial 테이블 — 텔레그램 수신자 조회)
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
import { DynamoDBDocumentClient, PutCommand, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const WEBHOOK_SECRET    = process.env.WEBHOOK_SECRET || "";
const TABLE_NAME        = process.env.SIGNAL_TABLE_NAME || "";
const FREE_TRIAL_TABLE  = process.env.FREE_TRIAL_TABLE || "FreeTrial";
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_API      = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
const SITE_URL          = process.env.SITE_URL || "https://sigma.kr";

const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);

const SYMBOL_ICONS = {
  BTC: "₿", ETH: "Ξ", XRP: "✕", SOL: "◎",
  BNB: "◆", ADA: "◇", DOGE: "Ð", DOT: "●",
  AVAX: "▲", MATIC: "◈", LINK: "⬡", UNI: "🦄",
};

/**
 * 텔레그램 — 활성 무료 체험 사용자 전체에게 시그널 DM 발송
 * 오류가 나도 메인 시그널 저장 흐름에 영향 없도록 내부에서 catch
 */
async function sendTelegramSignals({ symbol, position, price, indicator, date, time }) {
  if (!TELEGRAM_BOT_TOKEN) return; // 토큰 미설정 시 스킵

  const now = new Date().toISOString();

  // 활성 사용자 중 chatId가 등록된 사람만 조회
  let users = [];
  try {
    const result = await docClient.send(
      new ScanCommand({
        TableName: FREE_TRIAL_TABLE,
        FilterExpression: "#st = :active AND attribute_exists(chatId)",
        ExpressionAttributeNames: { "#st": "status" },
        ExpressionAttributeValues: { ":active": "active" },
      })
    );
    // 체험 기간 내 사용자만 필터
    users = (result.Items || []).filter(
      (u) => u.trialEnd && u.trialEnd > now
    );
  } catch (err) {
    console.error("FreeTrial scan error:", err);
    return;
  }

  if (users.length === 0) return;

  const emoji    = position === "LONG" ? "🟢" : "🔴";
  const posLabel = position === "LONG" ? "LONG  ↑" : "SHORT ↓";
  const indLine  = indicator ? `\n📊 지표:  <b>${indicator}</b>` : "";

  const text =
    `${emoji} <b>${posLabel}  ${symbol}/USDT</b>\n` +
    `━━━━━━━━━━━━━━━━\n` +
    `💰 진입가: <b>${price}</b>${indLine}\n` +
    `🕐 시각:   ${date} ${time} KST\n` +
    `━━━━━━━━━━━━━━━━\n` +
    `<a href="${SITE_URL}/signals">시그널 전체 보기 →</a>`;

  // 각 사용자에게 병렬 발송 (실패해도 다른 사람에게 영향 없음)
  await Promise.allSettled(
    users.map((u) =>
      fetch(`${TELEGRAM_API}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id:    u.chatId,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      })
        .then((r) => r.json())
        .then((r) => { if (!r.ok) console.error(`sendMessage failed (${u.chatId}):`, r); })
        .catch((err) => console.error(`sendMessage error (${u.chatId}):`, err))
    )
  );

  console.log(`Telegram: ${users.length}명에게 시그널 발송 완료`);
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

    // Pine Script에서 계산된 수익 데이터
    const profitPct   = body.profit_pct  != null ? parseFloat(body.profit_pct)  : null;
    const hasProfitData = profitPct != null && !isNaN(profitPct);
    const entryPrice  = body.entry_price != null ? String(body.entry_price) : body.price;
    const peakPrice   = body.peak_price  != null ? String(body.peak_price)  : null;

    // ── 완료 보고: 기존 open 시그널 업데이트 ──────────────
    if (hasProfitData) {
      // 같은 symbol + position의 가장 최근 open 시그널 조회
      const scanResult = await docClient.send(new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "#sym = :sym AND #pos = :pos AND #st = :open AND #typename = :typename",
        ExpressionAttributeNames: {
          "#sym": "symbol", "#pos": "position",
          "#st": "status",  "#typename": "__typename",
        },
        ExpressionAttributeValues: {
          ":sym": symbol, ":pos": position,
          ":open": "open", ":typename": "Signal",
        },
      }));

      const openSignals = (scanResult.Items || []).sort(
        (a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")
      );
      const target = openSignals[0];

      if (target) {
        await docClient.send(new UpdateCommand({
          TableName: TABLE_NAME,
          Key: { id: target.id },
          UpdateExpression:
            "SET profitRate = :pr, exitPrice = :ep, exitDate = :ed, exitTime = :et, #st = :closed, updatedAt = :ua",
          ExpressionAttributeNames: { "#st": "status" },
          ExpressionAttributeValues: {
            ":pr": profitPct, ":ep": peakPrice,
            ":ed": date,      ":et": time,
            ":closed": "closed", ":ua": now.toISOString(),
          },
        }));
        console.log(`Signal closed: ${symbol} ${position} profit: ${profitPct}%`);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: "Signal closed", id: target.id, profitRate: profitPct }),
        };
      }
      // open 시그널이 없으면 closed 레코드로 신규 저장 (fallback)
    }

    // ── 진입 시그널: 신규 open 레코드 저장 ───────────────
    const signalId = `${symbol}-${Date.now()}`;
    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        id: signalId,
        symbol,
        date,
        time,
        price: entryPrice,
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
    }));

    console.log(`Signal saved: ${symbol} ${position} @ ${entryPrice}`);

    // ── 텔레그램 시그널 발송 (비동기, 실패해도 응답에 영향 없음) ──
    sendTelegramSignals({ symbol, position, price: entryPrice, indicator: body.indicator, date, time })
      .catch((err) => console.error("sendTelegramSignals unhandled:", err));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: "Signal received",
        signal: { id: signalId, symbol, position, price: entryPrice, date, time },
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
