import React, { useState, useEffect } from 'react';
import S3FileUpload from '../components/S3FileUpload';
import S3FileExplorer from '../components/S3FileExplorer';
import s3Api from '../api/s3Api';

/**
 * S3StoragePage component that combines S3FileUpload and S3FileExplorer
 */
const S3StoragePage = () => {
  const [buckets, setBuckets] = useState([]);
  const [selectedBucket, setSelectedBucket] = useState('teralynk-storage');
  const [currentPrefix, setCurrentPrefix] = useState('');
  const [storageUsage, setStorageUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Load buckets from S3
   */
  const loadBuckets = async () => {
    try {
      const bucketList = await s3Api.listBuckets();
      setBuckets(bucketList || []);
      
      if (bucketList && bucketList.length > 0 && !selectedBucket) {
        setSelectedBucket(bucketList[0].Name);
      }
    } catch (err) {
      console.error('Error loading buckets:', err);
      setError('Failed to load buckets. Please try again.');
    }
  };

  /**
   * Load storage usage statistics
   */
  const loadStorageUsage = async () => {
    try {
      const usage = await s3Api.getStorageUsage(selectedBucket);
      setStorageUsage(usage);
    } catch (err) {
      console.error('Error loading storage usage:', err);
      // Don't set error state here to avoid blocking the UI
    }
  };

  /**
   * Handle bucket change
   */
  const handleBucketChange = (e) => {
    setSelectedBucket(e.target.value);
    setCurrentPrefix('');
  };

  /**
   * Handle folder change
   */
  const handleFolderChange = (prefix) => {
    setCurrentPrefix(prefix);
  };

  /**
   * Handle upload complete
   */
  const handleUploadComplete = (results) => {
    // Refresh file explorer and storage usage
    loadStorageUsage();
  };

  /**
   * Handle refresh
   */
  const handleRefresh = () => {
    loadStorageUsage();
  };

  // Load buckets and storage usage on mount
  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      await loadBuckets();
      setLoading(false);
    };
    
    initialize();
  }, []);

  // Load storage usage when selected bucket changes
  useEffect(() => {
    if (selectedBucket) {
      loadStorageUsage();
    }
  }, [selectedBucket]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">S3 File Storage</h1>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <svg className="animate-spin h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-medium mb-4">Upload Files</h2>
              
              {/* Bucket selector */}
              <div className="mb-4">
                <label htmlFor="bucket" className="block text-sm font-medium text-gray-700 mb-1">
                  Select Bucket
                </label>
                <select
                  id="bucket"
                  value={selectedBucket}
                  onChange={handleBucketChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  {buckets.map((bucket) => (
                    <option key={bucket.Name} value={bucket.Name}>
                      {bucket.Name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* File uploader */}
              <S3FileUpload
                bucket={selectedBucket}
                folder={currentPrefix}
                onUploadComplete={handleUploadComplete}
                onError={(error) => setError(error)}
              />
            </div>

            {/* Storage usage */}
            {storageUsage && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-medium mb-4">Storage Usage</h2>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Used</span>
                      <span className="font-medium">{storageUsage.usedMB} MB</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          storageUsage.percentUsed > 90
                            ? 'bg-red-500'
                            : storageUsage.percentUsed > 70
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${storageUsage.percentUsed}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total</span>
                    <span className="font-medium">{storageUsage.totalMB} MB</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Files</span>
                    <span className="font-medium">{storageUsage.objectCount}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Main content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium mb-4">File Explorer</h2>
              
              <S3FileExplorer
                bucket={selectedBucket}
                initialPrefix={currentPrefix}
                onFolderChange={handleFolderChange}
                onRefresh={handleRefresh}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default S3StoragePage;
