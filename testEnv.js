// /Users/patrick/Projects/Teralynk_Old/testEnv.js

require("dotenv").config({ path: "./.env" });

console.log("✅ ENV Test Loaded");
console.log("COGNITO_USER_POOL_ID:", process.env.COGNITO_USER_POOL_ID || "❌ Not Loaded");
console.log("VITE_WS_HOST:", process.env.VITE_WS_HOST || "❌ Not Loaded");
console.log("VITE_WS_PORT:", process.env.VITE_WS_PORT || "❌ Not Loaded");
console.log("VITE_WS_URL:", process.env.VITE_WS_URL || "❌ Not Loaded");
