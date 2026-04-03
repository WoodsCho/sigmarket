/**
 * Indicators CRUD Lambda Handler (GET only on frontend)
 * 
 * AWS 콘솔에서 직접 배포하는 Lambda 함수입니다.
 * 런타임: Node.js 20.x
 * 핸들러: handler.handler
 * 
 * ============================================
 * 환경 변수 (Lambda 콘솔에서 설정):
 * ============================================
 * INDICATOR_TABLE_NAME : DynamoDB 테이블 이름 (예: Indicator)
 * ADMIN_SECRET         : 글쓰기용 비밀키 (예: sigma-admin-secret-2026)
 * 
 * ============================================
 * DynamoDB 테이블 구조:
 * ============================================
 * 테이블 이름: Indicator
 * 파티션 키: id (String)
 * 
 * 속성:
 *   id               (String)  - 고유 ID (예: sigma-box-1709xxx)
 *   name             (String)  - 지표 이름 (제목)
 *   subtitle         (String)  - 영문 부제
 *   image            (String)  - 이미지 URL (옵션)
 *   content          (String)  - 내용 (상세 설명)
 *   scores           (String)  - JSON 문자열: [{"label":"방향성","value":4.8,"max":5.0}] (5개)
 *   marketFit        (String)  - JSON 문자열: [{"label":"스윙형","fit":"high"}] (5개)
 *   tags             (String)  - JSON 문자열: ["주식","해외선물","코인"]
 *   strategyId       (String)  - 전략 ID (예: sigma-box, super-target)
 *   strategyCode     (String)  - 자바스크립트 전략 코드 (옵션)
 *   sortOrder        (Number)  - 정렬 순서 (작을수록 위)
 *   isPublished      (Boolean) - 공개 여부
 *   createdAt        (String)  - ISO 날짜
 *   updatedAt        (String)  - ISO 날짜
 * 
 * ============================================
 * API Gateway 설정:
 * ============================================
 * 기존 API Gateway에 /indicators 리소스 추가
 *   GET  /indicators  → 이 Lambda (프론트엔드 조회)
 *   POST /indicators  → 이 Lambda (관리자 글쓰기, 필요 시)
 * Lambda 프록시 통합 활성화 필수
 * CORS 활성화
 * 
 * ============================================
 * 필요한 IAM 권한:
 * ============================================
 * - dynamodb:Scan (Indicator 테이블)
 * - dynamodb:PutItem (Indicator 테이블) — 글쓰기용
 * - dynamodb:GetItem (Indicator 테이블) — 개별 조회용
 * - dynamodb:DeleteItem (Indicator 테이블) — 삭제용
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, PutCommand, GetCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const TABLE_NAME = process.env.INDICATOR_TABLE_NAME || "";
const ADMIN_SECRET = process.env.ADMIN_SECRET || "";
const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || "";
const AWS_REGION = process.env.AWS_REGION || "ap-northeast-2";

const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Content-Type": "application/json",
};

/* ─── JWT 검증 (Cognito ID Token) ─── */
let cachedJwks = null;
async function getJwks() {
  if (cachedJwks) return cachedJwks;
  const url = `https://cognito-idp.${AWS_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}/.well-known/jwks.json`;
  const res = await fetch(url);
  cachedJwks = await res.json();
  return cachedJwks;
}

function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64');
}

async function verifyJwt(token) {
  if (!token || !COGNITO_USER_POOL_ID) return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const header = JSON.parse(base64UrlDecode(parts[0]).toString());
    const payload = JSON.parse(base64UrlDecode(parts[1]).toString());
    
    // 발급자 확인
    const expectedIss = `https://cognito-idp.${AWS_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}`;
    if (payload.iss !== expectedIss) return false;
    
    // 만료 확인
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return false;
    
    // JWKS에서 키 확인
    const jwks = await getJwks();
    const key = jwks.keys?.find(k => k.kid === header.kid);
    if (!key) return false;
    
    // 서명 검증 (crypto)
    const { createVerify, createPublicKey } = await import('node:crypto');
    const pubKey = createPublicKey({ key, format: 'jwk' });
    const verify = createVerify('RSA-SHA256');
    verify.update(parts[0] + '.' + parts[1]);
    return verify.verify(pubKey, base64UrlDecode(parts[2]));
  } catch (err) {
    console.error("JWT verify error:", err);
    return false;
  }
}

/* ─── 전략별 시그널 생성 (Buy→Sell 교대) ─── */
function generateSignals(candles, strategyId, strategyCode) {
  const markers = [];
  const trades = [];

  if (!candles || candles.length < 30) return { markers, trades };

  // 커스텀 전략 코드가 있으면 컴파일
  let customStrategy = null;
  if (strategyCode && strategyCode.trim()) {
    try {
      customStrategy = new Function("candles", "i", "c", "prev", strategyCode);
    } catch {
      console.warn("전략 코드 컴파일 실패, 기본 전략 사용");
    }
  }

  let inPosition = false;
  let entryPrice = 0;
  let entryTime = 0;

  for (let i = 20; i < candles.length; i++) {
    const c = candles[i];
    const prev = candles[i - 1];

    let buyCondition = false;
    let sellCondition = false;

    if (customStrategy) {
      try {
        const result = customStrategy(candles, i, c, prev);
        buyCondition = !!result.buyCondition;
        sellCondition = !!result.sellCondition;
      } catch {
        continue;
      }
    } else {
      switch (strategyId) {
        case "sigma-box": {
          const high20 = Math.max(...candles.slice(i - 20, i).map(x => x.high));
          const low20 = Math.min(...candles.slice(i - 20, i).map(x => x.low));
          buyCondition = c.close > high20 && prev.close <= high20;
          sellCondition = c.close < low20 && prev.close >= low20;
          break;
        }
        case "super-target": {
          const avg5 = candles.slice(i - 5, i).reduce((s, x) => s + x.close, 0) / 5;
          const avg5prev = candles.slice(i - 6, i - 1).reduce((s, x) => s + x.close, 0) / 5;
          const avg20 = candles.slice(i - 20, i).reduce((s, x) => s + x.close, 0) / 20;
          buyCondition = avg5 > avg20 && avg5prev <= avg20;
          sellCondition = avg5 < avg20 && avg5prev >= avg20;
          break;
        }
        case "order-block": {
          const bodySize = Math.abs(c.close - c.open);
          const avgBody = candles.slice(i - 10, i).reduce((s, x) => s + Math.abs(x.close - x.open), 0) / 10;
          buyCondition = prev.close < prev.open && bodySize > avgBody * 2 && c.close > c.open && c.close > prev.open;
          sellCondition = prev.close > prev.open && bodySize > avgBody * 2 && c.close < c.open && c.close < prev.open;
          break;
        }
        case "rsi-bb": {
          const gains = [], losses = [];
          for (let j = i - 13; j <= i; j++) {
            const diff = candles[j].close - candles[j - 1].close;
            gains.push(diff > 0 ? diff : 0);
            losses.push(diff < 0 ? -diff : 0);
          }
          const avgGain = gains.reduce((a, b) => a + b, 0) / 14;
          const avgLoss = losses.reduce((a, b) => a + b, 0) / 14;
          const rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
          const prevGains = [], prevLosses = [];
          for (let j = i - 14; j <= i - 1; j++) {
            const diff = candles[j].close - candles[j - 1].close;
            prevGains.push(diff > 0 ? diff : 0);
            prevLosses.push(diff < 0 ? -diff : 0);
          }
          const prevAvgGain = prevGains.reduce((a, b) => a + b, 0) / 14;
          const prevAvgLoss = prevLosses.reduce((a, b) => a + b, 0) / 14;
          const prevRsi = prevAvgLoss === 0 ? 100 : 100 - 100 / (1 + prevAvgGain / prevAvgLoss);
          buyCondition = prevRsi < 30 && rsi >= 30;
          sellCondition = prevRsi > 70 && rsi <= 70;
          break;
        }
      }
    }

    if (!inPosition && buyCondition) {
      inPosition = true;
      entryPrice = c.close;
      entryTime = c.time;
      markers.push({
        time: c.time,
        position: "belowBar",
        color: "#06b6d4",
        shape: "arrowUp",
        text: "◉ BUY",
        size: 3,
      });
    } else if (inPosition && sellCondition) {
      const pnl = ((c.close - entryPrice) / entryPrice) * 100;
      inPosition = false;
      trades.push({
        buyTime: entryTime,
        sellTime: c.time,
        buyPrice: entryPrice,
        sellPrice: c.close,
        pnl,
      });
      markers.push({
        time: c.time,
        position: "aboveBar",
        color: pnl >= 0 ? "#06b6d4" : "#ef4444",
        shape: "arrowDown",
        text: `${pnl >= 0 ? "▲" : "▼"} ${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}%`,
        size: 3,
      });
    }
  }

  return { markers, trades };
}

export const handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  // GET — 인디케이터 목록 조회 (프론트엔드)
  if (event.httpMethod === "GET") {
    try {
      const result = await docClient.send(
        new ScanCommand({
          TableName: TABLE_NAME,
          FilterExpression: "isPublished = :pub",
          ExpressionAttributeValues: { ":pub": true },
        })
      );

      // sortOrder 기준 오름차순 정렬
      const indicators = (result.Items || [])
        .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999))
        .map((item) => {
          // strategyCode는 프론트엔드에 절대 노출하지 않음
          const { strategyCode, ...rest } = item;
          return {
            ...rest,
            scores: typeof item.scores === "string" ? JSON.parse(item.scores) : item.scores || [],
            marketFit: typeof item.marketFit === "string" ? JSON.parse(item.marketFit) : item.marketFit || [],
            tags: typeof item.tags === "string" ? JSON.parse(item.tags) : item.tags || [],
          };
        });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ indicators }),
      };
    } catch (err) {
      console.error("Scan error:", err);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Failed to fetch indicators" }),
      };
    }
  }

  // POST — 인디케이터 추가/수정/삭제 (관리자용) + 시그널 실행
  if (event.httpMethod === "POST") {
    try {
      const body = JSON.parse(event.body || "{}");

      // ─── 시그널 실행 (인증 불필요, 전략 코드 미노출) ───
      if (body._action === "signals") {
        const { strategyId, candles } = body;
        if (!strategyId || !Array.isArray(candles)) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: "strategyId and candles are required" }) };
        }

        // DB에서 전략 코드 조회
        let strategyCode = "";
        try {
          const items = await docClient.send(
            new ScanCommand({
              TableName: TABLE_NAME,
              FilterExpression: "strategyId = :sid",
              ExpressionAttributeValues: { ":sid": strategyId },
              ProjectionExpression: "strategyCode",
            })
          );
          if (items.Items?.[0]?.strategyCode) {
            strategyCode = items.Items[0].strategyCode;
          }
        } catch { /* DB 조회 실패 시 내장 전략으로 폴백 */ }

        const result = generateSignals(candles, strategyId, strategyCode);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(result),
        };
      }

      // 관리자 인증 (JWT 또는 ADMIN_SECRET)
      const authHeader = event.headers?.Authorization || event.headers?.authorization || "";
      const token = authHeader.replace("Bearer ", "");
      const jwtValid = await verifyJwt(token);
      const secretValid = ADMIN_SECRET && body.secret === ADMIN_SECRET;
      
      if (!jwtValid && !secretValid) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: "Unauthorized" }),
        };
      }

      // 삭제 액션
      if (body._action === "delete") {
        if (!body.id) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: "id is required for delete" }) };
        }
        await docClient.send(new DeleteCommand({ TableName: TABLE_NAME, Key: { id: body.id } }));
        console.log(`Indicator deleted: ${body.id}`);
        return { statusCode: 200, headers, body: JSON.stringify({ message: "Deleted", id: body.id }) };
      }

      if (!body.name) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "name is required" }),
        };
      }

      const now = new Date();
      const id = body.id || `${body.name.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}`;

      const item = {
        id,
        name: body.name,
        subtitle: body.subtitle || "",
        content: body.content || "",
        image: body.image || "",
        // 배열은 JSON 문자열로 저장
        scores: JSON.stringify(body.scores || []),
        marketFit: JSON.stringify(body.marketFit || []),
        tags: JSON.stringify(body.tags || []),
        strategyId: body.strategyId || "sigma-box",
        strategyCode: body.strategyCode || "",
        sortOrder: body.sortOrder ?? 999,
        isPublished: body.isPublished ?? true,
        createdAt: body.createdAt || now.toISOString(),
        updatedAt: now.toISOString(),
      };

      await docClient.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: item,
        })
      );

      console.log(`Indicator saved: ${item.name} (${id})`);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: "Indicator saved", indicator: { ...item, scores: body.scores, marketFit: body.marketFit, tags: body.tags } }),
      };
    } catch (err) {
      console.error("POST error:", err);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Internal server error" }),
      };
    }
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: "Method not allowed" }),
  };
};
