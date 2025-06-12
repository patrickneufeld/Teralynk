// hooks/useFileManager.js
import { useState, useCallback } from 'react';
import { formatFileSize, getFileExtension, isFileTypeAllowed, generateThumbnail, retryOperation } from '../utils';
import { ALLOWED_FILE_TYPES, FILE_STATUS } from '../constants';
import { handleApiError } from '../errorUtils';

export const useFileManager = () => {
  const [files, setFiles] = useState([]);
  const [fileStatuses, setFileStatuses] = useState({});
  const [uploadProgress, setUploadProgress] = useState({});

  const processFile = async (file) => {
    const fileId = uuidv4();
    const thumbnail = await generateThumbnail(file);
    return {
      id: fileId,
      name: file.name,
      size: file.size,
      type: file.type || `application/${getFileExtension(file.name)}`,
      thumbnail,
      lastModified: new Date().toISOString()
    };
  };

  const uploadFile = async (file) => {
    if (!isFileTypeAllowed(file, ALLOWED_FILE_TYPES)) {
      throw new Error('File type not allowed');
    }

    const fileData = await processFile(file);
    setFileStatuses(prev => ({ ...prev, [fileData.id]: FILE_STATUS.UPLOADING }));

    try {
      await retryOperation(async () => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('metadata', JSON.stringify(fileData));

        await apiClient.post('/api/files/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(prev => ({ ...prev, [fileData.id]: progress }));
          }
        });
      });

      setFiles(prev => [...prev, fileData]);
      setFileStatuses(prev => ({ ...prev, [fileData.id]: FILE_STATUS.COMPLETE }));
      return fileData;
    } catch (error) {
      setFileStatuses(prev => ({ ...prev, [fileData.id]: FILE_STATUS.ERROR }));
      throw error;
    }
  };

  return {
    files,
    fileStatuses,
    uploadProgress,
    uploadFile,
    // ... other file operations
  };
};
