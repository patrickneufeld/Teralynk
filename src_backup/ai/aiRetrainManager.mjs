// File Path: backend/src/ai/aiRetrainManager.js

import { logPerformance } from "./aiPerformanceTracker.mjs";

function triggerRetraining(aiModel, mse, mae, rse) {
    if (mse > 0.15 || mae > 0.07 || rse > 0.25) {
        console.log(`🔄 Retraining AI Model: ${aiModel}`);
        logPerformance(mse, mae, rse);
        // Add AI retraining logic here
    }
}

export { triggerRetraining };
