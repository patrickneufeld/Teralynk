// ✅ FILE: /backend/src/distributed/consensus.js

/**
 * Simulated consensus engine for distributed AI verification.
 * Intended for future upgrade to RAFT, Paxos, or federated quorum systems.
 */

export class ConsensusManager {
  constructor(nodes = ['aiCoreAlpha', 'aiCoreBeta', 'aiCoreGamma', 'observerNode']) {
    this.voters = [...nodes];
  }

  /**
   * Runs a simulated consensus vote on a proposal
   * @param {object} proposal - Must contain a unique `id` and optional `priority`
   * @returns {object} result { approved, votes, total }
   */
  runConsensus(proposal) {
    const approvals = this.simulateVotes(proposal);
    const decision = approvals >= this.requiredQuorum();

    console.log(
      `[Consensus] Proposal "${proposal?.id}" approved: ${decision} (${approvals}/${this.voters.length})`
    );

    return {
      approved: decision,
      votes: approvals,
      total: this.voters.length,
    };
  }

  /**
   * Simulates votes from peers with weighted randomness
   */
  simulateVotes(proposal) {
    const randomness = proposal?.priority === 'critical' ? 0.8 : 0.5;
    return this.voters.reduce((count) => {
      return Math.random() < randomness ? count + 1 : count;
    }, 0);
  }

  /**
   * Calculates the quorum required
   */
  requiredQuorum() {
    return Math.ceil(this.voters.length / 2);
  }

  /**
   * Adds a new voting peer
   * @param {string} nodeId
   */
  addNode(nodeId) {
    if (!this.voters.includes(nodeId)) {
      this.voters.push(nodeId);
    }
  }

  /**
   * Removes a peer from voting
   * @param {string} nodeId
   */
  removeNode(nodeId) {
    this.voters = this.voters.filter((n) => n !== nodeId);
  }

  /**
   * Returns current voter list
   */
  getVoters() {
    return [...this.voters];
  }
}
