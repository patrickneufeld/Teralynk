export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
export const WEBSOCKET_URL = process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:5001';
export const COGNITO_REGION = process.env.REACT_APP_COGNITO_REGION || 'us-east-1';
export const COGNITO_USER_POOL_ID = process.env.REACT_APP_COGNITO_USER_POOL_ID || 'us-east-1_example';
export const COGNITO_APP_CLIENT_ID = process.env.REACT_APP_COGNITO_APP_CLIENT_ID || 'exampleclientid';
export const REDIS_URL = process.env.REACT_APP_REDIS_URL || 'redis://localhost:6379';
export const POSTGRESQL_URL = process.env.REACT_APP_POSTGRESQL_URL || 'postgresql://localhost:5432/teralynk';