// File: /frontend/src/services/aws/index.js

import * as client from './client.js';
import * as token from './token.js';
import * as refresh from './refresh.js';
import * as password from './password.js';
import * as signup from './signup.js';
import * as profile from './profile.js';
import * as api from './api.js';
import * as auth from './auth.js';

/**
 * Centralized AWS Cognito Service
 * Aggregates all modular service logic into a single export
 */
const awsCognitoClient = {
  ...client,
  ...token,
  ...refresh,
  ...password,
  ...signup,
  ...profile,
  ...api,
  ...auth
};

export default awsCognitoClient;
