// ===========================
// BACKUP TABLE COMPONENT
// ===========================

import React from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Typography,
  CircularProgress,
  Alert,
  AlertTitle
} from '@mui/material';
import {
  Restore as RestoreIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { BackupTableProps } from '../types';

const BackupTable: React.FC<BackupTableProps> = ({
  backups,
  isLoading,
  error,
  onBackupSelect,
  onBackupDelete,
  onBackupDownload,
  onBackupValidate
}) => {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'failed': return 'error';
      case 'in_progress': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon />;
      case 'failed': return <ErrorIcon />;
      case 'in_progress': return <WarningIcon />;
      default: return <InfoIcon />;
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        <AlertTitle>Error</AlertTitle>
        {error}
      </Alert>
    );
  }

  if (backups.length === 0) {
    return (
      <Box textAlign="center" p={3}>
        <Typography variant="h6" color="text.secondary">
          No backups found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Create your first backup to get started
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Backup List
      </Typography>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Timestamp</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Database Size</TableCell>
              <TableCell>Edge Functions</TableCell>
              <TableCell>Migrations</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {backups.map((backup) => (
              <TableRow key={backup.id} hover>
                <TableCell>
                  <Typography variant="body2" fontFamily="monospace">
                    {backup.id}
                  </Typography>
                </TableCell>
                <TableCell>
                  {formatDate(backup.timestamp)}
                </TableCell>
                <TableCell>
                  {formatFileSize(backup.size)}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={backup.type}
                    size="small"
                    color={backup.type === 'full' ? 'primary' : 'secondary'}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    icon={getStatusIcon(backup.status)}
                    label={backup.status}
                    size="small"
                    color={getStatusColor(backup.status) as any}
                  />
                </TableCell>
                <TableCell>
                  {formatFileSize(backup.databaseSize)}
                </TableCell>
                <TableCell>
                  {backup.edgeFunctionsCount}
                </TableCell>
                <TableCell>
                  {backup.migrationsCount}
                </TableCell>
                <TableCell>
                  <Typography variant="body2" noWrap>
                    {backup.description || '-'}
                  </Typography>
                  {backup.tags && backup.tags.length > 0 && (
                    <Box mt={0.5}>
                      {backup.tags.map((tag, index) => (
                        <Chip
                          key={index}
                          label={tag}
                          size="small"
                          variant="outlined"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ))}
                    </Box>
                  )}
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={0.5}>
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => onBackupSelect(backup)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Download">
                      <IconButton
                        size="small"
                        onClick={() => onBackupDownload(backup.id)}
                      >
                        <DownloadIcon />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Validate">
                      <IconButton
                        size="small"
                        onClick={() => onBackupValidate(backup.id)}
                      >
                        <CheckCircleIcon />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Restore">
                      <IconButton
                        size="small"
                        onClick={() => onBackupSelect(backup)}
                        color="primary"
                      >
                        <RestoreIcon />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => onBackupDelete(backup.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default BackupTable;
