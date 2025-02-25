require("dotenv").config({ path: "./.env" });

console.log("✅ ENV Test Loaded");
console.log("COGNITO_USER_POOL_ID:", process.env.COGNITO_USER_POOL_ID || "❌ Not Loaded");
