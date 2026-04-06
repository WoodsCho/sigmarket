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
 *   content          (String)  - 내용 (상세 설명, 레거시)
 *   sections         (String)  - JSON 문자열: 구조화된 섹션 배열
 *                                [{"title":"...", "body":"...", "layout":"half|full",
 *                                  "highlight":"...", "bullets":[], "infoCards":[],
 *                                  "gridItems":[], "combo":{}}]
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

/* ─── 안전한 JSON 파싱 (잘못된 데이터로 전체 API 안 터지게) ─── */
function safeJsonParse(val, fallback = []) {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try { return JSON.parse(val); } catch { return fallback; }
  }
  return fallback;
}

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

/* ═══════════════════════════════════════════════════════════════
   범용 전략 실행 엔진
   ─ 어떤 형식의 JS 코드를 넣어도 시그널(BUY/SELL)을 추출한다.
   ─ 실행 순서: 엔진(class) → 함수 → per-candle → 내장 폴백
   ═══════════════════════════════════════════════════════════════ */

/**
 * BUY/SELL 교대 방식으로 markers + trades를 생성하는 공통 변환기
 * @param {Array} signalArray - [{time, close, long: bool, short: bool}, ...]
 */
function signalsToMarkersTrades(signalArray) {
  const markers = [];
  const trades = [];
  let inPosition = false;
  let entryPrice = 0;
  let entryTime = 0;

  for (const s of signalArray) {
    if (!s) continue;
    const time = s.time;
    const price = s.close ?? s.price ?? 0;

    if (!inPosition && s.long) {
      inPosition = true;
      entryPrice = price;
      entryTime = time;
      markers.push({ time, position: "belowBar", color: "#06b6d4", shape: "arrowUp", text: "◉ BUY", size: 3 });
    } else if (inPosition && s.short) {
      const pnl = entryPrice ? ((price - entryPrice) / entryPrice) * 100 : 0;
      inPosition = false;
      trades.push({ buyTime: entryTime, sellTime: time, buyPrice: entryPrice, sellPrice: price, pnl });
      markers.push({ time, position: "aboveBar", color: pnl >= 0 ? "#06b6d4" : "#ef4444", shape: "arrowDown", text: `${pnl >= 0 ? "▲" : "▼"} ${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}%`, size: 3 });
    }
  }
  return { markers, trades };
}

/**
 * 엔진 결과 객체를 탐색하여 long/short 불리언을 자동 추출
 * 지원하는 출력 형태:
 *   - { longSignal, shortSignal }
 *   - { long, short }
 *   - { buyCondition, sellCondition }
 *   - { buy, sell }
 *   - 중첩: { box1: { signal: { longSignal, shortSignal } } }
 *   - 중첩: { signal: { long, short } }
 */
function extractSignal(obj) {
  if (!obj || typeof obj !== "object") return { long: false, short: false };

  // 직접 키가 있는 경우
  if ("longSignal" in obj)     return { long: !!obj.longSignal,     short: !!obj.shortSignal };
  if ("long" in obj)           return { long: !!obj.long,           short: !!obj.short };
  if ("buyCondition" in obj)   return { long: !!obj.buyCondition,   short: !!obj.sellCondition };
  if ("buy" in obj)            return { long: !!obj.buy,            short: !!obj.sell };

  // signal 키 안에 있는 경우
  if (obj.signal)              return extractSignal(obj.signal);

  // box1 > signal 같은 중첩 구조 (첫 번째 box* 키 탐색)
  for (const key of Object.keys(obj)) {
    if (/^box/i.test(key) && obj[key]?.signal) {
      return extractSignal(obj[key].signal);
    }
  }

  // 어떤 키에든 longSignal/long/buy 가 있으면 재귀
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === "object" && obj[key] !== null) {
      const found = extractSignal(obj[key]);
      if (found.long || found.short) return found;
    }
  }

  return { long: false, short: false };
}

/**
 * 전략 코드 안전 실행 — 코드를 new Function()으로 감싸서 실행
 * @returns 실행 결과값 (class, function, array, object 등 뭐든)
 */
function safeExec(code, args = {}) {
  try {
    const argNames = Object.keys(args);
    const argValues = Object.values(args);
    const fn = new Function(...argNames, code);
    return fn(...argValues);
  } catch (err) {
    console.warn("safeExec 실패:", err.message);
    return null;
  }
}

/* ──────────────────────────────
   패턴 1: class 기반 엔진
   class ○○ { static run(candles, config) → Array }
   ────────────────────────────── */
function tryClassEngine(candles, code) {
  const classMatch = code.match(/class\s+(\w+)/);
  if (!classMatch) return null;

  const className = classMatch[1];
  const EngineClass = safeExec(`${code};\nreturn ${className};`);
  if (!EngineClass) return null;

  // static run(candles, config) 찾기
  const runFn = EngineClass.run || EngineClass.execute || EngineClass.generate;
  if (typeof runFn !== "function") return null;

  // config 자동 탐지: 코드에 config 기본값이 있으면 그걸 쓰고, 아니면 범용 기본값
  const config = {
    b1: { length: 5, sigType: 1.0 },
    b2: { length: 6, sigType: 1.0 },
    b3: { length: 98, sigType: 1.0 },
  };

  try {
    const result = runFn.call(EngineClass, candles, config);
    if (!Array.isArray(result)) return null;

    // 결과 배열에서 자동으로 시그널 추출
    const signals = result.map((r, i) => {
      const candle = candles[i] || {};
      const { long, short } = extractSignal(r);
      return { time: candle.time || r.time, close: candle.close || r.close || 0, long, short };
    });

    return signalsToMarkersTrades(signals);
  } catch (err) {
    console.warn("class 엔진 run() 실패:", err.message);
    return null;
  }
}

/* ──────────────────────────────
   패턴 2: 전체 배열 리턴 함수
   function ○○(candles) → Array<{time, long, short}>
   ────────────────────────────── */
function tryBatchFunction(candles, code) {
  // 함수 이름 탐지: function xxx(, const xxx = (
  const fnMatch = code.match(/(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:\(|function))/);
  if (!fnMatch) return null;

  const fnName = fnMatch[1] || fnMatch[2];
  const fn = safeExec(`${code};\nreturn ${fnName};`);
  if (typeof fn !== "function") return null;

  try {
    const result = fn(candles);
    if (!Array.isArray(result)) return null;

    const signals = result.map((r, i) => {
      if (!r) return null;
      const candle = candles[i] || candles.find(c => c.time === r.time) || {};
      const { long, short } = extractSignal(r);
      return { time: r.time || candle.time, close: candle.close || r.close || r.price || 0, long, short };
    });

    return signalsToMarkersTrades(signals.filter(Boolean));
  } catch (err) {
    console.warn("배치 함수 실패:", err.message);
    return null;
  }
}

/* ──────────────────────────────
   패턴 3: per-candle 코드
   candles, i, c, prev 변수로 → {buyCondition, sellCondition} 리턴
   ────────────────────────────── */
function tryPerCandle(candles, code) {
  let fn;
  try { fn = new Function("candles", "i", "c", "prev", code); } catch { return null; }

  const signals = [];
  for (let i = 1; i < candles.length; i++) {
    const c = candles[i];
    const prev = candles[i - 1];
    try {
      const r = fn(candles, i, c, prev);
      if (!r || typeof r !== "object") { signals.push(null); continue; }
      const { long, short } = extractSignal(r);
      signals.push({ time: c.time, close: c.close, long, short });
    } catch {
      signals.push(null);
    }
  }

  const result = signalsToMarkersTrades(signals.filter(Boolean));
  return result.markers.length > 0 ? result : null;
}

/* ──────────────────────────────
   패턴 4: 코드 전체 실행 후 결과 자동 탐지
   마지막 표현식이 배열이면 시그널로 해석
   ────────────────────────────── */
function tryAutoDetect(candles, code) {
  // 코드를 즉시실행함수로 감싸서 마지막 값 리턴
  const wrapped = `const candles = arguments[0];\n${code}`;
  try {
    const result = new Function(wrapped)(candles);

    // 배열이면 시그널 배열로 해석
    if (Array.isArray(result) && result.length > 0) {
      const first = result[0];
      if (first && typeof first === "object") {
        const signals = result.map((r, i) => {
          if (!r) return null;
          const candle = candles[i] || candles.find(c => c.time === r.time) || {};
          const { long, short } = extractSignal(r);
          return { time: r.time || candle.time, close: candle.close || r.close || 0, long, short };
        });
        const res = signalsToMarkersTrades(signals.filter(Boolean));
        if (res.markers.length > 0) return res;
      }
    }

    // 객체에 markers가 직접 들어있는 경우 { markers, trades }
    if (result && typeof result === "object" && Array.isArray(result.markers)) {
      return { markers: result.markers, trades: result.trades || [] };
    }

    return null;
  } catch (err) {
    console.warn("자동 탐지 실패:", err.message);
    return null;
  }
}

/* ──────────────────────────────
   내장 전략 (폴백)
   ────────────────────────────── */
function builtinStrategy(candles, strategyId) {
  const signals = [];

  for (let i = 20; i < candles.length; i++) {
    const c = candles[i];
    const prev = candles[i - 1];
    let long = false;
    let short = false;

    switch (strategyId) {
      case "sigma-box": {
        const high20 = Math.max(...candles.slice(i - 20, i).map(x => x.high));
        const low20 = Math.min(...candles.slice(i - 20, i).map(x => x.low));
        long = c.close > high20 && prev.close <= high20;
        short = c.close < low20 && prev.close >= low20;
        break;
      }
      case "super-target": {
        const avg5 = candles.slice(i - 5, i).reduce((s, x) => s + x.close, 0) / 5;
        const avg5prev = candles.slice(i - 6, i - 1).reduce((s, x) => s + x.close, 0) / 5;
        const avg20 = candles.slice(i - 20, i).reduce((s, x) => s + x.close, 0) / 20;
        long = avg5 > avg20 && avg5prev <= avg20;
        short = avg5 < avg20 && avg5prev >= avg20;
        break;
      }
      case "order-block": {
        const bodySize = Math.abs(c.close - c.open);
        const avgBody = candles.slice(i - 10, i).reduce((s, x) => s + Math.abs(x.close - x.open), 0) / 10;
        long = prev.close < prev.open && bodySize > avgBody * 2 && c.close > c.open && c.close > prev.open;
        short = prev.close > prev.open && bodySize > avgBody * 2 && c.close < c.open && c.close < prev.open;
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
        long = prevRsi < 30 && rsi >= 30;
        short = prevRsi > 70 && rsi <= 70;
        break;
      }
    }

    signals.push({ time: c.time, close: c.close, long, short });
  }

  return signalsToMarkersTrades(signals);
}

/* ──────────────────────────────
   메인 함수: 순서대로 시도
   ────────────────────────────── */
function generateSignals(candles, strategyId, strategyCode) {
  if (!candles || candles.length < 30) return { markers: [], trades: [] };

  if (strategyCode && strategyCode.trim()) {
    const code = strategyCode.trim();
    const attempts = [
      ["class 엔진",   () => tryClassEngine(candles, code)],
      ["배치 함수",    () => tryBatchFunction(candles, code)],
      ["per-candle",   () => tryPerCandle(candles, code)],
      ["자동 탐지",    () => tryAutoDetect(candles, code)],
    ];

    for (const [label, attempt] of attempts) {
      try {
        const result = attempt();
        if (result && result.markers.length > 0) {
          console.log(`✅ ${label} 성공: markers=${result.markers.length}, trades=${result.trades.length}`);
          return result;
        }
      } catch (err) {
        console.warn(`${label} 실패:`, err.message);
      }
    }

    console.warn("모든 커스텀 전략 실행 실패 → 내장 전략 폴백");
  }

  return builtinStrategy(candles, strategyId);
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
            scores: safeJsonParse(item.scores),
            marketFit: safeJsonParse(item.marketFit),
            tags: safeJsonParse(item.tags),
            sections: safeJsonParse(item.sections),
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
        sections: JSON.stringify(body.sections || []),
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

      // 응답에서 strategyCode 제외 (관리자 응답에서도 코드 미노출)
      const { strategyCode: _sc, scores: _s, marketFit: _m, tags: _t, sections: _sec, ...safeItem } = item;
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: "Indicator saved",
          indicator: {
            ...safeItem,
            scores: body.scores || [],
            marketFit: body.marketFit || [],
            tags: body.tags || [],
            sections: body.sections || [],
          },
        }),
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
