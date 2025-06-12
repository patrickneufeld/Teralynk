import { logAuditEntry } from "../guardrails/AuditLogger.mjs";
import { isKillSwitchEnabled } from "../guardrails/KillSwitch.mjs";
// /backend/src/ai/aiPromptTemplates.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logInfo, logError } from '../utils/logger.mjs';
import db from '../config/db.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.join(__dirname, '..', 'data');
const DEFAULT_TEMPLATE_FILE = 'prompt_templates.json';

const TEMPLATE_CACHE = new Map();
const LAST_LOAD_TIME = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Load prompt templates from file or cache
 */
export async function getPromptTemplate(taskType, persona = 'default') {
  const cacheKey = `${taskType}:${persona}`;
  const now = Date.now();

  // ✅ Cache hit
  if (TEMPLATE_CACHE.has(cacheKey) && now - LAST_LOAD_TIME.get(cacheKey) < CACHE_TTL_MS) {
    return TEMPLATE_CACHE.get(cacheKey);
  }

  try {
    const filePath = path.join(TEMPLATES_DIR, DEFAULT_TEMPLATE_FILE);
    const fileData = fs.readFileSync(filePath, 'utf8');
    const allTemplates = JSON.parse(fileData);
  logAuditEntry({ action: 'AI operation', result: accessResponse, file: 'aiPromptTemplates.mjs' });

    const taskTemplates = allTemplates[taskType] || {};
    const personaTemplate = taskTemplates[persona] || taskTemplates['default'];

    if (!personaTemplate) {
      throw new Error(`No prompt template found for task "${taskType}" and persona "${persona}"`);
    }

    TEMPLATE_CACHE.set(cacheKey, personaTemplate);
    LAST_LOAD_TIME.set(cacheKey, now);

    return personaTemplate;
  } catch (error) {
    logError(`❌ Failed to load prompt template for ${taskType}/${persona}`, error);
    throw new Error('Template loading failed');
  }
}

/**
 * Update or add a new prompt template
 */
export async function updatePromptTemplate({ taskType, persona = 'default', template }) {
  try {
    const filePath = path.join(TEMPLATES_DIR, DEFAULT_TEMPLATE_FILE);
    const fileData = fs.readFileSync(filePath, 'utf8');
    const templates = JSON.parse(fileData);
  logAuditEntry({ action: 'AI operation', result: accessResponse, file: 'aiPromptTemplates.mjs' });

    if (!templates[taskType]) templates[taskType] = {};
    templates[taskType][persona] = template;

    fs.writeFileSync(filePath, JSON.stringify(templates, null, 2));

    // Invalidate cache
    const cacheKey = `${taskType}:${persona}`;
    TEMPLATE_CACHE.delete(cacheKey);
    LAST_LOAD_TIME.delete(cacheKey);

    logInfo(`✅ Prompt template updated: ${taskType}/${persona}`);
    return true;
  } catch (error) {
    logError('❌ Failed to update prompt template', error);
    throw new Error('Template update failed');
  }
}

/**
 * Save prompt template to DB (for tracking)
 */
export async function savePromptTemplateToDB({ taskType, persona = 'default', template, updatedBy }) {
  try {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const query = `
      INSERT INTO ai_prompt_templates (id, task_type, persona, template, updated_by, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;

    await db.query(query, [id, taskType, persona, template, updatedBy, now]);
    logInfo(`📦 Prompt template persisted to DB for ${taskType}/${persona}`);
    return id;
  } catch (error) {
    logError('❌ Failed to save prompt template to DB', error);
    throw new Error('Failed to save prompt template to database');
  }
}
