// ✅ FILE: /backend/src/guardrails/AIExplainabilityEngine.mjs
const explainabilityLog = [];

export function logAIReasoning(prompt, response, metadata = {}) {
  explainabilityLog.push({
    prompt,
    response,
    trace: metadata.traceId || null,
    timestamp: new Date().toISOString(),
  });
}