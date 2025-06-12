// ✅ FILE: /backend/src/ai/config/CoreConfig.js

const CORE_CONFIG = {
  quantumSecurity: {
    keySize: 512,
    latticeDimension: 1024,
    ringDimension: 2048,
    errorDistribution: 'discrete_gaussian',
    postQuantumSchemes: ['CRYSTALS-Kyber', 'SPHINCS+', 'Dilithium'],
  },
  neuralPatterns: {
    networkTopology: [784, 512, 256, 128, 64],
    learningRate: 0.001,
    batchSize: 128,
    epochs: 100,
    activation: 'leaky_relu',
    dropoutRate: 0.3,
    regularization: 'l2',
  },
  consensus: {
    algorithm: 'raft',
    timeoutMs: 5000,
    heartbeatMs: 1000,
    replicationFactor: 3,
    quorumSize: 2,
    maxElectionRounds: 5,
  },
  blockchain: {
    blockSize: 1000,
    hashAlgorithm: 'sha3-512',
    merkleTreeDepth: 20,
    proofOfStake: {
      minStake: 1000,
      validationThreshold: 0.67,
      slashingPenalty: 0.1,
    },
  },
  memoryManagement: {
    shardCount: 32,
    replicationFactor: 3,
    consistencyLevel: 'quorum',
    compactionThreshold: 0.7,
    gcIntervalMs: 300000,
    maxShardSizeGb: 2,
  },
  telemetry: {
    samplingRate: 0.01,
    retentionDays: 90,
    aggregationLevels: ['1s', '1m', '5m', '1h', '1d'],
    anomalyDetection: {
      sensitivity: 0.95,
      trainingWindowDays: 30,
      updateFrequencyHours: 6,
    },
  },
  zeroTrust: {
    sessionTtlMs: 900000,
    maxTokenAgeMs: 300000,
    requiredClaims: ['sub', 'scope', 'iat', 'exp', 'jti'],
    verificationLevels: ['token', 'device', 'behavior', 'context'],
    mfaRequired: true,
  },
  adaptiveScaling: {
    minInstances: 3,
    maxInstances: 100,
    scaleUpThreshold: 0.7,
    scaleDownThreshold: 0.3,
    cooldownPeriodMs: 300000,
    predictionWindowMs: 3600000,
  },
};

export { CORE_CONFIG };
