// ✅ FILE: /backend/src/config/database.js

import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

// ✅ PostgreSQL Connection using Sequelize
export const sequelize = new Sequelize(process.env.DB_CONNECTION_STRING, {
  dialect: "postgres",
  logging: false, // Set to console.log to debug SQL queries
});

// ✅ Function to Sync Database
export const syncDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected successfully.");
    await sequelize.sync({ alter: true }); // Sync models
    console.log("✅ Database synchronized.");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  }
};
