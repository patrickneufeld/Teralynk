/**
 * ✅ Custom Error Classes for Backend Error Handling
 */

export class DatabaseError extends Error {
  constructor(message = 'Database operation failed', details = {}) {
    super(message);
    this.name = 'DatabaseError';
    this.details = details;
  }
}

export class UnauthorizedAccessError extends Error {
  constructor(message = 'Unauthorized access', details = {}) {
    super(message);
    this.name = 'UnauthorizedAccessError';
    this.details = details;
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'Access forbidden', details = {}) {
    super(message);
    this.name = 'ForbiddenError';
    this.details = details;
  }
}
