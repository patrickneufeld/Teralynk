// src/files/utils.js
import { v4 as uuidv4 } from 'uuid';

/**
 * Formats file size from bytes to human-readable string.
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Extracts the file extension from a filename.
 */
export const getFileExtension = (filename) => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

/**
 * Validates if the file type is allowed based on given MIME types.
 */
export const isFileTypeAllowed = (file, allowedTypes) => {
  const fileType = file.type || `application/${getFileExtension(file.name)}`;
  return Object.keys(allowedTypes).some(type => {
    if (type.endsWith('/*')) {
      const baseType = type.split('/')[0];
      return fileType.startsWith(`${baseType}/`);
    }
    return type === fileType;
  });
};

/**
 * Generates a thumbnail preview (base64) for image files.
 */
export const generateThumbnail = async (file) => {
  if (!file.type.startsWith('image/')) return null;

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const maxSize = 100;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height *= maxSize / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width *= maxSize / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL());
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

/**
 * Retries a given async operation with exponential backoff.
 */
export const retryOperation = async (
  operation,
  maxAttempts = 3,
  delay = 500
) => {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts) break;
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError;
};
