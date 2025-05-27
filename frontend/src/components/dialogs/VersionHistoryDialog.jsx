// ✅ FILE: /frontend/src/components/dialogs/VersionHistoryDialog.jsx

import React, { useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";

const VersionHistoryDialog = ({ open, onClose, fileId, onVersionAction }) => {
  const [versionHistory, setVersionHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  // Simulate fetching version history for the file
  const fetchVersionHistory = async () => {
    setLoading(true);
    try {
      // Simulated fetch (replace with actual API call)
      const response = await fetch(`/api/file/${fileId}/versions`);
      const data = await response.json();
      setVersionHistory(data);
    } catch (error) {
      console.error("Error fetching version history:", error);
    } finally {
      setLoading(false);
    }
  };

  // Effect to fetch version history when the dialog is opened
  React.useEffect(() => {
    if (open) {
      fetchVersionHistory();
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Version History</DialogTitle>
      <DialogContent>
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div>
            <ul>
              {versionHistory.map((version) => (
                <li key={version.id}>
                  <span>{version.date}</span>
                  <Button
                    onClick={() => onVersionAction(version)}
                    variant="outlined"
                    size="small"
                    className="ml-2"
                  >
                    View Version
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default VersionHistoryDialog;
