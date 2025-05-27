// ✅ FILE: /Users/patrick/Projects/Teralynk/backend/src/ai/nlp/aiSummarizer.mjs

/**
 * AI Summarizer Module
 * Provides basic summarization and key point extraction logic
 */

import { logInfo, logError } from '../../utils/logger.mjs';

/**
 * Summarize the given input text using basic logic or LLM proxy.
 * @param {string} inputText - The full text to summarize
 * @param {object} [options] - Optional config for summarization
 * @returns {Promise<string>} A concise summary
 */
export async function summarizeText(inputText, options = {}) {
  try {
    if (!inputText || typeof inputText !== 'string') {
      throw new Error('Invalid input text for summarization');
    }

    const maxLength = options.maxLength || 500;
    const trimmedText = inputText.trim().slice(0, maxLength);

    const sentences = trimmedText.split(/[.!?]\s/).filter(Boolean);
    const summary = sentences.slice(0, 2).join('. ') + (sentences.length > 2 ? '...' : '');

    logInfo('🧠 Text summarized successfully', {
      originalLength: inputText.length,
      summaryLength: summary.length
    });

    return summary;
  } catch (err) {
    logError('❌ Summarization failed', { error: err.message });
    return 'Summary unavailable due to processing error.';
  }
}

/**
 * Extracts key terms from the text using frequency-based filtering.
 * @param {string} text - The full input text.
 * @param {object} [options] - Optional config (e.g. stop words, limit)
 * @returns {string[]} Top keywords
 */
export function extractKeyPoints(text, options = {}) {
  try {
    if (!text || typeof text !== 'string') return [];

    const stopWords = new Set([
      'the', 'and', 'for', 'that', 'with', 'this', 'from', 'have',
      'your', 'not', 'are', 'was', 'but', 'you', 'all', 'can', 'will', 'has', 'more', 'than'
    ]);

    const wordLimit = options.limit || 5;

    const words = text
      .toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3 && !stopWords.has(w));

    const freqMap = {};
    for (const word of words) {
      freqMap[word] = (freqMap[word] || 0) + 1;
    }

    const sorted = Object.entries(freqMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, wordLimit)
      .map(([word]) => word);

    logInfo('🔑 Extracted key points', { keywords: sorted });

    return sorted;
  } catch (err) {
    logError('❌ extractKeyPoints failed', { error: err.message });
    return [];
  }
}

// Export default to support mixed import styles
export default summarizeText;
