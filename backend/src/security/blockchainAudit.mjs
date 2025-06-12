// ✅ FILE: /backend/src/security/blockchainAudit.js

/**
 * Simulates blockchain-based audit logging.
 * This stub can later be replaced with a real blockchain ledger integration (e.g., Hyperledger, Ethereum).
 */

const blockchainLog = [];

/**
 * Class wrapper to support named export import { BlockchainAudit } ...
 */
export class BlockchainAudit {
  constructor() {
    this.chain = blockchainLog;
  }

  /**
   * Records a new block with timestamp and simulated hash
   * @param {object} entry - Any structured data to store
   * @returns {object} The block stored
   */
  record(entry) {
    const timestamp = new Date().toISOString();
    const hash = generateFakeHash(entry);
    const block = {
      timestamp,
      hash,
      data: entry,
    };
    this.chain.push(block);
    console.log('[BlockchainAudit] New block added:', block);
    return block;
  }

  /**
   * Retrieves the current blockchain log
   * @returns {Array} Chain history
   */
  getChain() {
    return [...this.chain];
  }

  /**
   * Validates integrity of in-memory chain (simulated check)
   * @returns {boolean}
   */
  isValidChain() {
    return this.chain.length > 0;
  }
}

// Legacy static API (preserved for compatibility)
export const recordToBlockchain = (entry) => {
  return new BlockchainAudit().record(entry);
};

export const getBlockchainLog = () => {
  return new BlockchainAudit().getChain();
};

// 🧪 Simulated hash function (for dev use only)
function generateFakeHash(entry) {
  const str = JSON.stringify(entry) + Date.now();
  return cryptoStyleHash(str);
}

// 🔐 Simple mock hash function (non-cryptographic)
function cryptoStyleHash(str) {
  let hash = 0, i, chr;
  if (str.length === 0) return '0';
  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return '0x' + Math.abs(hash).toString(16);
}
