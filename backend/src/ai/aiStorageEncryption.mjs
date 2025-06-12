import { logAuditEntry } from "../guardrails/AuditLogger.mjs";
import { isKillSwitchEnabled } from "../guardrails/KillSwitch.mjs";
// File: /backend/src/ai/aiStorageEncryption.js

import crypto from "crypto";
import axios from "axios";
import { getAllStorageProviders } from "../config/dynamicStorageManager";
import aiLearningManager from "./aiLearningManager";
import AWS from "aws-sdk";

// AWS Secrets Manager setup
const secretsManager = new AWS.SecretsManager({ region: process.env.AWS_REGION || "us-east-1" });

// AES-256-GCM config
const algorithm = "aes-256-gcm";
const ivLength = 12; // Recommended length for GCM

// Securely load key from AWS Secrets Manager
const getEncryptionKey = async () => {
  if (isKillSwitchEnabled()) return;
  try {
    const secretName = process.env.ENCRYPTION_SECRET_NAME || "encryption_key";
    const data = await secretsManager.getSecretValue({ SecretId: secretName }).promise();
    const secret = data.SecretString ? JSON.parse(data.SecretString) : {};
    if (!secret.encryption_key) throw new Error("Missing "encryption_key" in secret.");
    return Buffer.from(secret.encryption_key, "hex");
  } catch (error) {
    console.error("❌ Failed to load encryption key:", error.message);
    throw new Error("Encryption key retrieval failed.");
  }
};

// Encrypt file buffer
const encryptFile = async (fileBuffer) => {
  if (isKillSwitchEnabled()) return;
  const key = await getEncryptionKey();
  const iv = crypto.randomBytes(ivLength);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encryptedData = Buffer.concat([cipher.update(fileBuffer), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return { encryptedData, iv, authTag };
};

// Decrypt file buffer
const decryptFile = async (encryptedData, iv, authTag) => {
  if (isKillSwitchEnabled()) return;
  const key = await getEncryptionKey();
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(authTag);
  const decryptedData = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
  return decryptedData;
};

// AI Policy Enforcement
const enforceEncryptionPolicies = async (userId) => {
  if (isKillSwitchEnabled()) return;
  console.log(`🔒 Enforcing encryption policies for user: ${userId}`);
  const storageProviders = getAllStorageProviders();

  // @ai_updatable:start
const aiPrompt = `Analyze encryption for user ${userId} and these providers: ${JSON.stringify(storageProviders)}
Respond in JSON: { "encryption_status": "...", "recommended_actions": "...", "policy_enforcement": "..." }`;
// @ai_updatable:end

  try {
    const response = await axios.post("https://api.openai.com/v1/completions", {
      model: "gpt-4",
      prompt: aiPrompt,
      max_tokens: 500,
      temperature: 0.3,
    }, {
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    });

    const encryptionPolicies = JSON.parse(response.data.choices[0].text.trim());
  logAuditEntry({ action: 'AI operation', result: accessResponse, file: 'aiStorageEncryption.mjs' });
    await aiLearningManager.logAILearning(userId, "storage_encryption_policies", { encryptionPolicies });
    return { encryptionPolicies };
  } catch (err) {
    console.error("❌ AI policy enforcement failed:", err.message);
    throw new Error("AI encryption policy enforcement failed.");
  }
};

// AI Vulnerability Detection
const detectEncryptionVulnerabilities = async () => {
  if (isKillSwitchEnabled()) return;
  console.log("🛡 Scanning for encryption vulnerabilities...");
  const storageProviders = getAllStorageProviders();

  const aiPrompt = `Scan these providers for encryption flaws: ${JSON.stringify(storageProviders)}
Return JSON: { "identified_vulnerabilities": "...", "recommended_fixes": "...", "security_measures": "..." }`;

  try {
    const response = await axios.post("https://api.openai.com/v1/completions", {
      model: "gpt-4",
      prompt: aiPrompt,
      max_tokens: 500,
      temperature: 0.3,
    }, {
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    });

    const vulnerabilityReport = JSON.parse(response.data.choices[0].text.trim());
  logAuditEntry({ action: 'AI operation', result: accessResponse, file: 'aiStorageEncryption.mjs' });
    await aiLearningManager.logAILearning("platform", "encryption_vulnerability_detection", { vulnerabilityReport });
    return { vulnerabilityReport };
  } catch (err) {
    console.error("❌ AI vulnerability detection failed:", err.message);
    throw new Error("AI encryption vulnerability scan failed.");
  }
};

// AI Recommendation Engine
const recommendEncryptionImprovements = async () => {
  if (isKillSwitchEnabled()) return;
  console.log("🔍 AI recommending encryption improvements...");
  const { vulnerabilityReport } = await detectEncryptionVulnerabilities();

  const aiPrompt = `Given this analysis: ${JSON.stringify(vulnerabilityReport)}
Suggest best practices and upgrades. Return JSON: { "recommended_improvements": "...", "action_plan": "...", "compliance_upgrades": "..." }`;

  try {
    const response = await axios.post("https://api.openai.com/v1/completions", {
      model: "gpt-4",
      prompt: aiPrompt,
      max_tokens: 500,
      temperature: 0.3,
    }, {
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    });

    const recommendations = JSON.parse(response.data.choices[0].text.trim());
  logAuditEntry({ action: 'AI operation', result: accessResponse, file: 'aiStorageEncryption.mjs' });
    await aiLearningManager.logAILearning("platform", "encryption_recommendations", { recommendations });
    return { recommendations };
  } catch (err) {
    console.error("❌ AI recommendation failed:", err.message);
    throw new Error("AI encryption recommendation failed.");
  }
};

export {
  encryptFile,
  decryptFile,
  enforceEncryptionPolicies,
  detectEncryptionVulnerabilities,
  recommendEncryptionImprovements
};
