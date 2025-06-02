// ✅ FILE: /backend/src/utils/fileAnalysisUtils.js

/**
 * Enterprise-Grade File Analysis Utilities
 * ------------------------------------------------------
 * This module performs AI-like static content analysis,
 * including keyword extraction, summarization, language detection,
 * and robust metadata generation with security in mind.
 */

import { v4 as uuidv4 } from 'uuid';
import franc from 'franc';
import natural from 'natural';
import { removeStopwords } from 'stopword';

const DEFAULT_SUMMARY_SENTENCE_COUNT = 3;
const MAX_KEYWORDS = 20;

/**
 * ✅ Analyze file content for summarization and metadata extraction
 * @param {string} content - Full content of the file
 * @returns {Object} analysisResult
 */
export function analyzeFileContent(content) {
  validateTextInput(content);

  const analysisId = uuidv4();
  const summary = generateSummary(content, DEFAULT_SUMMARY_SENTENCE_COUNT);
  const keywords = extractKeywords(content, MAX_KEYWORDS);
  const langCode = detectLanguage(content);

  return {
    analysisId,
    summary,
    keywords,
    language: langCode,
    wordCount: countWords(content),
    characterCount: content.length,
    timestamp: new Date().toISOString(),
  };
}

/**
 * ✅ Extract most frequent keywords with frequency scoring
 * @param {string} text - Input text
 * @param {number} maxKeywords - Max keywords to extract
 * @returns {Array<{ word: string, frequency: number }>}
 */
export function extractKeywords(text, maxKeywords = MAX_KEYWORDS) {
  validateTextInput(text);

  const tokenizer = new natural.WordTokenizer();
  const tokens = tokenizer.tokenize(text.toLowerCase());
  const filtered = removeStopwords(tokens.filter(token => /^[a-zA-Z]+$/.test(token)));

  const freqMap = new Map();
  for (const word of filtered) {
    freqMap.set(word, (freqMap.get(word) || 0) + 1);
  }

  return [...freqMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word, frequency]) => ({ word, frequency }));
}

/**
 * ✅ Generate a short summary of the content using heuristic logic
 * @param {string} text
 * @param {number} sentenceLimit
 * @returns {string}
 */
export function generateSummary(text, sentenceLimit = DEFAULT_SUMMARY_SENTENCE_COUNT) {
  validateTextInput(text);

  const sentences = text
    .replace(/\s+/g, ' ')
    .match(/[^.!?]+[.!?]/g) || [];

  return sentences.slice(0, sentenceLimit).join(' ').trim();
}

/**
 * ✅ Detect language using `franc` package
 * @param {string} text
 * @returns {string} ISO 639-3 language code or 'und' (undetermined)
 */
export function detectLanguage(text) {
  validateTextInput(text);
  const lang = franc(text, { minLength: 10 });
  return lang || 'und';
}

/**
 * ✅ Count the number of words in the content
 * @param {string} text
 * @returns {number}
 */
export function countWords(text) {
  validateTextInput(text);
  return text.trim().split(/\s+/).length;
}

/**
 * ✅ Validate that input is non-empty string
 * @param {string} text
 */
function validateTextInput(text) {
  if (!text || typeof text !== 'string' || text.length < 5) {
    throw new Error('Invalid or insufficient text input for analysis.');
  }
}
