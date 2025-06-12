// File: /frontend/src/components/dialogs/RenameDialog.jsx

import React, { useState } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from "@mui/material";
import DriveFileRenameOutlineIcon from "@mui/icons-material/DriveFileRenameOutline";

const RenameDialog = ({ open, onClose, currentName, onRename }) => {
  const [newName, setNewName] = useState(currentName || "");
  const [error, setError] = useState("");

  const handleRename = () => {
    if (!newName.trim()) {
      setError("New name cannot be empty.");
      return;
    }
    onRename(newName.trim());
    onClose();
  };

  const handleClose = () => {
    setNewName(currentName || "");
    setError("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>
        <DriveFileRenameOutlineIcon className="mr-2" />
        Rename File
      </DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          autoFocus
          label="New File Name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          error={!!error}
          helperText={error}
          margin="normal"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="secondary">
          Cancel
        </Button>
        <Button onClick={handleRename} color="primary">
          Rename
        </Button>
      </DialogActions>
    </Dialog>
  );
};

RenameDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  currentName: PropTypes.string,
  onRename: PropTypes.func.isRequired,
};

export default RenameDialog;
