import { Job } from 'bull';
import { JobOperation, ElasticsearchSyncJobData } from '../types/queue';
import logger from '../utils/logger';
import config from '../config';
import { Client } from '@elastic/elasticsearch';

// Elasticsearch client
const elasticsearchClient = new Client({
  node: process.env['ELASTICSEARCH_URL'] || 'http://209.227.228.96:9200'
});

export const processElasticsearchSyncJob = async (job: Job<ElasticsearchSyncJobData>) => {
  const startTime = Date.now();
  const { data } = job;
  
  logger.info(`🔄 Processing Elasticsearch sync job ${job.id}`, {
    jobId: job.id,
    tableName: data.tableName,
    operation: data.operation,
    recordId: data.recordId,
    userId: data.userId,
    timestamp: data.timestamp,
    attempts: job.attemptsMade,
  });

  try {
    // Validate job data
    if (!data.tableName || !data.operation || !data.recordId) {
      throw new Error('Invalid job data: missing required fields');
    }

    // Check if operation is valid
    if (!Object.values(JobOperation).includes(data.operation)) {
      throw new Error(`Invalid operation: ${data.operation}`);
    }

    // Log data size for monitoring
    const dataSize = JSON.stringify(data.changeData).length;
    logger.info(`📊 Job data size: ${dataSize} bytes`, {
      jobId: job.id,
      dataSize,
      hasLargeData: dataSize > 1000000, // > 1MB
    });

    // Process based on operation
    let result;
    
    switch (data.operation) {
      case JobOperation.INSERT:
        result = await processInsertOperation(data);
        break;
      case JobOperation.UPDATE:
        result = await processUpdateOperation(data);
        break;
      case JobOperation.DELETE:
        result = await processDeleteOperation(data);
        break;
      default:
        throw new Error(`Unsupported operation: ${data.operation}`);
    }

    const processingTime = Date.now() - startTime;
    
    logger.info(`✅ Elasticsearch sync job ${job.id} completed successfully`, {
      jobId: job.id,
      operation: data.operation,
      tableName: data.tableName,
      recordId: data.recordId,
      processingTime,
      result,
    });

    return {
      success: true,
      operation: data.operation,
      tableName: data.tableName,
      recordId: data.recordId,
      processingTime,
      result,
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    logger.error(`❌ Elasticsearch sync job ${job.id} failed:`, {
      jobId: job.id,
      operation: data.operation,
      tableName: data.tableName,
      recordId: data.recordId,
      processingTime,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      attempts: job.attemptsMade,
    });

    // Re-throw error to trigger retry mechanism
    throw error;
  }
};

// Process INSERT operation
const processInsertOperation = async (data: ElasticsearchSyncJobData) => {
  logger.info(`📝 Processing INSERT operation for ${data.tableName}:${data.recordId}`);
  
  // Check if this is a listings table operation
  if (data.tableName === 'listings') {
    const changeData = data.changeData;
    const status = changeData?.status || changeData?.new?.status;
    
    // Only index to Elasticsearch if status is 'active'
    if (status !== 'active') {
      logger.info(`⏸️ Skipping Elasticsearch indexing for ${data.tableName}:${data.recordId} - status: ${status}`);
      return {
        action: 'skipped',
        reason: 'status_not_active',
        documentId: data.recordId,
        index: data.tableName,
        status: status,
      };
    }
  }
  
  // Transform data for Elasticsearch
  const document = transformDataForElasticsearch(data);
  
  // Index to Elasticsearch
  await elasticsearchClient.index({
    index: data.tableName,
    id: data.recordId,
    body: document
  });
  
  logger.info(`✅ Document indexed to Elasticsearch: ${data.tableName}:${data.recordId}`);
  
  return {
    action: 'inserted',
    documentId: data.recordId,
    index: data.tableName,
  };
};

// Process UPDATE operation
const processUpdateOperation = async (data: ElasticsearchSyncJobData) => {
  logger.info(`🔄 Processing UPDATE operation for ${data.tableName}:${data.recordId}`);
  
  // Check if this is a listings table operation
  if (data.tableName === 'listings') {
    const changeData = data.changeData;
    const oldStatus = changeData?.old?.status;
    const newStatus = changeData?.new?.status;
    
    logger.info(`🔍 Status check for ${data.tableName}:${data.recordId}`, {
      oldStatus,
      newStatus,
      changeDataKeys: Object.keys(changeData || {}),
    });
    
    // If status changed from 'active' to something else, delete from Elasticsearch
    if (oldStatus === 'active' && newStatus !== 'active') {
      logger.info(`🗑️ Removing from Elasticsearch for ${data.tableName}:${data.recordId} - status changed from active to ${newStatus}`);
      
      await elasticsearchClient.delete({
        index: data.tableName,
        id: data.recordId
      });
      
      return {
        action: 'deleted',
        reason: 'status_changed_from_active',
        documentId: data.recordId,
        index: data.tableName,
        oldStatus: oldStatus,
        newStatus: newStatus,
      };
    }
    
    // If status changed to 'active', index to Elasticsearch
    if (oldStatus !== 'active' && newStatus === 'active') {
      logger.info(`📝 Indexing to Elasticsearch for ${data.tableName}:${data.recordId} - status changed to active`);
      
      const document = transformDataForElasticsearch(data);
      
      await elasticsearchClient.index({
        index: data.tableName,
        id: data.recordId,
        body: document
      });
      
      return {
        action: 'inserted',
        reason: 'status_changed_to_active',
        documentId: data.recordId,
        index: data.tableName,
        oldStatus: oldStatus,
        newStatus: newStatus,
      };
    }
    
    // If status is not 'active', skip Elasticsearch operation
    if (newStatus !== 'active') {
      logger.info(`⏸️ Skipping Elasticsearch update for ${data.tableName}:${data.recordId} - status: ${newStatus}`);
      return {
        action: 'skipped',
        reason: 'status_not_active',
        documentId: data.recordId,
        index: data.tableName,
        status: newStatus,
      };
    }
  }
  
  // Update document in Elasticsearch
  const document = transformDataForElasticsearch(data);
  
  await elasticsearchClient.update({
    index: data.tableName,
    id: data.recordId,
    doc: document
  });
  
  logger.info(`✅ Document updated in Elasticsearch: ${data.tableName}:${data.recordId}`);
  
  return {
    action: 'updated',
    documentId: data.recordId,
    index: data.tableName,
  };
};

// Process DELETE operation
const processDeleteOperation = async (data: ElasticsearchSyncJobData) => {
  logger.info(`🗑️ Processing DELETE operation for ${data.tableName}:${data.recordId}`);
  
  // Delete from Elasticsearch
  await elasticsearchClient.delete({
    index: data.tableName,
    id: data.recordId
  });
  
  logger.info(`✅ Document deleted from Elasticsearch: ${data.tableName}:${data.recordId}`);
  
  return {
    action: 'deleted',
    documentId: data.recordId,
    index: data.tableName,
  };
};

// Transform data for Elasticsearch
const transformDataForElasticsearch = (data: ElasticsearchSyncJobData) => {
  const changeData = data.changeData;
  
  // For listings table
  if (data.tableName === 'listings') {
    const listingData = changeData?.new || changeData;
    
    return {
      id: data.recordId,
      title: listingData?.title || '',
      description: listingData?.description || '',
      budget: listingData?.budget || 0,
      status: listingData?.status || 'pending_approval',
      category: listingData?.category || '',
      category_id: listingData?.category_id || 0,
      location: listingData?.location || {},
      condition: listingData?.condition || '',
      urgency: listingData?.urgency || '',
      main_image_url: listingData?.main_image_url || '',
      additional_image_urls: listingData?.additional_image_urls || [],
      attributes: listingData?.attributes || {},
      user_id: listingData?.user_id || '',
      created_at: listingData?.created_at || new Date().toISOString(),
      updated_at: listingData?.updated_at || new Date().toISOString(),
      search_keywords: `${listingData?.title || ''} ${listingData?.description || ''}`.toLowerCase()
    };
  }
  
  // For other tables, return the data as is
  return changeData?.new || changeData;
};

// Health check for processor
export const checkElasticsearchSyncProcessorHealth = async () => {
  try {
    // TODO: Implement actual health check
    // const elasticsearchService = new AdminElasticsearchService();
    // return await elasticsearchService.healthCheck();
    
    // Temporary mock implementation
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      elasticsearchUrl: config.services.elasticsearchUrl,
    };
  } catch (error) {
    logger.error('❌ Elasticsearch sync processor health check failed:', error);
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

export default processElasticsearchSyncJob;
