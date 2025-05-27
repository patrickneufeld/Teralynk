// /backend/src/models/aiFeedback.js

import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelizeClient.mjs';

const AIFeedback = sequelize.define('AIFeedback', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  feedback_id: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
  },
  user_id: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  feedback_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  feedback_data: {
    type: DataTypes.JSONB,
    allowNull: false,
  },
  processed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  processed_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'ai_feedback',
  timestamps: false,
});

export default AIFeedback;
