// ✅ FILE: /frontend/src/components/MetadataDialog.jsx

import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Chip,
  Stack,
} from "@mui/material";
import "../styles/components/MetadataDialog.css";

const MetadataDialog = ({ open, fileId, metadata, onClose, onSave }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    setTitle(metadata?.title || "");
    setDescription(metadata?.description || "");
    setTags(metadata?.tags || []);
  }, [metadata]);

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  };

  const handleDeleteTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = () => {
    onSave(fileId, { title, description, tags });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>📝 Edit Metadata</DialogTitle>
      <DialogContent dividers className="metadata-dialog-content">
        <TextField
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          fullWidth
          margin="normal"
        />

        <TextField
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          margin="normal"
          multiline
          rows={3}
        />

        <TextField
          label="Add Tag"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
          fullWidth
          margin="normal"
        />

        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
          {tags.map((tag, i) => (
            <Chip
              key={i}
              label={tag}
              onDelete={() => handleDeleteTag(tag)}
              color="primary"
            />
          ))}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

MetadataDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  fileId: PropTypes.string.isRequired,
  metadata: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
  }),
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
};

export default MetadataDialog;
