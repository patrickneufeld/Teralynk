// ✅ FILE: /backend/src/guardrails/FeedbackScoreEngine.mjs
let feedbackScores = [];

export function submitFeedback(userId, resultId, score, comment = "") {
  feedbackScores.push({ userId, resultId, score, comment, timestamp: new Date().toISOString() });
}

export function getTopRated(limit = 10) {
  return feedbackScores.sort((a, b) => b.score - a.score).slice(0, limit);
}