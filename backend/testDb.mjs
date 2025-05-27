// File: backend/testDb.js
import { testConnection } from "./config/db.mjs";

(async () => {
  await testConnection();
})();
