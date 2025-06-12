// /backend/src/models/aiModelMetrics.js

import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelizeClient.mjs';
import AIModel from './aiModel.mjs';

const AIModelMetrics = sequelize.define('AIModelMetrics', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  model_id: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  metrics: {
    type: DataTypes.JSONB,
    allowNull: false,
  },
  recorded_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'ai_model_metrics',
  timestamps: false,
});

AIModelMetrics.belongsTo(AIModel, {
  foreignKey: 'model_id',
  targetKey: 'model_id',
  as: 'model',
});

export default AIModelMetrics;
