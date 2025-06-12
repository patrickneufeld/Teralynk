// /backend/src/utils/ai/BehaviorAnalyzer.js
export class BehaviorAnalyzer {
    static detectAnomalies(interactions) {
      return interactions.filter(entry => entry.responseTime > 3000 || entry.status !== 'ok');
    }
  }
  