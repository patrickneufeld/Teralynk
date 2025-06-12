// ✅ FILE: /backend/src/services/common/cacheService.js

import { LRUCache } from 'lru-cache';

// Memory cache setup
const defaultOptions = {
  max: 1000,
  ttl: 1000 * 60 * 5, // 5 minutes
};

const memoryCache = new LRUCache(defaultOptions);

// Mock Redis availability check
export function isRedisAvailable() {
  // You can replace this with actual logic later
  return false; // Assume Redis is not available for now
}

// Mock Redis client getter
export function getRedisClient() {
  throw new Error('Redis client not configured. Please implement getRedisClient().');
}

// Cache utilities (in-memory)
export function getCache(key) {
  return memoryCache.get(key);
}

export function setCache(key, value, ttl = defaultOptions.ttl) {
  memoryCache.set(key, value, { ttl });
}

export function deleteCache(key) {
  memoryCache.delete(key);
}

export function clearCache() {
  memoryCache.clear();
}

export function hasCache(key) {
  return memoryCache.has(key);
}
