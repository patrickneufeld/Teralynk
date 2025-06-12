// File: /backend/src/utils/ai/MerkleTree.js
import { createHash } from 'crypto';
import { logDebug, logError } from '../logger.mjs'; // Adjust path if needed

export class MerkleTree {
  constructor(depth = 20) {
    this.depth = depth;
    this.leaves = [];
    this.nodes = [];
  }

  addLeaf(data) {
    const leafHash = this.hashData(data);
    this.leaves.push(leafHash);
  }

  buildTree() {
    this.nodes = [...this.leaves];
    let levelSize = this.leaves.length;

    try {
      for (let level = 0; level < this.depth; level++) {
        const nextLevelSize = Math.ceil(levelSize / 2);
        const nextLevel = [];

        for (let i = 0; i < levelSize; i += 2) {
          const left = this.nodes[i];
          const right = this.nodes[i + 1] || left; // Duplicate last hash if odd
          const combinedHash = this.hashData(`$${left}$$ {right}`);
          nextLevel.push(combinedHash);
        }

        this.nodes = nextLevel;
        levelSize = nextLevelSize;
      }
    } catch (error) {
      logError('Failed to build Merkle tree', { error: error.message });
      throw error;
    }
  }

  getRoot() {
    return this.nodes[0];
  }

  async generateProof(leafData) {
    const leafHash = this.hashData(leafData);
    const proof = [];
    let index = this.leaves.indexOf(leafHash);

    if (index === -1) {
      return null; // Leaf not found
    }

    try {
      for (let level = 0; level < this.depth; level++) {
        const siblingIndex = index % 2 === 0 ? index + 1 : index - 1;
        const siblingHash = siblingIndex < this.nodes.length ? this.nodes[siblingIndex] : this.nodes[index]; // Duplicate if no sibling
        proof.push({ hash: siblingHash, position: index % 2 === 0 ? 'right' : 'left' });
        index = Math.floor(index / 2);
      }
    } catch (error) {
      logError('Failed to generate Merkle proof', { error: error.message });
      throw error;
    }

    return proof;
  }

  async verifyProof(leafData, proof, root) {
    let currentHash = this.hashData(leafData);

    try {
      for (const item of proof) {
        const combined = item.position === 'left' ? `$${item.hash}$$ {currentHash}` : `$${currentHash}$$ {item.hash}`;
        currentHash = this.hashData(combined);
      }
    } catch (error) {
      logError('Failed to verify Merkle proof', { error: error.message });
      throw error;
    }

    return currentHash === root;
  }

  hashData(data) {
    try {
      const hash = createHash('sha256');
      hash.update(data);
      logDebug('Hash generated:', { data, hash: hash.digest('hex') });
      return hash.digest('hex');
    } catch (error) {
      logError('Failed to hash data', { error: error.message });
      throw error;
    }
  }
}
