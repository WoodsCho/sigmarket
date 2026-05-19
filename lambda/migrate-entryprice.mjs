/**
 * 1회용 마이그레이션: entryPrice → price 통일
 * 
 * 사용법:
 * 1. Lambda 콘솔에서 새 함수 생성 (Node.js 20.x)
 * 2. 이 코드 붙여넣기
 * 3. 환경변수 SIGNAL_TABLE_NAME 설정
 * 4. IAM: dynamodb:Scan, dynamodb:UpdateItem 권한 필요
 * 5. 테스트 이벤트 {} 로 1회 실행
 * 6. 완료 후 함수 삭제
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const TABLE_NAME = process.env.SIGNAL_TABLE_NAME || "";
const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);

export const handler = async () => {
  let migrated = 0;
  let lastKey = undefined;

  do {
    const result = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "attribute_exists(entryPrice)",
        ExclusiveStartKey: lastKey,
      })
    );

    for (const item of result.Items || []) {
      await docClient.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: { id: item.id },
          UpdateExpression: "SET #price = :val REMOVE entryPrice",
          ExpressionAttributeNames: { "#price": "price" },
          ExpressionAttributeValues: { ":val": item.entryPrice },
        })
      );
      console.log(`migrated: ${item.id} entryPrice=${item.entryPrice}`);
      migrated++;
    }

    lastKey = result.LastEvaluatedKey;
  } while (lastKey);

  console.log(`완료: ${migrated}개 항목 마이그레이션`);
  return { migrated };
};
