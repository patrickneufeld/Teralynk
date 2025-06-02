// ✅ /backend/corsMiddleware.js or inline CORS setup
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
  'x-requested-with',
  'X-Requested-With',
  'x-request-id',
  'X-Request-Id', // ✅ Add uppercase variant
  'trace-id',
  'Trace-Id',     // ✅ Add uppercase variant
  'Accept',       // ✅ Add common headers
  'Origin',
  'Cache-Control'
];

const corsMiddleware = (req, res, next) => {
  const origin = req.headers.origin;
  
  // ✅ Handle development environment more permissively
  if (process.env.NODE_ENV === 'development') {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  } else if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]);
  }

  // ✅ Expose custom headers if needed
  res.setHeader('Access-Control-Expose-Headers', 'x-request-id, trace-id');
  
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', allowedHeaders.join(','));
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // ✅ Cache preflight for 24 hours

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
};

export default corsMiddleware;
