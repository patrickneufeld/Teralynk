// File Path: /frontend/src/components/dialogs/AccessControlDialog.jsx

import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Checkbox,
  FormControlLabel,
  FormGroup,
} from "@mui/material";

/**
 * AccessControlDialog - Manage file or resource access permissions.
 */
const AccessControlDialog = ({ open, onClose, onSave, fileId, currentPermissions = {} }) => {
  const [email, setEmail] = useState("");
  const [permissions, setPermissions] = useState({
    read: false,
    write: false,
    share: false,
  });

  useEffect(() => {
    if (open && currentPermissions) {
      setPermissions((prev) => ({
        ...prev,
        ...currentPermissions,
      }));
    }
  }, [open, currentPermissions]);

  const handleChange = (e) => {
    const { name, checked } = e.target;
    setPermissions((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = () => {
    const data = {
      fileId,
      email,
      permissions,
    };
    onSave?.(data);
    onClose?.();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Access Control</DialogTitle>
      <DialogContent dividers>
        <p className="mb-2 text-gray-600">
          Manage access for file: <strong>{fileId}</strong>
        </p>
        <TextField
          label="User Email"
          type="email"
          fullWidth
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <FormGroup row>
          <FormControlLabel
            control={
              <Checkbox
                checked={permissions.read}
                onChange={handleChange}
                name="read"
              />
            }
            label="Read"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={permissions.write}
                onChange={handleChange}
                name="write"
              />
            }
            label="Write"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={permissions.share}
                onChange={handleChange}
                name="share"
              />
            }
            label="Share"
          />
        </FormGroup>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button onClick={handleSubmit} color="primary" variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

AccessControlDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  fileId: PropTypes.string.isRequired,
  currentPermissions: PropTypes.shape({
    read: PropTypes.bool,
    write: PropTypes.bool,
    share: PropTypes.bool,
  }),
};

export default AccessControlDialog;
