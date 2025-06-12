// File: /backend/src/ai/aiPersonaTrainer.js

import { logInfo, logError } from '../utils/logger.mjs';
import { analyzePersonaFromMetadata } from './aiFileMetadataAnalyzer.mjs';
import { detectUserRolePersona } from './aiUserRoleProfiler.mjs';
import { getUserNamingHistory } from './aiNamingHistoryService.mjs';
import { addOrUpdatePersona } from './aiPersonaLibrary.mjs';

export async function trainPersonaModel(userId, fileMetadata, fileName) {
  try {
    logInfo(`[PersonaTrainer] Training initiated for user ${userId}`);

    // Step 1: Analyze metadata-based persona
    const metadataPersona = await analyzePersonaFromMetadata(fileMetadata);

    // Step 2: Role & behavior-based persona inference
    const rolePersona = await detectUserRolePersona(userId);

    // Step 3: History-informed adjustments
    const namingHistory = await getUserNamingHistory(userId);
    const inferredHistoryPersona = inferPersonaFromHistory(namingHistory, fileName);

    // Step 4: Final persona resolution
    const resolvedPersona = mergePersonaTraits(
      metadataPersona,
      rolePersona,
      inferredHistoryPersona
    );

    // Step 5: Train persona library
    await addOrUpdatePersona(userId, resolvedPersona);

    logInfo(`[PersonaTrainer] Training complete for user ${userId}`, { resolvedPersona });
    return resolvedPersona;
  } catch (err) {
    logError(`[PersonaTrainer] Error training persona for user ${userId}`, err);
    throw err;
  }
}

function inferPersonaFromHistory(history = [], latestFileName = '') {
  const traits = {
    prefersKeywords: false,
    usesTimestamps: false,
    projectStyle: null,
  };

  for (const entry of history) {
    const lowerName = (entry.generatedName || '').toLowerCase();
    if (lowerName.includes('draft') || lowerName.includes('final')) {
      traits.projectStyle = 'iterative';
    }
    if (/\d{4}-\d{2}-\d{2}/.test(lowerName)) {
      traits.usesTimestamps = true;
    }
    if (lowerName.includes('seo') || lowerName.includes('marketing')) {
      traits.prefersKeywords = true;
    }
  }

  if (latestFileName.toLowerCase().includes('dev') && !traits.projectStyle) {
    traits.projectStyle = 'technical';
  }

  return traits;
}

function mergePersonaTraits(...personas) {
  const merged = {};

  for (const persona of personas) {
    for (const key in persona) {
      if (!(key in merged)) {
        merged[key] = persona[key];
      } else {
        // Merge strategy: preference to most recent (last one wins)
        merged[key] = persona[key] ?? merged[key];
      }
    }
  }

  return merged;
}
