// ✅ FILE: /backend/src/middleware/authMiddleware.mjs

import jwt from 'jsonwebtoken';
import { logInfo, logWarn, logError } from '../utils/logger.mjs';

/**
 * Verifies JWT and attaches decoded payload to req.auth
 */
export function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logWarn('Missing or malformed Authorization header');
      return res.status(401).json({ error: 'Authentication token required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.auth = decoded;
    logInfo('✅ Authentication verified', { userId: decoded.id });
    next();
  } catch (error) {
    logError('❌ Authentication failed', { error: error.message });
    return res.status(401).json({ error: 'Invalid or expired authentication token' });
  }
}

/**
 * Checks that user is authenticated and has admin role
 */
export const requireAdmin = [
  requireAuth,
  (req, res, next) => {
    if (!req.auth || req.auth.role !== 'admin') {
      logWarn('Access denied: Admin privileges required', { userId: req.auth?.id });
      return res.status(403).json({ error: 'Access denied: Admins only' });
    }
    next();
  }
];

/**
 * ✅ NEW EXPORT REQUIRED BY ROUTES: 'authenticate'
 * Alias to requireAuth for backwards compatibility with older routes
 */
export const authenticate = requireAuth;

export default {
  requireAuth,
  requireAdmin,
  authenticate,
};
