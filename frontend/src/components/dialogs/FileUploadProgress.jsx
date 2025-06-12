// ✅ FILE: /frontend/src/components/dialogs/FileUploadProgress.jsx

import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, LinearProgress, Typography } from "@mui/material";

const FileUploadProgress = ({ open, onClose, progress }) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>File Upload Progress</DialogTitle>
      <DialogContent>
        <div className="flex flex-col items-center">
          <Typography variant="h6" gutterBottom>
            {progress.status || "Uploading..."}
          </Typography>
          <LinearProgress variant="determinate" value={progress.percentage || 0} sx={{ width: '100%' }} />
          <Typography variant="body2" color="textSecondary" sx={{ marginTop: '10px' }}>
            {progress.percentage ? `${progress.percentage}%` : "0%"}
          </Typography>
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default FileUploadProgress;
