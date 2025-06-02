// ✅ FILE: backend/src/models/AILogModel.js

import { DataTypes } from "sequelize.js";
import { sequelize } from "../config/database.mjs"; // Ensure correct import

// ✅ Define AI Log Model
const AILog = sequelize.define("AILog", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    request: {
        type: DataTypes.JSONB, // Store AI requests as JSON
        allowNull: false,
    },
    response: {
        type: DataTypes.JSONB, // Store AI responses as JSON
        allowNull: false,
    },
    error: {
        type: DataTypes.TEXT, // Store error message (if any)
        allowNull: true,
    },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
});

export default AILog;
