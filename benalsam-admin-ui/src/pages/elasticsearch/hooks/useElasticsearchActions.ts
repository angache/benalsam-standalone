// ===========================
// ELASTICSEARCH ACTIONS HOOK
// ===========================

import { useState } from 'react';
import { apiService } from '../../../services/api';
import { ElasticsearchDocument } from '../types';

const useElasticsearchActions = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Start sync service
  const startSync = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await apiService.post('/api/v1/elasticsearch/sync/start');
      // Success - the parent component will refresh the data
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to start sync service');
    } finally {
      setIsLoading(false);
    }
  };

  // Stop sync service
  const stopSync = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await apiService.post('/api/v1/elasticsearch/sync/stop');
      // Success - the parent component will refresh the data
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to stop sync service');
    } finally {
      setIsLoading(false);
    }
  };

  // Start indexer
  const startIndexer = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await apiService.post('/api/v1/elasticsearch/indexer/start');
      // Success - the parent component will refresh the data
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to start indexer');
    } finally {
      setIsLoading(false);
    }
  };

  // Stop indexer
  const stopIndexer = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await apiService.post('/api/v1/elasticsearch/indexer/stop');
      // Success - the parent component will refresh the data
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to stop indexer');
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh health status
  const refreshHealth = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await apiService.get('/api/v1/elasticsearch/health');
      // Success - the parent component will refresh the data
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to refresh health status');
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh indexes
  const refreshIndexes = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await apiService.get('/api/v1/elasticsearch/indexes');
      // Success - the parent component will refresh the data
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to refresh indexes');
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh documents
  const refreshDocuments = async (indexName: string) => {
    if (!indexName) return;

    setIsLoading(true);
    setError(null);

    try {
      await apiService.get(`/api/v1/elasticsearch/indexes/${indexName}/documents`);
      // Success - the parent component will refresh the data
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to refresh documents');
    } finally {
      setIsLoading(false);
    }
  };

  // Select index
  const selectIndex = (indexName: string) => {
    // This is a local state change, no API call needed
    // The parent component will handle this
  };

  // Select document
  const selectDocument = (document: ElasticsearchDocument) => {
    // This is a local state change, no API call needed
    // The parent component will handle this
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  return {
    // State
    isLoading,
    error,
    
    // Actions
    startSync,
    stopSync,
    startIndexer,
    stopIndexer,
    refreshHealth,
    refreshIndexes,
    refreshDocuments,
    selectIndex,
    selectDocument,
    clearError
  };
};

export default useElasticsearchActions;
