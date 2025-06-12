// /backend/src/utils/errors.js

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized', details = {}) {
    super(message);
    this.name = 'UnauthorizedError';
    this.details = details;
    this.statusCode = 401;
    if (Error.captureStackTrace) Error.captureStackTrace(this, UnauthorizedError);
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'Forbidden', details = {}) {
    super(message);
    this.name = 'ForbiddenError';
    this.details = details;
    this.statusCode = 403;
    if (Error.captureStackTrace) Error.captureStackTrace(this, ForbiddenError);
  }
}

export class ValidationError extends Error {
  constructor(message = 'Validation error', details = {}) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
    this.statusCode = 400;
    if (Error.captureStackTrace) Error.captureStackTrace(this, ValidationError);
  }
}

export class DatabaseError extends Error {
  constructor(message = 'Database error', details = {}) {
    super(message);
    this.name = 'DatabaseError';
    this.details = details;
    this.statusCode = 500;
    if (Error.captureStackTrace) Error.captureStackTrace(this, DatabaseError);
  }
}
