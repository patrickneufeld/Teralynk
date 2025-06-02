// File: backend/services/auth/index.js

import * as passwordUtils from './password.mjs';
import * as cognitoClient from './cognito.mjs';
import * as secretsService from '../aws/secrets.mjs';
import * as jwtUtils from './jwt.mjs';

/**
 * Unified Auth Service API
 * This file aggregates all submodules into a single exportable service.
 */
export default {
  passwordUtils,
  cognitoClient,
  secretsService,
  jwtUtils
};

// Also export named utilities if needed directly
export {
  passwordUtils,
  cognitoClient,
  secretsService,
  jwtUtils
};
