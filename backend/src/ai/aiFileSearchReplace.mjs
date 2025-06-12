import { logAuditEntry } from "../guardrails/AuditLogger.mjs";
import { isKillSwitchEnabled } from "../guardrails/KillSwitch.mjs";
// ✅ FILE: /Users/patrick/Projects/Teralynk/backend/src/ai/aiFileSearchReplace.mjs

import { query } from '../config/db.mjs';
import { logInfo, logError, logWarn } from '../utils/logger.mjs';
import { v4 as uuidv4 } from 'uuid';

let sanitize = (input) => input;

// ✅ Initialize sanitizer (DOMPurify or fallback)
try {
  const { default: createDOMPurify } = await import('dompurify');
  const { JSDOM } = await import('jsdom');
  const window = new JSDOM('').window;
  const DOMPurify = createDOMPurify(window);
  sanitize = DOMPurify.sanitize;
  logInfo('✅ DOMPurify initialized successfully');
} catch (err) {
  logWarn('⚠️ Falling back to basic sanitizer due to DOMPurify load error');
  sanitize = (input) =>
    typeof input === 'string'
      ? input.replace(/<[^>]*>?/gm, '') // strip HTML tags
      : '';
}

/**
 * AIFileSearchReplace
 * Enterprise-grade class for advanced search, replace, templating, and AI-assisted generation
 */
class AIFileSearchReplace {
  /**
   * Replace keyword in a file and return updated content with audit.
   */
  async searchAndReplace(userId, fileId, keyword, replacement) {
    try {
      logInfo('🔍 Performing keyword replacement', { userId, fileId, keyword });

      const { rows } = await query(
        'SELECT * FROM user_files WHERE id = $1 AND user_id = $2',
        [fileId, userId]
      );

      const file = rows?.[0];
      if (!file) throw new Error('Original file not found');

      const updatedContent = file.content.replace(new RegExp(keyword, 'g'), replacement);
      const newFileId = uuidv4();
      const extension = file.filename.split('.').pop();
      const newFilename = `${file.filename.split('.')[0]}_updated.${extension}`;

      await query(
        `INSERT INTO user_files (id, user_id, filename, content, tags, created_at, modified_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [newFileId, userId, newFilename, updatedContent, file.tags]
      );

      logInfo('✅ Keyword replacement completed', { userId, fileId, newFileId });
      return {
        newFileId,
        newFilename,
        content: updatedContent,
        originalFileId: fileId,
      };
    } catch (error) {
      logError('❌ searchAndReplace failed', { error: error.message, userId, fileId });
      throw error;
    }
  }

  /**
   * Replace placeholders in template (e.g., {{client_name}}).
   */
  async generateFromTemplate(userId, fileId, replacements = {}) {
    try {
      logInfo('📄 Generating file from template', { userId, fileId });

      const { rows } = await query(
        'SELECT * FROM user_files WHERE id = $1 AND user_id = $2',
        [fileId, userId]
      );

      const template = rows?.[0];
      if (!template) throw new Error('Template file not found');

      let output = template.content;
      for (const [key, value] of Object.entries(replacements)) {
        const safeValue = sanitize(value);
        output = output.replace(new RegExp(`{{${key}}}`, 'g'), safeValue);
      }

      const newFileId = uuidv4();
      const extension = template.filename.split('.').pop();
      const newFilename = `${template.filename.split('.')[0]}_filled.${extension}`;

      await query(
        `INSERT INTO user_files (id, user_id, filename, content, tags, created_at, modified_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [newFileId, userId, newFilename, output, template.tags]
      );

      logInfo('✅ Template file generated', { userId, newFileId });
      return {
        newFileId,
        newFilename,
        content: output,
      };
    } catch (error) {
      logError('❌ generateFromTemplate failed', { error: error.message, userId, fileId });
      throw error;
    }
  }

  /**
   * Placeholder for future AI-generated content.
   */
  async generateWithAI(userId, prompt) {
    try {
      logInfo('🤖 Generating document with AI assistance', { userId });

      const content = `AI-generated content based on prompt: ${prompt}`;
      return content;
    } catch (error) {
      logError('❌ generateWithAI failed', { error: error.message, userId });
      throw error;
    }
  }
}

export default new AIFileSearchReplace();
