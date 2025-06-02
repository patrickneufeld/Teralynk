// /backend/src/models/aiValidations.js

import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelizeClient.mjs';

const AIValidations = sequelize.define('AIValidations', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  validation_id: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
  },
  entity_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  entity_id: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  results: {
    type: DataTypes.JSONB,
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'ai_validations',
  timestamps: false,
});

export default AIValidations;
