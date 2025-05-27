// FILE: /frontend/src/components/S3FileExplorer.jsx

import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import s3Api from '../api/s3Api';
import FileIcon from './FileIcon';
import { toast } from 'react-toastify';
import { logInfo, logError } from "@/utils/logging/logging";

const S3FileExplorer = ({
  bucket = 'teralynk-storage',
  initialPrefix = '',
  onFileSelect = () => {},
  onFolderChange = () => {},
  onRefresh = () => {}
}) => {
  const [objects, setObjects] = useState([]);
  const [currentPrefix, setCurrentPrefix] = useState(initialPrefix);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const loadObjects = useCallback(async (prefix = currentPrefix) => {
    setLoading(true);
    setError(null);

    try {
      const result = await s3Api.listObjects(bucket, prefix);
      setObjects(result.objects || []);
      setCurrentPrefix(prefix);
      updateBreadcrumbs(prefix);
      onFolderChange(prefix);
      logInfo('S3ObjectsLoaded', { bucket, prefix, count: result.objects.length });
    } catch (err) {
      console.error('Error loading objects:', err);
      setError('Failed to load files. Please try again.');
      logError(err, "LoadObjects");
      toast.error('Failed to load files.');
    } finally {
      setLoading(false);
    }
  }, [bucket, currentPrefix, onFolderChange]);

  const updateBreadcrumbs = (prefix) => {
    if (!prefix) {
      setBreadcrumbs([]);
      return;
    }

    const parts = prefix.split('/').filter(Boolean);
    const crumbs = parts.map((part, index) => {
      const path = parts.slice(0, index + 1).join('/') + '/';
      return { name: part, path };
    });

    setBreadcrumbs(crumbs);
  };

  const handleFolderClick = (prefix) => {
    loadObjects(prefix);
  };

  const handleFileClick = (file) => {
    const newSelection = file.Key === selectedFile?.Key ? null : file;
    setSelectedFile(newSelection);
    onFileSelect(newSelection);
  };

  const handleBreadcrumbClick = (path) => {
    loadObjects(path);
  };

  const navigateUp = () => {
    if (!currentPrefix) return;

    const parts = currentPrefix.split('/').filter(Boolean);
    parts.pop();
    const newPrefix = parts.length ? parts.join('/') + '/' : '';

    loadObjects(newPrefix);
  };

  const handleRefresh = () => {
    loadObjects();
    onRefresh();
    toast.info('Folder refreshed');
  };
  const handleDelete = async () => {
    if (!selectedFile) return;

    if (!window.confirm(`Are you sure you want to delete "${selectedFile.Key}"?`)) {
      return;
    }

    try {
      await s3Api.deleteFile(bucket, selectedFile.Key);
      setSelectedFile(null);
      handleRefresh();
      toast.success(`Deleted "${selectedFile.Key}" successfully.`);
      logInfo('S3FileDeleted', { bucket, key: selectedFile.Key });
    } catch (err) {
      console.error('Error deleting file:', err);
      setError('Failed to delete file. Please try again.');
      toast.error('Failed to delete file.');
      logError(err, "DeleteFile");
    }
  };

  const handlePreview = async () => {
    if (!selectedFile) return;

    try {
      const url = await s3Api.getPresignedUrl(bucket, selectedFile.Key);
      window.open(url, '_blank');
      logInfo('S3FilePreview', { bucket, key: selectedFile.Key });
    } catch (err) {
      console.error('Error generating preview URL:', err);
      setError('Failed to generate preview URL.');
      toast.error('Failed to preview file.');
      logError(err, "PreviewFile");
    }
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleString();
  };

  useEffect(() => {
    loadObjects(initialPrefix);
  }, [bucket, initialPrefix, loadObjects]);
  return (
    <div className="w-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={navigateUp}
            disabled={!currentPrefix}
            className={`p-2 rounded-md ${!currentPrefix ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
            title="Go up one folder"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>

          <button
            onClick={handleRefresh}
            className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
            title="Refresh Folder"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {selectedFile && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePreview}
              className="p-2 rounded-md text-blue-600 hover:bg-blue-50"
              title="Preview File"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>

            <button
              onClick={handleDelete}
              className="p-2 rounded-md text-red-600 hover:bg-red-50"
              title="Delete File"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 mb-4 text-sm">
        <button onClick={() => handleFolderClick('')} className="text-blue-600 hover:underline">
          {bucket}
        </button>

        {breadcrumbs.map((crumb) => (
          <React.Fragment key={crumb.path}>
            <span className="text-gray-400">/</span>
            <button
              onClick={() => handleBreadcrumbClick(crumb.path)}
              className="text-blue-600 hover:underline"
            >
              {crumb.name}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Errors */}
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
          {error}
        </div>
      )}

      {/* Loading Spinner */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      )}
      {/* File Table */}
      {!loading && objects.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No files found in this location.
        </div>
      )}

      {!loading && objects.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Modified
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {objects.map((object) => (
                <tr
                  key={object.Key}
                  onClick={() =>
                    object.IsFolder ? handleFolderClick(object.Key) : handleFileClick(object)
                  }
                  className={`cursor-pointer hover:bg-gray-50 ${
                    selectedFile?.Key === object.Key ? 'bg-blue-50' : ''
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileIcon
                        filename={object.Key.split('/').pop()}
                        isFolder={object.IsFolder}
                        size="sm"
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-900">{object.Key.split('/').pop() || object.Key}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {object.IsFolder ? '-' : formatSize(object.Size || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {object.IsFolder ? '-' : formatDate(object.LastModified)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

S3FileExplorer.propTypes = {
  bucket: PropTypes.string,
  initialPrefix: PropTypes.string,
  onFileSelect: PropTypes.func,
  onFolderChange: PropTypes.func,
  onRefresh: PropTypes.func,
};

export default S3FileExplorer;
