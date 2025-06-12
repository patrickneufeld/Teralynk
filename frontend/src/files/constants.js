// src/files/constants.js

// Environment variables with fallbacks
const ENV = {
  BACKEND_URL: import.meta.env.VITE_BACKEND_URL || "http://localhost:5001",
  WS_URL: import.meta.env.VITE_WS_URL || "ws://localhost:5001/ws"
};

// Size and timing constants
const SIZES = {
  CHUNK: 5 * 1024 * 1024, // 5MB chunks
  MAX_FILE: 100 * 1024 * 1024 // 100MB
};

const TIMING = {
  SYNC_INTERVAL: 30000, // 30 seconds
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000
};

// File types mapping
const ALLOWED_FILE_TYPES = Object.freeze({
  'image/*': true,
  'application/pdf': true, 
  'text/*': true,
  'application/msword': true,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': true,
  'application/vnd.ms-excel': true,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': true,
  'application/vnd.ms-powerpoint': true,
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': true
});

// Status enums
const FILE_STATUS = Object.freeze({
  PENDING: 'pending',
  UPLOADING: 'uploading', 
  PROCESSING: 'processing',
  COMPLETE: 'complete',
  ERROR: 'error',
  CANCELLED: 'cancelled'
});

// Collaboration modes
const COLLABORATION_MODES = Object.freeze({
  VIEW: 'view',
  EDIT: 'edit',
  COMMENT: 'comment', 
  REVIEW: 'review'
});

// Socket events grouped by category
const SOCKET_EVENTS = Object.freeze({
  CONNECTION: {
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
    CONNECT_ERROR: 'connect_error',
    ERROR: 'error'
  },
  
  RECONNECTION: {
    RECONNECT: 'reconnect',
    RECONNECT_ATTEMPT: 'reconnect_attempt',
    RECONNECT_ERROR: 'reconnect_error',
    RECONNECT_FAILED: 'reconnect_failed'
  },
  
  FILE: {
    UPDATED: 'file:updated',
    DELETED: 'file:deleted'
  },
  
  COLLABORATION: {
    COLLABORATOR_JOINED: 'collaborator:joined',
    COLLABORATOR_LEFT: 'collaborator:left',
    COMMENT_ADDED: 'comment:added'
  },
  
  SYNC: {
    REQUEST: 'sync:request',
    RESPONSE: 'sync:response'
  }
});

// Export everything
export {
  ENV,
  SIZES as FILE_SIZES,
  TIMING,
  ALLOWED_FILE_TYPES,
  FILE_STATUS,
  COLLABORATION_MODES,
  SOCKET_EVENTS
};

// Export commonly used values directly
export const BACKEND_URL = ENV.BACKEND_URL;
export const WS_URL = ENV.WS_URL;
export const CHUNK_SIZE = SIZES.CHUNK;
export const MAX_FILE_SIZE = SIZES.MAX_FILE;
export const SYNC_INTERVAL = TIMING.SYNC_INTERVAL;
export const MAX_RETRY_ATTEMPTS = TIMING.MAX_RETRY_ATTEMPTS;
export const RETRY_DELAY = TIMING.RETRY_DELAY;
