// File: /backend/src/ai/config/CoreConfig.js

const CORE_CONFIG = {
  quantumSecurity: { // Use camelCase for consistency
    keySize: 512,       // Use camelCase for consistency
    latticeDimension: 1024, // Use camelCase for consistency
    ringDimension: 2048,   // Use camelCase for consistency
    errorDistribution: 'discrete_gaussian',
    postQuantumSchemes: ['CRYSTALS-Kyber', 'SPHINCS+', 'Dilithium'], // Use camelCase for consistency
  },
  neuralPatterns: { // Use camelCase for consistency
    networkTopology: [784, 512, 256, 128, 64],
    learningRate: 0.001,
    batchSize: 128,
    epochs: 100,
    activation: 'leaky_relu',
    dropoutRate: 0.3,  // Use camelCase for consistency
    regularization: 'l2',
  },
  consensus: {
    algorithm: 'raft',
    timeoutMs: 5000,   // Use camelCase for consistency
    heartbeatMs: 1000,  // Use camelCase for consistency
    replicationFactor: 3, // Use camelCase for consistency
    quorumSize: 2,        // Use camelCase for consistency
    maxElectionRounds: 5, // Use camelCase for consistency
  },
  blockchain: {
    blockSize: 1000,       // Use camelCase for consistency
    hashAlgorithm: 'sha3-512', // Use camelCase for consistency
    merkleTreeDepth: 20,   // Use camelCase for consistency
    proofOfStake: {
      minStake: 1000,           // Use camelCase for consistency
      validationThreshold: 0.67, // Use camelCase for consistency
      slashingPenalty: 0.1,     // Use camelCase for consistency
    },
  },
  memoryManagement: { // Use camelCase for consistency
    shardCount: 32,        // Use camelCase for consistency
    replicationFactor: 3, // Use camelCase for consistency
    consistencyLevel: 'quorum', // Use camelCase for consistency
    compactionThreshold: 0.7, // Use camelCase for consistency
    gcIntervalMs: 300000,      // Use camelCase for consistency
    maxShardSizeGb: 2,        // Use camelCase for consistency
  },
  telemetry: {
    samplingRate: 0.01,        // Use camelCase for consistency
    retentionDays: 90,         // Use camelCase for consistency
    aggregationLevels: ['1s', '1m', '5m', '1h', '1d'],
    anomalyDetection: {
      sensitivity: 0.95,          // Use camelCase for consistency
      trainingWindowDays: 30,    // Use camelCase for consistency
      updateFrequencyHours: 6,   // Use camelCase for consistency
    },
  },
  zeroTrust: {
    sessionTtlMs: 900000,      // Use camelCase for consistency
    maxTokenAgeMs: 300000,     // Use camelCase for consistency
    requiredClaims: ['sub', 'scope', 'iat', 'exp', 'jti'],
    verificationLevels: ['token', 'device', 'behavior', 'context'], // Use camelCase for consistency
    mfaRequired: true,          // Use camelCase for consistency
  },
  adaptiveScaling: { // Use camelCase for consistency
    minInstances: 3,          // Use camelCase for consistency
    maxInstances: 100,         // Use camelCase for consistency
    scaleUpThreshold: 0.7,    // Use camelCase for consistency
    scaleDownThreshold: 0.3,  // Use camelCase for consistency
    cooldownPeriodMs: 300000,   // Use camelCase for consistency
    predictionWindowMs: 3600000, // Use camelCase for consistency
  },
  // ... Add other configurations here
};

export { CORE_CONFIG }; // Export the configuration object
