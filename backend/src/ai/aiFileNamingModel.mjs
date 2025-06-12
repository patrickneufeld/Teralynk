import { logAuditEntry } from "../guardrails/AuditLogger.mjs";
import { isKillSwitchEnabled } from "../guardrails/KillSwitch.mjs";
// File: /backend/src/ai/aiFileNamingModel.js

import { DataTypes } from 'sequelize';
import sequelize from '../config/db.mjs';

/**
 * Stores historical filename patterns to support adaptive AI naming logic.
 * Automatically adjusts naming strategies per user, role, persona, and file type.
 */
const AiFileNamingModel = sequelize.define('ai_naming_history', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  originalName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  smartName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  persona: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  mimeType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  templateUsed: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
  },
}, {
  tableName: 'ai_naming_history',
  timestamps: true,
  paranoid: true,
});

export default AiFileNamingModel;
