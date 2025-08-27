// ===========================
// MAIN ELASTICSEARCH DASHBOARD PAGE
// ===========================

import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  AlertTitle
} from '@mui/material';
import { useTheme, useMediaQuery } from '@mui/material/styles';

// Components
import HealthStatus from './components/HealthStatus';
import SyncStatus from './components/SyncStatus';
import QueueStats from './components/QueueStats';
import IndexerStats from './components/IndexerStats';
import IndexList from './components/IndexList';
import DocumentList from './components/DocumentList';

// Hooks
import useElasticsearchData from './hooks/useElasticsearchData';
import useElasticsearchActions from './hooks/useElasticsearchActions';

// Types
import { ElasticsearchDocument } from './types';

const ElasticsearchDashboardPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Local state
  const [selectedIndex, setSelectedIndex] = useState<string>('');
  const [expandedIndex, setExpandedIndex] = useState<string | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);

  // Data and actions
  const {
    healthStatus,
    syncStatus,
    queueStats,
    indexerStats,
    elasticsearchIndexes,
    indexDocuments,
    loadingStates,
    errorStates,
    fetchHealthStatus,
    fetchSyncStatus,
    fetchQueueStats,
    fetchIndexerStats,
    fetchIndexes,
    fetchDocuments,
    fetchAllData
  } = useElasticsearchData();

  const {
    startSync,
    stopSync,
    startIndexer,
    stopIndexer,
    refreshHealth,
    refreshIndexes,
    refreshDocuments,
    clearError
  } = useElasticsearchActions();

  // Handlers
  const handleIndexSelect = (indexName: string) => {
    setSelectedIndex(indexName);
    fetchDocuments(indexName);
  };

  const handleIndexExpand = (indexName: string) => {
    setExpandedIndex(expandedIndex === indexName ? null : indexName);
  };

  const handleDocumentSelect = (document: ElasticsearchDocument) => {
    setSelectedDocument(document);
    setDetailsModalOpen(true);
  };

  const handleStartSync = async () => {
    await startSync();
    fetchSyncStatus();
  };

  const handleStopSync = async () => {
    await stopSync();
    fetchSyncStatus();
  };

  const handleStartIndexer = async () => {
    await startIndexer();
    fetchIndexerStats();
  };

  const handleStopIndexer = async () => {
    await stopIndexer();
    fetchIndexerStats();
  };

  const handleRefreshIndexes = async () => {
    await refreshIndexes();
    fetchIndexes();
  };

  const handleRefreshDocuments = async () => {
    if (selectedIndex) {
      await refreshDocuments(selectedIndex);
      fetchDocuments(selectedIndex);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom>
        Elasticsearch Dashboard
      </Typography>

      {/* Error Alert */}
      {errorStates.health && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
          <AlertTitle>System Error</AlertTitle>
          {errorStates.health}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Health Status */}
        <Grid item xs={12}>
          <HealthStatus
            healthStatus={healthStatus}
            isLoading={loadingStates.health}
            error={errorStates.health}
          />
        </Grid>

        {/* Sync Status */}
        <Grid item xs={12} md={6}>
          <SyncStatus
            syncStatus={syncStatus}
            isLoading={loadingStates.sync}
            error={errorStates.sync}
            onStartSync={handleStartSync}
            onStopSync={handleStopSync}
          />
        </Grid>

        {/* Queue Stats */}
        <Grid item xs={12} md={6}>
          <QueueStats
            queueStats={queueStats}
            isLoading={loadingStates.queue}
            error={errorStates.queue}
          />
        </Grid>

        {/* Indexer Stats */}
        <Grid item xs={12}>
          <IndexerStats
            indexerStats={indexerStats}
            isLoading={loadingStates.indexer}
            error={errorStates.indexer}
            onStartIndexer={handleStartIndexer}
            onStopIndexer={handleStopIndexer}
          />
        </Grid>

        {/* Index List */}
        <Grid item xs={12}>
          <IndexList
            indexes={elasticsearchIndexes}
            selectedIndex={selectedIndex}
            expandedIndex={expandedIndex}
            isLoading={loadingStates.indexes}
            error={errorStates.indexes}
            onIndexSelect={handleIndexSelect}
            onIndexExpand={handleIndexExpand}
            onRefreshIndexes={handleRefreshIndexes}
          />
        </Grid>

        {/* Document List */}
        <Grid item xs={12}>
          <DocumentList
            documents={indexDocuments}
            selectedIndex={selectedIndex}
            isLoading={loadingStates.documents}
            error={errorStates.documents}
            onDocumentSelect={handleDocumentSelect}
            onRefreshDocuments={handleRefreshDocuments}
          />
        </Grid>
      </Grid>

      {/* Document Details Modal */}
      <Dialog
        open={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Document Details
        </DialogTitle>
        <DialogContent>
          {selectedDocument && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Document ID: {selectedDocument._id}
              </Typography>
              <Typography variant="body2" component="pre" sx={{ 
                backgroundColor: 'grey.100', 
                p: 2, 
                borderRadius: 1,
                overflow: 'auto',
                maxHeight: 400
              }}>
                {JSON.stringify(selectedDocument._source, null, 2)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsModalOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ElasticsearchDashboardPage;
