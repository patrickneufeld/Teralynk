// ✅ FILE: /frontend/src/components/CollaborationDialog.jsx

import React, { useState } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from "@mui/material";
import { Delete } from "@mui/icons-material";
import "../styles/components/CollaborationDialog.css";

const CollaborationDialog = ({ open, fileId, onClose, onAction }) => {
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState("read");
  const [collaborators, setCollaborators] = useState([]);

  const handleInvite = () => {
    if (!email.trim()) return;

    onAction(fileId, "invite", {
      email: email.trim(),
      permissions: permission,
    });

    setCollaborators((prev) => [
      ...prev,
      { email: email.trim(), permissions: permission },
    ]);

    setEmail("");
    setPermission("read");
  };

  const handleRemove = (emailToRemove) => {
    onAction(fileId, "remove", { userId: emailToRemove });
    setCollaborators((prev) =>
      prev.filter((c) => c.email !== emailToRemove)
    );
  };

  const handlePermissionChange = (index, newPermission) => {
    const updated = [...collaborators];
    updated[index].permissions = newPermission;
    setCollaborators(updated);

    onAction(fileId, "updatePermissions", {
      userId: collaborators[index].email,
      permissions: newPermission,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>🤝 Collaborators</DialogTitle>

      <DialogContent dividers>
        <div className="collab-invite">
          <TextField
            label="Email"
            type="email"
            value={email}
            fullWidth
            onChange={(e) => setEmail(e.target.value)}
            margin="dense"
          />

          <FormControl fullWidth margin="dense">
            <InputLabel>Permissions</InputLabel>
            <Select
              value={permission}
              onChange={(e) => setPermission(e.target.value)}
              label="Permissions"
            >
              <MenuItem value="read">Read</MenuItem>
              <MenuItem value="write">Write</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>

          <Button
            onClick={handleInvite}
            variant="contained"
            fullWidth
            sx={{ mt: 2 }}
          >
            Invite
          </Button>
        </div>

        {collaborators.length > 0 && (
          <List>
            {collaborators.map((collab, index) => (
              <ListItem
                key={collab.email}
                secondaryAction={
                  <IconButton
                    edge="end"
                    onClick={() => handleRemove(collab.email)}
                    aria-label="remove"
                  >
                    <Delete />
                  </IconButton>
                }
              >
                <ListItemText
                  primary={collab.email}
                  secondary={
                    <FormControl fullWidth>
                      <Select
                        value={collab.permissions}
                        onChange={(e) =>
                          handlePermissionChange(index, e.target.value)
                        }
                        size="small"
                      >
                        <MenuItem value="read">Read</MenuItem>
                        <MenuItem value="write">Write</MenuItem>
                        <MenuItem value="admin">Admin</MenuItem>
                      </Select>
                    </FormControl>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

CollaborationDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  fileId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onAction: PropTypes.func.isRequired,
};

export default CollaborationDialog;
