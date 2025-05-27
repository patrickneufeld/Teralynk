// File: /frontend/src/components/dialogs/UploadDialog.jsx

import React, { useState } from "react";
import PropTypes from "prop-types";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, LinearProgress } from "@mui/material";
import { UploadFile as UploadFileIcon } from "@mui/icons-material";

const UploadDialog = ({ open, onClose, onUpload }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      await onUpload(file);
      onClose();
    } catch (error) {
      console.error("[UploadDialog] Upload failed:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        <UploadFileIcon className="mr-2" /> Upload File
      </DialogTitle>
      <DialogContent>
        <input
          type="file"
          onChange={handleFileChange}
          disabled={uploading}
          className="mt-2"
        />
        {uploading && (
          <div className="mt-4">
            <LinearProgress />
            <p className="text-sm mt-2 text-gray-600">Uploading...</p>
          </div>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary" disabled={uploading}>
          Cancel
        </Button>
        <Button onClick={handleUpload} color="primary" disabled={!file || uploading}>
          Upload
        </Button>
      </DialogActions>
    </Dialog>
  );
};

UploadDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onUpload: PropTypes.func.isRequired,
};

export default UploadDialog;
