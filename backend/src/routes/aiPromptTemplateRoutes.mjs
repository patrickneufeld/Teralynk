// ✅ FILE: /backend/src/routes/aiPromptTemplateRoutes.js

import express from 'express';
import pkg from 'pg';
const { Pool } = pkg;
import { requireAuth } from '../middleware/authMiddleware.mjs';
import { logInfo, logError } from '../utils/logging/index.mjs';

const router = express.Router();

// PostgreSQL Connection
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 5432,
  ssl: { rejectUnauthorized: false, require: true },
});

/**
 * @route GET /api/ai/prompts
 * @desc Fetch all AI prompt templates (personal + global)
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const { id: userId } = req.user;

    const result = await pool.query(
      `SELECT id, user_id, template_name, template_content, created_at
       FROM ai_prompt_templates
       WHERE user_id = $1 OR user_id IS NULL
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    logError('❌ Failed to fetch AI prompt templates', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

/**
 * @route POST /api/ai/prompts
 * @desc Create a new AI prompt template
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const { templateName, templateContent } = req.body;
    const { id: userId } = req.user;

    if (!templateName || !templateContent) {
      return res.status(400).json({ error: 'Template name and content are required' });
    }

    const result = await pool.query(
      `INSERT INTO ai_prompt_templates (user_id, template_name, template_content)
       VALUES ($1, $2, $3)
       RETURNING id, template_name, template_content, created_at`,
      [userId, templateName, templateContent]
    );

    logInfo('✅ AI prompt template created', { userId, templateId: result.rows[0].id });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    logError('❌ Failed to create AI prompt template', { error: error.message });
    res.status(500).json({ error: 'Failed to create template' });
  }
});

/**
 * @route PUT /api/ai/prompts/:id
 * @desc Update an existing AI prompt template
 */
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { templateName, templateContent } = req.body;
    const { id: userId } = req.user;

    if (!templateName || !templateContent) {
      return res.status(400).json({ error: 'Template name and content are required' });
    }

    const result = await pool.query(
      `UPDATE ai_prompt_templates
       SET template_name = $1, template_content = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND user_id = $4
       RETURNING id, template_name, template_content, updated_at`,
      [templateName, templateContent, id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Template not found or no permission' });
    }

    logInfo('✅ AI prompt template updated', { userId, templateId: id });

    res.json(result.rows[0]);
  } catch (error) {
    logError('❌ Failed to update AI prompt template', { error: error.message });
    res.status(500).json({ error: 'Failed to update template' });
  }
});

/**
 * @route DELETE /api/ai/prompts/:id
 * @desc Delete an AI prompt template
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId } = req.user;

    const result = await pool.query(
      `DELETE FROM ai_prompt_templates
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Template not found or no permission' });
    }

    logInfo('✅ AI prompt template deleted', { userId, templateId: id });

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    logError('❌ Failed to delete AI prompt template', { error: error.message });
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

export default router;
