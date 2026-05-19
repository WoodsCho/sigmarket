/**
 * Telegram Bot Webhook Handler
 *
 * 사용자가 봇에게 /start 를 보내면 chat_id를 FreeTrial DB에 저장합니다.
 * 이후 시그널 Lambda가 이 chat_id로 DM을 발송합니다.
 *
 * ============================================
 * 환경 변수 (Lambda 콘솔에서 설정):
 * ============================================
 * TELEGRAM_BOT_TOKEN   : BotFather에서 받은 토큰 (예: 123456:ABC-DEF...)
 * FREE_TRIAL_TABLE_NAME: DynamoDB 테이블 이름 (예: FreeTrial)
 *
 * ============================================
 * DynamoDB FreeTrial 테이블 스키마:
 * ============================================
 * 파티션 키 : email (String)
 * 기존 속성 : telegram, registeredAt, trialEnd, status
 * 추가 속성 : chatId (Number) ← 이 Lambda가 저장
 *
 * ============================================
 * 필요한 IAM 권한:
 * ============================================
 * - dynamodb:Scan        (FreeTrial 테이블 — username 조회)
 * - dynamodb:UpdateItem  (FreeTrial 테이블 — chatId 저장)
 *
 * ============================================
 * Telegram Bot Webhook 등록 방법:
 * ============================================
 * 1. @BotFather 에서 /newbot → 봇 이름/username 설정 → 토큰 발급
 * 2. API Gateway에 이 Lambda 연결 (POST /telegram-webhook)
 * 3. 아래 URL을 브라우저에서 한 번 열어 webhook 등록:
 *    https://api.telegram.org/bot{TOKEN}/setWebhook?url={API_GATEWAY_URL}
 * 4. 확인:
 *    https://api.telegram.org/bot{TOKEN}/getWebhookInfo
 *
 * ============================================
 * 사용자 흐름:
 * ============================================
 * 1. 무료 체험 신청 (웹사이트에서 이메일 + 텔레그램 username 입력)
 * 2. 안내: "텔레그램에서 @봇이름 을 검색하고 /start 를 보내주세요"
 * 3. 사용자가 /start 전송 → 이 Lambda 실행 → chatId 저장
 * 4. 이후 시그널 발생 시 signal.js가 chatId로 DM 발송
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const BOT_TOKEN       = process.env.TELEGRAM_BOT_TOKEN || "";
const TABLE_NAME      = process.env.FREE_TRIAL_TABLE_NAME || "FreeTrial";
const TELEGRAM_API    = `https://api.telegram.org/bot${BOT_TOKEN}`;

const ddbClient  = new DynamoDBClient({});
const docClient  = DynamoDBDocumentClient.from(ddbClient);

const HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

/** Telegram sendMessage 호출 */
async function sendMessage(chatId, text, parseMode = "HTML") {
  const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: parseMode }),
  });
  const data = await res.json();
  if (!data.ok) console.error("sendMessage failed:", data);
  return data;
}

/** username으로 FreeTrial 레코드 조회 (username은 @ 없는 소문자) */
async function findUserByTelegram(username) {
  const result = await docClient.send(
    new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: "#tg = :tg",
      ExpressionAttributeNames: { "#tg": "telegram" },
      ExpressionAttributeValues: { ":tg": username.toLowerCase() },
    })
  );
  return result.Items?.[0] || null;
}

/** FreeTrial 레코드에 chatId 저장 */
async function saveChatId(email, chatId) {
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { email },
      UpdateExpression: "SET chatId = :cid",
      ExpressionAttributeValues: { ":cid": chatId },
    })
  );
}

export const handler = async (event) => {
  // Telegram은 POST로 update를 전송
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: HEADERS, body: "" };
  }

  let update;
  try {
    update = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, headers: HEADERS, body: "Bad Request" };
  }

  const message = update.message;
  if (!message) {
    // callback_query 등 다른 update 타입은 무시
    return { statusCode: 200, headers: HEADERS, body: "ok" };
  }

  const chatId   = message.chat.id;
  const text     = (message.text || "").trim();
  const fromUser = message.from;
  const username = (fromUser?.username || "").toLowerCase();

  console.log("Telegram update:", JSON.stringify({ chatId, text, username }));

  // /start 커맨드만 처리
  if (!text.startsWith("/start")) {
    await sendMessage(chatId, "📡 시그널이 발생하면 자동으로 알림을 보내드립니다.");
    return { statusCode: 200, headers: HEADERS, body: "ok" };
  }

  // username이 없는 경우 (텔레그램 username 미설정 사용자)
  if (!username) {
    await sendMessage(
      chatId,
      "⚠️ 텔레그램 username이 설정되어 있지 않습니다.\n" +
      "텔레그램 <b>설정 → 내 프로필 → 사용자 이름</b>에서 username을 먼저 설정해 주세요."
    );
    return { statusCode: 200, headers: HEADERS, body: "ok" };
  }

  try {
    const user = await findUserByTelegram(username);

    if (!user) {
      await sendMessage(
        chatId,
        "❌ 무료 체험 신청 내역을 찾을 수 없습니다.\n" +
        "웹사이트에서 먼저 무료 체험을 신청해 주세요."
      );
      return { statusCode: 200, headers: HEADERS, body: "ok" };
    }

    // 체험 기간 만료 확인
    const isExpired = user.trialEnd && new Date(user.trialEnd) < new Date();
    if (isExpired) {
      await sendMessage(
        chatId,
        "⏰ 3일 무료 체험 기간이 만료되었습니다.\n" +
        "계속 이용하시려면 구독을 시작해 주세요."
      );
      return { statusCode: 200, headers: HEADERS, body: "ok" };
    }

    // chatId 저장
    await saveChatId(user.email, chatId);
    console.log(`chatId saved: ${username} → ${chatId}`);

    const trialEnd = user.trialEnd
      ? new Date(user.trialEnd).toLocaleDateString("ko-KR", {
          timeZone: "Asia/Seoul",
          year: "numeric", month: "2-digit", day: "2-digit",
        })
      : "—";

    await sendMessage(
      chatId,
      `✅ <b>시그널 수신 등록 완료!</b>\n\n` +
      `안녕하세요, <b>${fromUser.first_name || username}</b>님 👋\n` +
      `이제 시그널이 발생하면 바로 알림을 보내드립니다.\n\n` +
      `📅 무료 체험 만료: <b>${trialEnd}</b>\n\n` +
      `<i>시그널이 오면 자동으로 메시지가 옵니다. 별도 입력은 불필요합니다.</i>`
    );
  } catch (err) {
    console.error("Handler error:", err);
    await sendMessage(chatId, "⚠️ 서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
  }

  return { statusCode: 200, headers: HEADERS, body: "ok" };
};
