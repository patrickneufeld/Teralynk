// 📁 backend/src/utils/auth/generateJwtToken.js

import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export function generateJwtToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('❌ JWT_SECRET not defined in environment.');
  }

  const payload = {
    sub: user.sub || user.id,
    email: user.email,
    username: user.username,
    roles: user.roles || [],
  };

  const options = {
    expiresIn: process.env.JWT_EXPIRATION || '1d',
    issuer: 'teralynk-backend',
    audience: 'teralynk-frontend',
  };

  const token = jwt.sign(payload, secret, options);

  return token;
}
