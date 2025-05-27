// ✅ FILE: /frontend/src/components/forms/WorkflowForm.jsx

import React, { useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Typography } from "@mui/material";

const WorkflowForm = ({ open, onClose, onSubmit }) => {
  const [workflowName, setWorkflowName] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    if (workflowName && description) {
      onSubmit({ workflowName, description });
      onClose();
    } else {
      alert("Please fill in all fields.");
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Create New Workflow</DialogTitle>
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          Enter the details for your new workflow.
        </Typography>
        <TextField
          label="Workflow Name"
          fullWidth
          value={workflowName}
          onChange={(e) => setWorkflowName(e.target.value)}
          margin="normal"
        />
        <TextField
          label="Description"
          fullWidth
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          margin="normal"
          multiline
          rows={4}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">Cancel</Button>
        <Button onClick={handleSubmit} color="primary">Create</Button>
      </DialogActions>
    </Dialog>
  );
};

export default WorkflowForm;
