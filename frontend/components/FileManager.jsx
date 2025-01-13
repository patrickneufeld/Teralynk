// File Path: frontend/components/FileManager.jsx

import React, { useState } from 'react';
import '../styles/FileManager.css'; // Updated path for CSS file

const FileManager = () => {
    const [files, setFiles] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [uploading, setUploading] = useState(false);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        setError('');
        setSuccess('');
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const uploadedFile = await response.json();
                setFiles((prev) => [...prev, uploadedFile]);
                setSuccess('File uploaded successfully!');
            } else {
                setError('Failed to upload file. Please try again.');
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="file-manager">
            <h2>Your Files</h2>

            {/* Error and Success Messages */}
            {error && <p className="error-message" aria-live="polite">{error}</p>}
            {success && <p className="success-message" aria-live="polite">{success}</p>}

            {/* File Upload */}
            <div className="file-upload">
                <label htmlFor="file-upload" className="upload-label">
                    Choose a file to upload:
                </label>
                <input
                    type="file"
                    id="file-upload"
                    onChange={handleFileUpload}
                    aria-label="Upload a file"
                />
                {uploading && <p className="uploading-message">Uploading...</p>}
            </div>

            {/* File List */}
            {files.length === 0 ? (
                <p className="empty-message">No files uploaded yet.</p>
            ) : (
                <ul className="file-list">
                    {files.map((file) => (
                        <li key={file.id} className="file-item">
                            {file.name}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default FileManager;
