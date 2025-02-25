// ✅ FILE: backend/src/config/migrate.js

const { syncDatabase } = require("./database");

(async () => {
    try {
        console.log("🚀 Running database migration...");
        await syncDatabase();
        console.log("✅ Database migration complete!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }
})();
