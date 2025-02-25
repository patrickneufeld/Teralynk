// File: backend/testDb.js
import { testConnection } from "./config/db.js";

(async () => {
  await testConnection();
})();
