// /backend/src/models/aiPatterns.js

import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelizeClient.mjs';

const AIPatterns = sequelize.define('AIPatterns', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  pattern_id: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
  },
  pattern_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  pattern_data: {
    type: DataTypes.JSONB,
    allowNull: false,
  },
  confidence: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  context: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'ai_patterns',
  timestamps: false,
});

export default AIPatterns;
