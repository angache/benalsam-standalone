// ===========================
// DOCUMENT LIST COMPONENT
// ===========================

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  AlertTitle,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Bolt as BoltIcon,
  Timeline as TimelineIcon,
  Error as ErrorIcon,
  TableChart as TableChartIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { DocumentListProps } from '../types';
import { formatDocument, getEventIcon, getEventColor } from '../utils/formatters';

const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  selectedIndex,
  isLoading,
  error,
  onDocumentSelect,
  onRefreshDocuments
}) => {
  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'view': return <VisibilityIcon fontSize="small" />;
      case 'click': return <BoltIcon fontSize="small" />;
      case 'performance': return <TimelineIcon fontSize="small" />;
      case 'error': return <ErrorIcon fontSize="small" />;
      case 'listing': return <TableChartIcon fontSize="small" />;
      default: return <InfoIcon fontSize="small" />;
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'view': return 'primary';
      case 'click': return 'secondary';
      case 'performance': return 'info';
      case 'error': return 'error';
      case 'listing': return 'success';
      default: return 'default';
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

  if (!selectedIndex) {
    return (
      <Box textAlign="center" py={4}>
        <InfoIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No Index Selected
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Please select an index from the list above to view its documents.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h5">
          Documents: {selectedIndex}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={onRefreshDocuments}
          disabled={isLoading}
        >
          Refresh
        </Button>
      </Box>
      
      <Card>
        <CardContent>
          {documents.length === 0 ? (
            <Box textAlign="center" py={4}>
              <InfoIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Documents Found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                No documents found in the selected index.
              </Typography>
            </Box>
          ) : (
            <Paper variant="outlined">
              <List>
                {documents.map((document, index) => {
                  const formattedDoc = formatDocument({
                    indexName: selectedIndex,
                    source: document._source
                  });

                  return (
                    <ListItem
                      key={document._id}
                      divider={index < documents.length - 1}
                      sx={{ cursor: 'pointer' }}
                      onClick={() => onDocumentSelect(document)}
                    >
                      <ListItemIcon>
                        {getEventIcon(formattedDoc.eventType)}
                      </ListItemIcon>
                      
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="subtitle2">
                              {formattedDoc.timestamp}
                            </Typography>
                            <Chip
                              label={formattedDoc.eventType}
                              color={getEventColor(formattedDoc.eventType)}
                              size="small"
                            />
                            {formattedDoc.user && (
                              <Typography variant="body2" color="text.secondary">
                                by {formattedDoc.user}
                              </Typography>
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Device: {formattedDoc.device}
                            </Typography>
                            {formattedDoc.session && (
                              <Typography variant="body2" color="text.secondary">
                                Session: {formattedDoc.session}
                              </Typography>
                            )}
                            {formattedDoc.details && Object.keys(formattedDoc.details).length > 0 && (
                              <Box mt={1}>
                                <Typography variant="caption" color="text.secondary">
                                  Details: {JSON.stringify(formattedDoc.details, null, 2)}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        }
                      />
                      
                      <Tooltip title="View Details">
                        <IconButton size="small">
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                    </ListItem>
                  );
                })}
              </List>
            </Paper>
          )}

          <Box mt={2}>
            <Typography variant="body2" color="text.secondary">
              Total Documents: {documents.length} | 
              Index: {selectedIndex}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default DocumentList;
