/**
 * Data 레이어는 사용하지 않습니다.
 * DynamoDB 테이블은 AWS 콘솔에서 직접 생성합니다.
 * Lambda(API Gateway) → DynamoDB 흐름으로 시그널을 관리합니다.
 *
 * DynamoDB 테이블 생성 가이드:
 * - 테이블 이름: Signal (또는 원하는 이름)
 * - 파티션 키: id (String)
 * - 속성: symbol, date, time, price, position, icon, isNew, source, exchange, indicator, createdAt, updatedAt
 */

// Amplify backend.ts에서 data를 사용하지 않으므로 빈 export
// (향후 필요 시 다시 추가 가능)


/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>
