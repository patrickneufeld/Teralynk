// /backend/src/models/aiModel.js

import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelizeClient.mjs';

const AIModel = sequelize.define('AIModel', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  model_id: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
  },
  version: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  state: {
    type: DataTypes.JSONB,
    allowNull: false,
  },
  metrics: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'ai_models',
  timestamps: false,
});

export default AIModel;
