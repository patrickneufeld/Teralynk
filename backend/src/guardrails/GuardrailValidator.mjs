// ✅ FILE: /backend/src/guardrails/GuardrailValidator.mjs
export function validateScope(code, filePath) {
  const start = "@ai_updatable:start";
  const end = "@ai_updatable:end";
  const lines = code.split("\n");

  const scoped = lines.some(line => line.includes(start)) &&
                 lines.some(line => line.includes(end));

  if (!scoped) {
    throw new Error(\`GuardrailViolation: Missing @ai_updatable markers in \${filePath}\`);
  }
  return true;
}