// ✅ FILE: /frontend/src/components/FileUploadProgress.jsx

import React from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  LinearProgress,
  IconButton,
  Typography,
  Box,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import "../styles/components/FileUploadProgress.css";

const FileUploadProgress = ({ progress, onClose }) => {
  const open = Object.keys(progress).some(
    (fileName) => typeof progress[fileName] === "number"
  );

  if (!open) return null;

  return (
    <Dialog open={open} maxWidth="sm" fullWidth>
      <DialogTitle>📤 Upload Progress</DialogTitle>
      <DialogContent dividers className="upload-progress-container">
        {Object.entries(progress).map(([fileName, percent]) =>
          percent != null ? (
            <Box key={fileName} className="upload-item">
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">{fileName}</Typography>
                <IconButton size="small" onClick={() => onClose(fileName)}>
                  <Close fontSize="small" />
                </IconButton>
              </Box>
              <LinearProgress variant="determinate" value={percent} />
            </Box>
          ) : null
        )}
      </DialogContent>
    </Dialog>
  );
};

FileUploadProgress.propTypes = {
  progress: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default FileUploadProgress;
