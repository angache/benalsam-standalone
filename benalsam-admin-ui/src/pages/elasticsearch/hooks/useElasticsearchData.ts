// ===========================
// ELASTICSEARCH DATA HOOK
// ===========================

import { useState, useEffect } from 'react';
import { apiService } from '../../../services/api';
import {
  HealthStatus,
  SyncStatus,
  QueueStats,
  IndexerStats,
  ElasticsearchIndex,
  ElasticsearchDocument,
  ElasticsearchData,
  ElasticsearchLoadingStates,
  ElasticsearchErrorStates
} from '../types';

const useElasticsearchData = () => {
  // Data states
  const [healthStatus, setHealthStatus] = useState<HealthStatus>({
    elasticsearch: false,
    redis: false,
    indexer: false,
    syncService: false
  });

  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isRunning: false,
    lastSyncAt: null,
    nextSyncAt: null,
    totalSynced: 0,
    errors: [],
    progress: 0
  });

  const [queueStats, setQueueStats] = useState<QueueStats>({
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    total: 0
  });

  const [indexerStats, setIndexerStats] = useState<IndexerStats>({
    totalProcessed: 0,
    totalSuccess: 0,
    totalFailed: 0,
    avgProcessingTime: 0,
    lastProcessedAt: null,
    isRunning: false
  });

  const [elasticsearchIndexes, setElasticsearchIndexes] = useState<ElasticsearchIndex[]>([]);
  const [indexDocuments, setIndexDocuments] = useState<ElasticsearchDocument[]>([]);

  // Loading states
  const [loadingStates, setLoadingStates] = useState<ElasticsearchLoadingStates>({
    health: false,
    sync: false,
    queue: false,
    indexer: false,
    indexes: false,
    documents: false
  });

  // Error states
  const [errorStates, setErrorStates] = useState<ElasticsearchErrorStates>({
    health: null,
    sync: null,
    queue: null,
    indexer: null,
    indexes: null,
    documents: null
  });

  // Fetch health status
  const fetchHealthStatus = async () => {
    setLoadingStates(prev => ({ ...prev, health: true }));
    setErrorStates(prev => ({ ...prev, health: null }));

    try {
      const response = await apiService.get('/api/v1/elasticsearch/health');
      setHealthStatus(response.data);
    } catch (error: any) {
      setErrorStates(prev => ({ 
        ...prev, 
        health: error.response?.data?.message || 'Failed to fetch health status' 
      }));
    } finally {
      setLoadingStates(prev => ({ ...prev, health: false }));
    }
  };

  // Fetch sync status
  const fetchSyncStatus = async () => {
    setLoadingStates(prev => ({ ...prev, sync: true }));
    setErrorStates(prev => ({ ...prev, sync: null }));

    try {
      const response = await apiService.get('/api/v1/elasticsearch/sync-status');
      setSyncStatus(response.data);
    } catch (error: any) {
      setErrorStates(prev => ({ 
        ...prev, 
        sync: error.response?.data?.message || 'Failed to fetch sync status' 
      }));
    } finally {
      setLoadingStates(prev => ({ ...prev, sync: false }));
    }
  };

  // Fetch queue stats
  const fetchQueueStats = async () => {
    setLoadingStates(prev => ({ ...prev, queue: true }));
    setErrorStates(prev => ({ ...prev, queue: null }));

    try {
      const response = await apiService.get('/api/v1/elasticsearch/queue-stats');
      setQueueStats(response.data);
    } catch (error: any) {
      setErrorStates(prev => ({ 
        ...prev, 
        queue: error.response?.data?.message || 'Failed to fetch queue stats' 
      }));
    } finally {
      setLoadingStates(prev => ({ ...prev, queue: false }));
    }
  };

  // Fetch indexer stats
  const fetchIndexerStats = async () => {
    setLoadingStates(prev => ({ ...prev, indexer: true }));
    setErrorStates(prev => ({ ...prev, indexer: null }));

    try {
      const response = await apiService.get('/api/v1/elasticsearch/indexer-stats');
      setIndexerStats(response.data);
    } catch (error: any) {
      setErrorStates(prev => ({ 
        ...prev, 
        indexer: error.response?.data?.message || 'Failed to fetch indexer stats' 
      }));
    } finally {
      setLoadingStates(prev => ({ ...prev, indexer: false }));
    }
  };

  // Fetch elasticsearch indexes
  const fetchIndexes = async () => {
    setLoadingStates(prev => ({ ...prev, indexes: true }));
    setErrorStates(prev => ({ ...prev, indexes: null }));

    try {
      const response = await apiService.get('/api/v1/elasticsearch/indexes');
      setElasticsearchIndexes(response.data);
    } catch (error: any) {
      setErrorStates(prev => ({ 
        ...prev, 
        indexes: error.response?.data?.message || 'Failed to fetch indexes' 
      }));
    } finally {
      setLoadingStates(prev => ({ ...prev, indexes: false }));
    }
  };

  // Fetch index documents
  const fetchDocuments = async (indexName: string) => {
    if (!indexName) return;

    setLoadingStates(prev => ({ ...prev, documents: true }));
    setErrorStates(prev => ({ ...prev, documents: null }));

    try {
      const response = await apiService.get(`/api/v1/elasticsearch/indexes/${indexName}/documents`);
      setIndexDocuments(response.data);
    } catch (error: any) {
      setErrorStates(prev => ({ 
        ...prev, 
        documents: error.response?.data?.message || 'Failed to fetch documents' 
      }));
    } finally {
      setLoadingStates(prev => ({ ...prev, documents: false }));
    }
  };

  // Fetch all data
  const fetchAllData = async () => {
    await Promise.all([
      fetchHealthStatus(),
      fetchSyncStatus(),
      fetchQueueStats(),
      fetchIndexerStats(),
      fetchIndexes()
    ]);
  };

  // Initial data fetch
  useEffect(() => {
    fetchAllData();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAllData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return {
    // Data
    healthStatus,
    syncStatus,
    queueStats,
    indexerStats,
    elasticsearchIndexes,
    indexDocuments,
    
    // Loading states
    loadingStates,
    
    // Error states
    errorStates,
    
    // Actions
    fetchHealthStatus,
    fetchSyncStatus,
    fetchQueueStats,
    fetchIndexerStats,
    fetchIndexes,
    fetchDocuments,
    fetchAllData
  };
};

export default useElasticsearchData;
