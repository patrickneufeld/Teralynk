// ✅ FILE: /frontend/src/components/dialogs/ShareDialog.jsx

import React, { useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from "@mui/material";

const ShareDialog = ({ open, onClose, onShare, message, title }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleShare = async () => {
    setLoading(true);
    try {
      await onShare(email);
      onClose();
    } catch (err) {
      console.error("Error sharing file:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{title || "Share File"}</DialogTitle>
      <DialogContent>
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            <p>{message || "Enter the email address to share this file with:"}</p>
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
            />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">Cancel</Button>
        <Button onClick={handleShare} color="primary" disabled={loading}>
          Share
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShareDialog;
