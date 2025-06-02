// File: /backend/src/models/Workflow.js

import { DataTypes } from 'sequelize';
import sequelizeClient from '../config/sequelizeClient.mjs';

const Workflow = sequelizeClient.define('Workflow', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'draft'
  }
}, {
  tableName: 'workflows',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default Workflow;
