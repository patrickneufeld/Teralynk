// File Path: frontend/components/FileUpload.jsx

import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import '../styles/FileUpload.css'; // Ensure the CSS file exists

const FileUpload = () => {
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [storageInfo, setStorageInfo] = useState(null);

    // Function to check available storage and apply ML model
    const getBestStorageOption = async (file) => {
        try {
            const response = await axios.post('/api/storage/check', {
                fileSize: file.size,
            });
            setStorageInfo(response.data); // Receive the storage platform recommendation

            if (response.data.suggestUpgrade) {
                setError('Your storage is almost full. Consider upgrading your plan!');
            }
        } catch (error) {
            console.error('Error determining best storage option:', error);
            setError('Error determining storage. Please try again later.');
        }
    };

    // Handle file drop
    const onDrop = async (acceptedFiles) => {
        setUploading(true);
        setError('');
        setSuccess('');
        const formData = new FormData();

        acceptedFiles.forEach((file) => {
            formData.append('files', file);
            // Check best storage option for each file before uploading
            getBestStorageOption(file);
        });

        try {
            const response = await axios.post('/api/files/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setUploadedFiles(response.data.files);
            setSuccess('Files uploaded successfully!');
            setUploading(false);
        } catch (error) {
            setError('Error uploading files. Please try again.');
            setUploading(false);
        }
    };

    // Set up dropzone options
    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        multiple: true, // Allow multiple file uploads
        accept: 'image/*,video/*,application/pdf', // Adjust accepted file types as needed
    });

    return (
        <div className="file-upload-container">
            <div
                {...getRootProps()}
                className="file-dropzone"
                aria-label="Drop files here or click to select files"
            >
                <input {...getInputProps()} />
                <p>Drag & Drop your files here, or click to select files</p>
            </div>

            {uploading && <p className="uploading-message" aria-live="polite">Uploading files...</p>}

            {error && <p className="error-message" aria-live="polite">{error}</p>}
            {success && <p className="success-message" aria-live="polite">{success}</p>}

            {storageInfo && !error && (
                <div className="storage-info">
                    <h3>Storage Information:</h3>
                    <p>Recommended Platform: {storageInfo.recommendedPlatform}</p>
                    {storageInfo.suggestUpgrade && (
                        <p className="storage-alert">
                            Your storage is nearing its limit. Upgrade recommended!
                        </p>
                    )}
                </div>
            )}

            {uploadedFiles.length > 0 && (
                <div className="uploaded-files">
                    <h3>Uploaded Files:</h3>
                    <ul>
                        {uploadedFiles.map((file, index) => (
                            <li key={index}>{file.name}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default FileUpload;
