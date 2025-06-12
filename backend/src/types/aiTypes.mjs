// ✅ FILE: /backend/src/types/aiTypes.js

/**
 * @typedef {Object} AIQueryRequest
 * @property {string} provider - AI provider key, e.g., 'openai', 'claude', 'bedrock'
 * @property {string} query - The user or system-generated prompt
 * @property {string} userId - Unique user identifier
 * @property {string} [traceId] - Trace ID for distributed tracing (optional)
 */

/**
 * @typedef {Object} AIQueryResponse
 * @property {string} provider - AI provider name
 * @property {string} model - Model identifier used (e.g., gpt-4, claude-3)
 * @property {object} response - Raw response payload from the AI platform
 */

/**
 * @typedef {Object} AIInsight
 * @property {string} insightId - Unique ID for the insight
 * @property {string} userId - Associated user
 * @property {string} model - AI model used
 * @property {string} category - Categorization label (e.g., 'security', 'optimization')
 * @property {string} summary - Textual summary of the insight
 * @property {object} rawData - Original data from the AI engine
 * @property {string} timestamp - ISO timestamp of when the insight was generated
 */

/**
 * @typedef {Object} AIEvent
 * @property {string} eventType - Type of event (e.g., 'query_success', 'learning_update')
 * @property {string} level - Severity level ('INFO', 'WARN', 'ERROR', 'DEBUG')
 * @property {string} traceId - Correlation ID for tracing
 * @property {string} userId - Related user
 * @property {object} payload - Additional metadata or error data
 * @property {string} timestamp - ISO timestamp
 */

/**
 * @typedef {Object} AIOptimizationResult
 * @property {string} optimizationId - Unique optimization ID
 * @property {boolean} success - Whether the optimization was effective
 * @property {string} summary - Text summary of the result
 * @property {object} [diff] - Optional diff or change log from patch or retraining
 */

/**
 * @typedef {Object} AIPlatformConfig
 * @property {string} name - Platform name, e.g., 'OpenAI'
 * @property {string} apiKey - Auth token used for requests
 * @property {string} baseUrl - API base endpoint
 * @property {string} model - Default model to use
 * @property {boolean} enabled - Whether this platform is active
 */

