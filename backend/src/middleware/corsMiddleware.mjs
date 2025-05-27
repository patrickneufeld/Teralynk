// File: /Users/patrick/Projects/Teralynk/backend/src/middleware/corsMiddleware.js

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5001",
  "https://localhost:3000",
  "https://localhost:5173",
  "https://localhost:5001",
];

const corsMiddleware = (req, res, next) => {
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", allowedOrigins[0]);
  }

  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // ✅ Handle preflight request immediately
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
};

export default corsMiddleware;
