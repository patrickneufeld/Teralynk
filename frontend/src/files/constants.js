// src/files/constants.js

// Base URLs and API endpoints
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";
export const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:5001/ws";

// File upload constants
export const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
export const SYNC_INTERVAL = 30000; // 30 seconds
export const MAX_RETRY_ATTEMPTS = 3;
export const RETRY_DELAY = 1000;

// Allowed file types
export const ALLOWED_FILE_TYPES = {
  'image/*': true,
  'application/pdf': true, 
  'text/*': true,
  'application/msword': true,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': true,
  'application/vnd.ms-excel': true,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': true,
  'application/vnd.ms-powerpoint': true,
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': true
};

// File status constants
export const FILE_STATUS = {
  PENDING: 'pending',
  UPLOADING: 'uploading', 
  PROCESSING: 'processing',
  COMPLETE: 'complete',
  ERROR: 'error',
  CANCELLED: 'cancelled'
};

// Collaboration modes
export const COLLABORATION_MODES = {
  VIEW: 'view',
  EDIT: 'edit',
  COMMENT: 'comment', 
  REVIEW: 'review'
};

// Socket.io events
export const SOCKET_EVENTS = {
  // Connection events
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  ERROR: 'error',
  
  // Reconnection events
  RECONNECT: 'reconnect',
  RECONNECT_ATTEMPT: 'reconnect_attempt',
  RECONNECT_ERROR: 'reconnect_error',
  RECONNECT_FAILED: 'reconnect_failed',
  
  // File events
  FILE_UPDATED: 'file:updated',
  FILE_DELETED: 'file:deleted',
  
  // Collaboration events
  COLLABORATOR_JOINED: 'collaborator:joined',
  COLLABORATOR_LEFT: 'collaborator:left',
  COMMENT_ADDED: 'comment:added',
  
  // Sync events
  SYNC_REQUEST: 'sync:request',
  SYNC_RESPONSE: 'sync:response'
};