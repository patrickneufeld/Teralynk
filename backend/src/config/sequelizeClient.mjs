// File: /backend/src/config/sequelizeClient.js

import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// ✅ Load environment variables
dotenv.config();

// ✅ Extract DB config from environment
const {
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  DB_HOST,
  DB_PORT,
  NODE_ENV,
} = process.env;

if (!DB_NAME || !DB_USER || !DB_PASSWORD || !DB_HOST) {
  console.error('❌ Missing required database environment variables.');
  process.exit(1);
}

const isProduction = NODE_ENV === 'production';

// ✅ Define Sequelize configuration
const sequelizeOptions = {
  host: DB_HOST,
  port: DB_PORT ? parseInt(DB_PORT, 10) : 5432,
  dialect: 'postgres',
  logging: isProduction ? false : console.log,
  dialectOptions: {},
};

// ✅ Enable SSL in production environments
if (isProduction) {
  sequelizeOptions.dialectOptions.ssl = {
    require: true,
    rejectUnauthorized: false,
  };
}

// ✅ Create Sequelize instance
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, sequelizeOptions);

// ✅ Verify DB connection immediately
(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connection established successfully.');
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error.message);
    process.exit(1);
  }
})();

export default sequelize;
