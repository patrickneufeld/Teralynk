// ✅ FILE: /frontend/src/components/dialogs/CollaborationDialog.jsx

import React, { useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from "@mui/material";

const CollaborationDialog = ({ open, onClose, fileId, onAction }) => {
  const [collaborationData, setCollaborationData] = useState("");
  const [loading, setLoading] = useState(false);

  // Simulate starting a collaboration session (replace with actual API call)
  const startCollaboration = async () => {
    setLoading(true);
    try {
      // Simulated collaboration initiation (replace with actual API call)
      const response = await fetch(`/api/file/${fileId}/collaborate`, {
        method: "POST",
        body: JSON.stringify({ collaborationData }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      onAction(data); // Trigger the action after collaboration is started
    } catch (error) {
      console.error("Error starting collaboration:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Collaborate on File</DialogTitle>
      <DialogContent>
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div>
            <TextField
              label="Collaboration Notes"
              multiline
              rows={4}
              value={collaborationData}
              onChange={(e) => setCollaborationData(e.target.value)}
              fullWidth
            />
          </div>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">Cancel</Button>
        <Button
          onClick={startCollaboration}
          color="primary"
          disabled={loading || !collaborationData}
        >
          Start Collaboration
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CollaborationDialog;
