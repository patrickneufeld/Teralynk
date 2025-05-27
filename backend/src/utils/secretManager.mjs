// File: /backend/src/utils/secretManager.js

import {
  SecretsManagerClient,
  GetSecretValueCommand,
  UpdateSecretCommand,
  DeleteSecretCommand
} from "@aws-sdk/client-secrets-manager";
import { logInfo, logError, logWarn, logDebug } from "./logger.mjs";

class SecretManagerError extends Error {
  constructor(message, code, meta = {}) {
    super(message);
    this.name = "SecretManagerError";
    this.code = code;
    this.meta = meta;
  }
}

// Configuration with Safe Fallback
const REGION = process.env.AWS_REGION || "us-east-1";
const SECRET_ID = process.env.SECRET_NAME || process.env.SECRETS_MANAGER_NAME || "teralynk/env";
const CACHE_TTL_MS = Number(process.env.SECRETS_CACHE_TTL_MS) || 5 * 60 * 1000;
const REQUIRED_KEYS = (process.env.SECRETS_REQUIRED_KEYS || "")
  .split(",")
  .map(k => k.trim())
  .filter(Boolean);

let _cache = null;
let _cacheFetched = 0;

const client = new SecretsManagerClient({ region: REGION });

async function _fetchSecret(attempt = 1) {
  if (!SECRET_ID) {
    logError("SECRET_ID is undefined");
    throw new SecretManagerError("SECRET_ID is undefined", "CONFIG_ERROR");
  }

  try {
    logInfo(`Fetching secret [${SECRET_ID}], attempt ${attempt}`);
    const resp = await client.send(new GetSecretValueCommand({ SecretId: SECRET_ID }));

    if (resp.SecretString) {
      logInfo("SecretString received and parsed.");
      return JSON.parse(resp.SecretString);
    }

    if (resp.SecretBinary) {
      const buf = Buffer.from(resp.SecretBinary, "base64");
      logInfo("SecretBinary received and parsed.");
      return JSON.parse(buf.toString("utf8"));
    }

    throw new SecretManagerError("Empty secret response", "EMPTY_SECRET");
  } catch (err) {
    if (attempt < 3 && (err.name === "SecretManagerError" || err.$metadata?.httpStatusCode >= 500)) {
      const backoff = 100 * 2 ** (attempt - 1);
      logWarn(`Retrying fetch in ${backoff}ms…`);
      await new Promise(r => setTimeout(r, backoff));
      return _fetchSecret(attempt + 1);
    }
    logError(`Failed to fetch secret: ${err.message}`, { error: err });
    throw new SecretManagerError(`Failed to fetch secret: ${err.message}`, "FETCH_ERROR", { original: err });
  }
}

export async function loadSecrets({ force = false } = {}) {
  const now = Date.now();
  if (!force && _cache && now - _cacheFetched < CACHE_TTL_MS) {
    logDebug("Returning cached secrets");
    return _cache;
  }
  _cache = await _fetchSecret();
  _cacheFetched = now;
  return _cache;
}

export async function getSecretKey(key) {
  const all = await loadSecrets();
  return all[key] ?? null;
}

export async function injectSecretsToEnv() {
  const all = await loadSecrets();
  for (const [k, v] of Object.entries(all)) {
    if (process.env[k] == null) {
      process.env[k] = String(v);
      logDebug(`Injected env '${k}'`);
    }
  }
  logInfo(`Environment variables successfully injected from secret [${SECRET_ID}]`);
}

export async function validateSecrets() {
  if (!REQUIRED_KEYS.length) {
    logWarn("No REQUIRED_KEYS configured; skipping validation");
    return;
  }
  const merged = { ...process.env, ...(await loadSecrets()) };
  const missing = REQUIRED_KEYS.filter(k => !merged[k]);
  if (missing.length) {
    throw new SecretManagerError(`Missing required secrets: [${missing.join(", ")}]`, "VALIDATION_ERROR", { missing });
  }
  logInfo("All required secrets are present");
}

export async function updateSecrets(newSecretObj) {
  if (!SECRET_ID) {
    throw new SecretManagerError("SECRET_ID not configured", "CONFIG_ERROR");
  }
  try {
    await client.send(new UpdateSecretCommand({
      SecretId: SECRET_ID,
      SecretString: JSON.stringify(newSecretObj, null, 2)
    }));
    logInfo(`Secret [${SECRET_ID}] updated`);
    _cache = null;
  } catch (err) {
    logError(`Update failed: ${err.message}`, { error: err });
    throw new SecretManagerError(`Update failed: ${err.message}`, "UPDATE_ERROR", { original: err });
  }
}

export async function deleteSecrets({ forceWithoutRecovery = false } = {}) {
  if (!SECRET_ID) {
    throw new SecretManagerError("SECRET_ID not configured", "CONFIG_ERROR");
  }
  try {
    await client.send(new DeleteSecretCommand({
      SecretId: SECRET_ID,
      ForceDeleteWithoutRecovery: forceWithoutRecovery
    }));
    logInfo(`Secret [${SECRET_ID}] deleted`);
    _cache = null;
  } catch (err) {
    logError(`Delete failed: ${err.message}`, { error: err });
    throw new SecretManagerError(`Delete failed: ${err.message}`, "DELETE_ERROR", { original: err });
  }
}
