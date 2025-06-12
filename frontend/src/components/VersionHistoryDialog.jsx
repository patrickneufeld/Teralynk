// ✅ FILE: /frontend/src/components/VersionHistoryDialog.jsx

import React from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip,
  Typography,
  Box,
} from "@mui/material";
import { Restore, Delete, Info } from "@mui/icons-material";
import { format } from "date-fns";
import "../styles/components/VersionHistoryDialog.css";

const VersionHistoryDialog = ({
  open,
  fileId,
  versions,
  onClose,
  onVersionAction,
}) => {
  const handleRestore = (versionId) => {
    onVersionAction(fileId, "restore", versionId);
  };

  const handleDelete = (versionId) => {
    onVersionAction(fileId, "delete", versionId);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>🕓 Version History</DialogTitle>

      <DialogContent dividers>
        {versions.length === 0 ? (
          <Typography variant="body2" color="textSecondary">
            No previous versions found.
          </Typography>
        ) : (
          <List dense className="version-history-list">
            {versions.map((version) => (
              <ListItem
                key={version.id}
                secondaryAction={
                  <Box>
                    <Tooltip title="Restore this version">
                      <IconButton onClick={() => handleRestore(version.id)}>
                        <Restore />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete this version">
                      <IconButton onClick={() => handleDelete(version.id)}>
                        <Delete color="error" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                }
              >
                <ListItemText
                  primary={version.name || `Version ${version.versionNumber}`}
                  secondary={
                    <>
                      <Typography component="span" variant="caption">
                        {format(new Date(version.timestamp), "PPpp")}
                      </Typography>
                      {version.description && (
                        <Typography
                          component="span"
                          variant="caption"
                          display="block"
                        >
                          <Info fontSize="small" /> {version.description}
                        </Typography>
                      )}
                    </>
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

VersionHistoryDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  fileId: PropTypes.string.isRequired,
  versions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      versionNumber: PropTypes.number,
      timestamp: PropTypes.string.isRequired,
      description: PropTypes.string,
      name: PropTypes.string,
    })
  ),
  onClose: PropTypes.func.isRequired,
  onVersionAction: PropTypes.func.isRequired,
};

export default VersionHistoryDialog;
