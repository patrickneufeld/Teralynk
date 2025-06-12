// File: /backend/src/middleware/validationMiddleware.js

import { checkSchema, validationResult } from 'express-validator';
import { logError, logWarn } from '../utils/logger.mjs';

/**
 * Enhanced error handler with detailed logging and structured responses
 */
export const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        const validationErrors = errors.array().map(err => ({
            field: err.param,
            message: err.msg,
            value: err.value,
            location: err.location
        }));

        logWarn('Validation failed', {
            path: req.path,
            method: req.method,
            errors: validationErrors,
            userId: req.user?.id || 'anonymous'
        });

        return res.status(400).json({
            status: 'error',
            message: 'Validation failed',
            errors: validationErrors,
            timestamp: new Date().toISOString()
        });
    }
    next();
};

/**
 * Common validation options
 */
const commonValidations = {
    stringField: {
        isString: true,
        trim: true,
        escape: true
    },
    requiredString: {
        isString: true,
        notEmpty: true,
        trim: true,
        escape: true
    },
    email: {
        isEmail: true,
        normalizeEmail: {
            gmail_remove_dots: false,
            gmail_remove_subaddress: false
        },
        trim: true,
        toLowerCase: true
    },
    password: {
        isLength: {
            options: { min: 8, max: 100 },
            errorMessage: 'Password must be between 8 and 100 characters'
        },
        matches: {
            options: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
            errorMessage: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
        },
        trim: true
    }
};

/**
 * Enhanced validation schemas
 */
export const authSchema = {
    email: {
        ...commonValidations.email,
        errorMessage: 'Please provide a valid email address'
    },
    password: {
        ...commonValidations.password,
        in: ['body']
    }
};

export const fileMetadataSchema = {
    fileName: {
        ...commonValidations.requiredString,
        in: ['body'],
        matches: {
            options: [/^[a-zA-Z0-9-_. ]+$/],
            errorMessage: 'File name can only contain letters, numbers, spaces, and common punctuation'
        },
        isLength: {
            options: { min: 1, max: 255 },
            errorMessage: 'File name must be between 1 and 255 characters'
        }
    },
    fileSize: {
        in: ['body'],
        isInt: {
            options: { min: 1, max: 5 * 1024 * 1024 * 1024 }, // 5GB max
            errorMessage: 'File size must be between 1 byte and 5GB'
        },
        toInt: true
    },
    mimeType: {
        ...commonValidations.requiredString,
        in: ['body'],
        matches: {
            options: [/^[a-zA-Z0-9-/+.]+$/],
            errorMessage: 'Invalid MIME type format'
        },
        custom: {
            options: (value) => {
                const allowedTypes = [
                    'image/',
                    'video/',
                    'audio/',
                    'application/pdf',
                    'application/json',
                    'text/'
                ];
                return allowedTypes.some(type => value.startsWith(type));
            },
            errorMessage: 'Unsupported file type'
        }
    }
};

export const paginationSchema = {
    page: {
        in: ['query'],
        optional: true,
        isInt: {
            options: { min: 1, max: 1000 },
            errorMessage: 'Page number must be between 1 and 1000'
        },
        toInt: true
    },
    limit: {
        in: ['query'],
        optional: true,
        isInt: {
            options: { min: 1, max: 100 },
            errorMessage: 'Limit must be between 1 and 100'
        },
        toInt: true,
        default: { options: 10 }
    },
    sortBy: {
        in: ['query'],
        optional: true,
        isIn: {
            options: [['createdAt', 'updatedAt', 'name', 'size']],
            errorMessage: 'Invalid sort field'
        }
    },
    sortOrder: {
        in: ['query'],
        optional: true,
        isIn: {
            options: [['asc', 'desc']],
            errorMessage: 'Sort order must be asc or desc'
        },
        default: { options: 'desc' }
    }
};

export const resourceIdSchema = {
    id: {
        in: ['params'],
        isInt: {
            options: { min: 1 },
            errorMessage: 'Resource ID must be a positive integer'
        },
        toInt: true
    }
};

export const searchSchema = {
    query: {
        ...commonValidations.requiredString,
        in: ['query'],
        isLength: {
            options: { min: 2, max: 100 },
            errorMessage: 'Search query must be between 2 and 100 characters'
        }
    },
    filters: {
        in: ['query'],
        optional: true,
        isJSON: {
            errorMessage: 'Filters must be valid JSON'
        },
        custom: {
            options: (value) => {
                try {
                    const filters = JSON.parse(value);
                    // Add custom filter validation logic here
                    return true;
                } catch (e) {
                    return false;
                }
            },
            errorMessage: 'Invalid filter format'
        }
    }
};

export const registrationSchema = {
    firstName: {
        ...commonValidations.requiredString,
        in: ['body'],
        isLength: {
            options: { min: 2, max: 50 },
            errorMessage: 'First name must be between 2 and 50 characters'
        },
        matches: {
            options: [/^[a-zA-Z\s-']+$/],
            errorMessage: 'First name can only contain letters, spaces, hyphens, and apostrophes'
        }
    },
    lastName: {
        ...commonValidations.requiredString,
        in: ['body'],
        isLength: {
            options: { min: 2, max: 50 },
            errorMessage: 'Last name must be between 2 and 50 characters'
        },
        matches: {
            options: [/^[a-zA-Z\s-']+$/],
            errorMessage: 'Last name can only contain letters, spaces, hyphens, and apostrophes'
        }
    },
    email: {
        ...commonValidations.email,
        in: ['body']
    },
    password: {
        ...commonValidations.password,
        in: ['body']
    }
};

export const passwordResetSchema = {
    email: {
        ...commonValidations.email,
        in: ['body']
    },
    token: {
        in: ['body'],
        optional: true,
        isString: true,
        isLength: {
            options: { min: 32, max: 32 },
            errorMessage: 'Invalid reset token'
        }
    }
};

export const passwordUpdateSchema = {
    oldPassword: {
        ...commonValidations.password,
        in: ['body']
    },
    newPassword: {
        ...commonValidations.password,
        in: ['body'],
        custom: {
            options: (value, { req }) => value !== req.body.oldPassword,
            errorMessage: 'New password must be different from old password'
        }
    },
    confirmPassword: {
        ...commonValidations.password,
        in: ['body'],
        custom: {
            options: (value, { req }) => value === req.body.newPassword,
            errorMessage: 'Password confirmation does not match'
        }
    }
};

// Export validation middlewares
export const validateAuthRequest = [checkSchema(authSchema), handleValidationErrors];
export const validateFileMetadata = [checkSchema(fileMetadataSchema), handleValidationErrors];
export const validatePaginationRequest = [checkSchema(paginationSchema), handleValidationErrors];
export const validateResourceId = [checkSchema(resourceIdSchema), handleValidationErrors];
export const validateSearchQuery = [checkSchema(searchSchema), handleValidationErrors];
export const validateRegistrationRequest = [checkSchema(registrationSchema), handleValidationErrors];
export const validatePasswordResetRequest = [checkSchema(passwordResetSchema), handleValidationErrors];
export const validatePasswordUpdateRequest = [checkSchema(passwordUpdateSchema), handleValidationErrors];

// Default export
export default {
    validateAuthRequest,
    validateFileMetadata,
    validatePaginationRequest,
    validateResourceId,
    validateSearchQuery,
    validateRegistrationRequest,
    validatePasswordResetRequest,
    validatePasswordUpdateRequest
};
