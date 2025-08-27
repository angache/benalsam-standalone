// ===========================
// CREATE BACKUP DIALOG COMPONENT
// ===========================

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import { CreateBackupDialogProps, CreateBackupForm } from '../types';

const CreateBackupDialog: React.FC<CreateBackupDialogProps> = ({
  open,
  onClose,
  onSubmit,
  isLoading,
  error
}) => {
  const [form, setForm] = useState<CreateBackupForm>({
    description: '',
    tags: []
  });

  const [tagInput, setTagInput] = useState('');

  const handleSubmit = () => {
    onSubmit(form);
  };

  const handleClose = () => {
    setForm({ description: '', tags: [] });
    setTagInput('');
    onClose();
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAddTag();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Backup</DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          autoFocus
          margin="dense"
          label="Description"
          type="text"
          fullWidth
          variant="outlined"
          value={form.description}
          onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Enter backup description (optional)"
          sx={{ mb: 2 }}
        />

        <Box sx={{ mb: 2 }}>
          <TextField
            margin="dense"
            label="Add Tags"
            type="text"
            fullWidth
            variant="outlined"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter tag and press Enter"
            helperText="Press Enter to add a tag"
          />
          
          {form.tags.length > 0 && (
            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {form.tags.map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  onDelete={() => handleRemoveTag(tag)}
                  size="small"
                />
              ))}
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={16} /> : undefined}
        >
          {isLoading ? 'Creating...' : 'Create Backup'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateBackupDialog;
