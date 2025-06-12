// ✅ FILE: /backend/middleware/corsMiddleware.js (v2.3.2)

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'https://localhost:5173',
  'https://localhost:3000',
];

const allowedHeaders = [
  'Content-Type',
  'Authorization',
  'x-request-id',
  'X-Requested-With',
  'Accept',
  'Origin',
  'Referer',
  'User-Agent',
];

const corsMiddleware = (req, res, next) => {
  const origin = req.headers.origin;
  const isPreflight = req.method === 'OPTIONS';

  if (isPreflight) {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
    res.header('Access-Control-Allow-Headers', allowedHeaders.join(', '));
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400');
    return res.status(204).end();
  }

  if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
  } else {
    return res.status(403).json({ message: 'Origin not allowed' });
  }

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  next();
};

const isValidOrigin = (origin) => {
  if (!origin) return false;
  try {
    new URL(origin);
    return allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development';
  } catch {
    return false;
  }
};

export default corsMiddleware;
export { allowedOrigins, isValidOrigin };
