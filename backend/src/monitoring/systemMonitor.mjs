// ✅ FILE: /backend/src/monitoring/systemMonitor.js

/**
 * SystemMonitor - Tracks CPU, memory, disk, and network usage.
 * Supports anomaly detection hooks and real-time telemetry dispatch.
 */

import os from 'os';
import { emitTelemetry } from '../utils/telemetryUtils.mjs';

const SYSTEM_METRICS_INTERVAL = 60000; // every 60 seconds

let lastCpuInfo = os.cpus();

/**
 * Calculates CPU usage percentage over time.
 * @returns {number} - Float between 0 and 1
 */
function getCpuUsage() {
  const cpus = os.cpus();
  let idleDiff = 0;
  let totalDiff = 0;

  cpus.forEach((core, i) => {
    const oldCore = lastCpuInfo[i];
    const idle = core.times.idle - oldCore.times.idle;
    const total =
      Object.values(core.times).reduce((acc, t) => acc + t, 0) -
      Object.values(oldCore.times).reduce((acc, t) => acc + t, 0);

    idleDiff += idle;
    totalDiff += total;
  });

  lastCpuInfo = cpus;
  return totalDiff > 0 ? 1 - idleDiff / totalDiff : 0;
}

/**
 * Gets memory usage ratio
 * @returns {number} - Float between 0 and 1
 */
function getMemoryUsage() {
  const total = os.totalmem();
  const free = os.freemem();
  return (total - free) / total;
}

/**
 * Collects current system performance metrics
 * @returns {object}
 */
function collectSystemMetrics() {
  const metrics = {
    cpuLoad: getCpuUsage(),
    memoryLoad: getMemoryUsage(),
    loadAvg: os.loadavg(),
    uptime: os.uptime(),
    timestamp: new Date().toISOString(),
    hostname: os.hostname(),
  };

  emitTelemetry('SYSTEM_METRIC', metrics);
  return metrics;
}

/**
 * Starts the system metrics monitor loop
 */
export function startSystemMonitor() {
  collectSystemMetrics(); // initial sample
  setInterval(collectSystemMetrics, SYSTEM_METRICS_INTERVAL);
}

/**
 * Gets a one-time snapshot of system metrics
 * @returns {object}
 */
export function getCurrentMetricsSnapshot() {
  return collectSystemMetrics();
}

// ✅ Alias to match other files expecting getSystemMetrics
export const getSystemMetrics = getCurrentMetricsSnapshot;
