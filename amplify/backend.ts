import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';

/**
 * Amplify 백엔드: Auth만 사용
 * DynamoDB, Lambda, API Gateway는 AWS 콘솔에서 직접 관리합니다.
 * lambda/ 폴더의 handler.mjs 참고
 */
const backend = defineBackend({
  auth,
});
