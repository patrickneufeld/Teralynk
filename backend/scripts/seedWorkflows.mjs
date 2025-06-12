// File: /backend/scripts/seedWorkflows.js

import sequelizeClient from '../src/config/sequelizeClient.mjs';
import Workflow from '../src/models/Workflow.mjs';

async function seedWorkflows() {
  try {
    console.log('🌱 Starting workflow seeding...');

    await sequelizeClient.authenticate();
    console.log('✅ Database connection established.');

    const workflows = [
      {
        name: 'Onboarding Process',
        description: 'Handles the onboarding workflow for new users.',
        status: 'published'
      },
      {
        name: 'File Approval Workflow',
        description: 'Workflow for file submission and manager approval.',
        status: 'published'
      },
      {
        name: 'Content Review Pipeline',
        description: 'Stages for content review before publication.',
        status: 'draft'
      }
    ];

    await Workflow.bulkCreate(workflows);
    console.log('✅ Workflows seeded successfully.');

    await sequelizeClient.close();
    console.log('✅ Database connection closed.');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedWorkflows();
