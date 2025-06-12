// ✅ FILE: /frontend/src/utils/ai/promptValidator.js

const MAX_PROMPT_LENGTH = 4096;
const MIN_PROMPT_LENGTH = 1;

/**
 * Validates AI prompts for safety and format
 * @param {string} prompt - The prompt to validate
 * @returns {Promise<boolean>} Returns true if valid
 * @throws {Error} Throws if validation fails
 */
export const validatePrompt = async (prompt) => {
  // Basic validation
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('Invalid prompt format');
  }

  if (prompt.length < MIN_PROMPT_LENGTH) {
    throw new Error('Prompt cannot be empty');
  }

  if (prompt.length > MAX_PROMPT_LENGTH) {
    throw new Error(`Prompt exceeds maximum length of ${MAX_PROMPT_LENGTH} characters`);
  }

  // Check for potentially harmful content
  const harmfulPatterns = [
    /(<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>)/gi, // Script tags
    /(javascript:)/gi,  // JavaScript protocol
    /(\b(sys|system|exec|eval)\b)/gi // System commands
  ];

  for (const pattern of harmfulPatterns) {
    if (pattern.test(prompt)) {
      throw new Error('Prompt contains potentially harmful content');
    }
  }

  return true;
};

export const PROMPT_CONSTRAINTS = {
  MAX_LENGTH: MAX_PROMPT_LENGTH,
  MIN_LENGTH: MIN_PROMPT_LENGTH
};
