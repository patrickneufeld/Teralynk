// FILE: /frontend/src/components/S3FileUpload.jsx

import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import s3Api from '../api/s3Api';
import FileIcon from './FileIcon';
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Loader } from "@/components/ui/Loader";
import { toast } from "react-toastify";
import { logInfo, logError } from "@/utils/logging/logging";

const MAX_FILE_SIZE_MB = 1000; // 1 GB
const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'xlsx', 'png', 'jpg', 'jpeg', 'txt', 'zip'];

const S3FileUpload = ({ 
  bucket = 'teralynk-storage', 
  folder = '', 
  onUploadComplete = () => {}, 
  onError = () => {} 
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadErrors, setUploadErrors] = useState({});
  const [completedFiles, setCompletedFiles] = useState([]);
  const abortControllers = useRef({});

  const validateFile = (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `File type .${ext} is not allowed.`;
    }
    const fileSizeMb = file.size / (1024 * 1024);
    if (fileSizeMb > MAX_FILE_SIZE_MB) {
      return `File ${file.name} exceeds maximum size of ${MAX_FILE_SIZE_MB}MB.`;
    }
    return null;
  };
  const onDrop = useCallback(async (acceptedFiles) => {
    if (!acceptedFiles.length) return;

    const newProgress = {};
    const newErrors = {};
    const validFiles = [];

    for (const file of acceptedFiles) {
      const validationError = validateFile(file);
      if (validationError) {
        newErrors[file.name] = validationError;
      } else {
        validFiles.push(file);
        newProgress[file.name] = 0;
      }
    }

    setUploadErrors(newErrors);
    setUploadProgress(newProgress);

    if (validFiles.length === 0) {
      toast.error("No valid files to upload.");
      return;
    }

    setUploading(true);

    const uploadPromises = validFiles.map(async (file) => {
      const controller = new AbortController();
      abortControllers.current[file.name] = controller;

      try {
        const key = folder ? `${folder}${file.name}` : file.name;
        const exists = await s3Api.checkFileExists(bucket, key);

        if (exists) {
          const confirmOverwrite = window.confirm(`"${file.name}" already exists. Overwrite?`);
          if (!confirmOverwrite) {
            throw new Error('Upload cancelled by user.');
          }
        }

        const result = await s3Api.uploadFile(
          file,
          bucket,
          folder,
          (progress) => {
            setUploadProgress((prev) => ({
              ...prev,
              [file.name]: progress,
            }));
          },
          controller.signal
        );

        setCompletedFiles((prev) => [...prev, file.name]);
        logInfo("FileUploadSuccess", { file: file.name, size: file.size, bucket, folder });
        return { file, result };
      } catch (error) {
        console.error(`Upload error [${file.name}]:`, error);
        newErrors[file.name] = error.message || 'Upload failed';
        logError(error, "FileUploadFailure");
        return { file, error };
      }
    });

    const results = await Promise.all(uploadPromises);

    setUploadErrors(newErrors);
    setTimeout(() => {
      setUploading(false);
      setUploadProgress({});
    }, 1500);

    onUploadComplete(results.filter(r => !r.error));
  }, [bucket, folder, onUploadComplete]);
  const handleCancelUpload = (fileName) => {
    if (abortControllers.current[fileName]) {
      abortControllers.current[fileName].abort();
      setUploadErrors((prev) => ({
        ...prev,
        [fileName]: "Upload cancelled",
      }));
      setUploadProgress((prev) => ({
        ...prev,
        [fileName]: 0,
      }));
      delete abortControllers.current[fileName];
      toast.info(`Upload cancelled for ${fileName}`);
    }
  };

  const handleRetryUpload = (fileName) => {
    const fakeFile = new File([""], fileName);
    onDrop([fakeFile]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: uploading,
    multiple: true,
  });
  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center justify-center space-y-2">
          <svg
            className={`w-12 h-12 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>

          {uploading ? (
            <p className="text-sm text-gray-500">Uploading files...</p>
          ) : isDragActive ? (
            <p className="text-sm text-blue-500">Drop the files here...</p>
          ) : (
            <p className="text-sm text-gray-500">
              Drag and drop files here, or click to select
            </p>
          )}
        </div>
      </div>

      {/* Upload Progress and Errors */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="mt-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Upload Progress</h3>

          {Object.entries(uploadProgress).map(([fileName, progress]) => (
            <div key={fileName} className="flex items-center space-x-3">
              <FileIcon filename={fileName} size="sm" />
              <span className="flex-1 text-xs truncate text-gray-700">{fileName}</span>

              <div className="relative w-32 h-2 bg-gray-200 rounded-full">
                <div
                  className="absolute top-0 left-0 h-2 bg-blue-500 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs w-10 text-right">{progress}%</span>

              {uploadErrors[fileName] && (
                <Button
                  onClick={() => handleRetryUpload(fileName)}
                  className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white"
                >
                  Retry
                </Button>
              )}

              {!uploadErrors[fileName] && uploading && (
                <Button
                  onClick={() => handleCancelUpload(fileName)}
                  className="text-xs bg-red-500 hover:bg-red-600 text-white"
                >
                  Cancel
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
S3FileUpload.propTypes = {
  bucket: PropTypes.string,
  folder: PropTypes.string,
  onUploadComplete: PropTypes.func,
  onError: PropTypes.func,
};

export default S3FileUpload;
