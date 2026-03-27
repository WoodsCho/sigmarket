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

const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Content-Type": "application/json",
};

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
        .map((item) => ({
          ...item,
          // DynamoDB에 JSON 문자열로 저장된 필드 파싱
          scores: typeof item.scores === "string" ? JSON.parse(item.scores) : item.scores || [],
          marketFit: typeof item.marketFit === "string" ? JSON.parse(item.marketFit) : item.marketFit || [],
          tags: typeof item.tags === "string" ? JSON.parse(item.tags) : item.tags || [],
        }));

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

  // POST — 인디케이터 추가/수정/삭제 (관리자용)
  if (event.httpMethod === "POST") {
    try {
      const body = JSON.parse(event.body || "{}");

      // 관리자 인증
      if (body.secret !== ADMIN_SECRET) {
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
