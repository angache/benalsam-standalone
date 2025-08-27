// ===========================
// INDEX LIST COMPONENT
// ===========================

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  AlertTitle,
  IconButton,
  Collapse,
  Grid
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Storage as StorageIcon
} from '@mui/icons-material';
import { IndexListProps } from '../types';
import { formatNumber, formatFileSize } from '../utils/formatters';

const IndexList: React.FC<IndexListProps> = ({
  indexes,
  selectedIndex,
  expandedIndex,
  isLoading,
  error,
  onIndexSelect,
  onIndexExpand,
  onRefreshIndexes
}) => {
  const getHealthColor = (health: string) => {
    switch (health.toLowerCase()) {
      case 'green': return 'success';
      case 'yellow': return 'warning';
      case 'red': return 'error';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return 'success';
      case 'close': return 'error';
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

  return (
    <Box sx={{ mb: 3 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h5">
          Elasticsearch Indexes
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={onRefreshIndexes}
          disabled={isLoading}
        >
          Refresh
        </Button>
      </Box>
      
      <Card>
        <CardContent>
          {indexes.length === 0 ? (
            <Box textAlign="center" py={4}>
              <StorageIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Indexes Found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                No Elasticsearch indexes are currently available.
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Index Name</TableCell>
                    <TableCell>Health</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Documents</TableCell>
                    <TableCell align="right">Size</TableCell>
                    <TableCell align="right">Shards</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {indexes.map((index) => (
                    <React.Fragment key={index.name}>
                      <TableRow
                        hover
                        selected={selectedIndex === index.name}
                        onClick={() => onIndexSelect(index.name)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <StorageIcon sx={{ mr: 1, fontSize: 20 }} />
                            <Typography variant="body2" fontWeight="medium">
                              {index.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={index.health}
                            color={getHealthColor(index.health)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={index.status}
                            color={getStatusColor(index.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          {formatNumber(index.docs_count)}
                        </TableCell>
                        <TableCell align="right">
                          {formatFileSize(parseInt(index.store_size))}
                        </TableCell>
                        <TableCell align="right">
                          {index.primary_shards} + {index.replica_shards}
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              onIndexExpand(index.name);
                            }}
                          >
                            {expandedIndex === index.name ? (
                              <ExpandLessIcon />
                            ) : (
                              <ExpandMoreIcon />
                            )}
                          </IconButton>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                          <Collapse in={expandedIndex === index.name} timeout="auto" unmountOnExit>
                            <Box sx={{ margin: 1 }}>
                              <Typography variant="h6" gutterBottom component="div">
                                Index Details: {index.name}
                              </Typography>
                              <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                  <Typography variant="body2">
                                    <strong>Health:</strong> {index.health}
                                  </Typography>
                                  <Typography variant="body2">
                                    <strong>Status:</strong> {index.status}
                                  </Typography>
                                  <Typography variant="body2">
                                    <strong>Documents:</strong> {formatNumber(index.docs_count)}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                  <Typography variant="body2">
                                    <strong>Size:</strong> {formatFileSize(parseInt(index.store_size))}
                                  </Typography>
                                  <Typography variant="body2">
                                    <strong>Primary Shards:</strong> {index.primary_shards}
                                  </Typography>
                                  <Typography variant="body2">
                                    <strong>Replica Shards:</strong> {index.replica_shards}
                                  </Typography>
                                </Grid>
                              </Grid>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <Box mt={2}>
            <Typography variant="body2" color="text.secondary">
              Total Indexes: {indexes.length} | 
              Total Documents: {formatNumber(indexes.reduce((sum, index) => sum + index.docs_count, 0))} |
              Total Size: {formatFileSize(indexes.reduce((sum, index) => sum + parseInt(index.store_size), 0))}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default IndexList;
