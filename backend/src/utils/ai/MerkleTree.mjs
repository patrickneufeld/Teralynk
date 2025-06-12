// /backend/src/utils/ai/MerkleTree.js
import crypto from 'crypto';

export class MerkleTree {
  constructor(leaves = []) {
    this.leaves = leaves.map(this.hash);
    this.root = this.buildTree(this.leaves);
  }

  hash(value) {
    return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
  }

  buildTree(nodes) {
    if (nodes.length === 1) return nodes[0];
    const parent = [];

    for (let i = 0; i < nodes.length; i += 2) {
      const left = nodes[i];
      const right = nodes[i + 1] || left;
      parent.push(this.hash(left + right));
    }

    return this.buildTree(parent);
  }

  getRoot() {
    return this.root;
  }
}
