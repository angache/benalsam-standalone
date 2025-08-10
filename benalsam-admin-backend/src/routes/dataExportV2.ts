import express from 'express';
import dataExportServiceV2 from '../services/dataExportServiceV2';
import { authenticateToken } from '../middleware/auth';
import logger from '../config/logger';

const router: express.Router = express.Router();

// Test route
router.get('/test', (req, res) => {
  logger.info('🧪 DataExportV2 Route: Test endpoint çağrıldı');
  res.json({
    success: true,
    message: 'DataExportV2 test endpoint working!'
  });
});

// Initialize indexes
router.post('/initialize', authenticateToken, async (req, res) => {
  logger.info('🏗️ DataExportV2 Route: Initialize endpoint çağrıldı');
  
  try {
    await dataExportServiceV2.initializeIndexes();
    logger.info('✅ DataExportV2 Route: Indexes başlatıldı');
    
    res.json({
      success: true,
      message: 'Data export system initialized successfully'
    });
  } catch (error: any) {
    logger.error(`❌ DataExportV2 Route: Initialize hatası: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize data export system',
      error: error.message
    });
  }
});

// Create export request
router.post('/requests', authenticateToken, async (req, res) => {
  logger.info('📝 DataExportV2 Route: Create request endpoint çağrıldı');
  
  try {
    const { export_type, data_type, filters, schedule } = req.body;
    const user_id = (req as any).admin?.id || (req as any).user?.adminId || (req as any).user?.id;
    
    logger.info(`📝 DataExportV2 Route: user_id=${user_id}, export_type=${export_type}, data_type=${data_type}`);

    const exportRequest = await dataExportServiceV2.createExportRequest({
      user_id,
      export_type,
      data_type,
      filters,
      schedule
    });

    logger.info(`✅ DataExportV2 Route: Export isteği oluşturuldu: ${exportRequest.id}`);

    res.json({
      success: true,
      data: exportRequest
    });
  } catch (error: any) {
    logger.error(`❌ DataExportV2 Route: Create request hatası: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to create export request',
      error: error.message
    });
  }
});

// Get export requests
router.get('/requests', authenticateToken, async (req, res) => {
  logger.info('📋 DataExportV2 Route: Get requests endpoint çağrıldı');
  
  try {
    const { user_id, status } = req.query;
    logger.info(`📋 DataExportV2 Route: user_id=${user_id}, status=${status}`);
    
    const requests = await dataExportServiceV2.getExportRequests(
      user_id as string,
      status as string
    );

    logger.info(`✅ DataExportV2 Route: ${requests.length} export isteği döndürüldü`);

    res.json({
      success: true,
      data: requests
    });
  } catch (error: any) {
    logger.error(`❌ DataExportV2 Route: Get requests hatası: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to get export requests',
      error: error.message
    });
  }
});

// Process export
router.post('/process/:exportId', authenticateToken, async (req, res) => {
  logger.info(`🔄 DataExportV2 Route: Process export endpoint çağrıldı - ID: ${req.params.exportId}`);
  
  try {
    const { exportId } = req.params;
    
    // Get export request
    const requests = await dataExportServiceV2.getExportRequests();
    const exportRequest = requests.find(req => req.id === exportId);
    
    if (!exportRequest) {
      return res.status(404).json({
        success: false,
        message: 'Export request not found'
      });
    }

    const result = await dataExportServiceV2.processExport(exportRequest);
    logger.info(`✅ DataExportV2 Route: Export işlendi: ${exportId}`);

    return res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error(`❌ DataExportV2 Route: Process export hatası: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to process export',
      error: error.message
    });
  }
});

// Download export
router.get('/download/:exportId', authenticateToken, async (req, res) => {
  logger.info(`📥 DataExportV2 Route: Download export endpoint çağrıldı - ID: ${req.params.exportId}`);
  
  try {
    const { exportId } = req.params;
    
    // Get export request
    const requests = await dataExportServiceV2.getExportRequests();
    const exportRequest = requests.find(req => req.id === exportId);
    
    if (!exportRequest) {
      return res.status(404).json({
        success: false,
        message: 'Export request not found'
      });
    }

    if (exportRequest.status !== 'completed' || !exportRequest.file_path) {
      return res.status(400).json({
        success: false,
        message: 'Export not completed or file not available'
      });
    }

    // Mock file download for now
    const fs = require('fs');
    if (!fs.existsSync(exportRequest.file_path)) {
      return res.status(404).json({
        success: false,
        message: 'Export file not found'
      });
    }

    const fileName = `analytics_export_${exportRequest.data_type}.${exportRequest.export_type}`;
    return res.download(exportRequest.file_path, fileName);
    
  } catch (error: any) {
    logger.error(`❌ DataExportV2 Route: Download export hatası: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to download export',
      error: error.message
    });
  }
});

// Delete export
router.delete('/requests/:exportId', authenticateToken, async (req, res) => {
  logger.info(`🗑️ DataExportV2 Route: Delete export endpoint çağrıldı - ID: ${req.params.exportId}`);
  
  try {
    const { exportId } = req.params;
    await dataExportServiceV2.deleteExport(exportId);
    
    logger.info(`✅ DataExportV2 Route: Export silindi: ${exportId}`);

    res.json({
      success: true,
      message: 'Export deleted successfully'
    });
  } catch (error: any) {
    logger.error(`❌ DataExportV2 Route: Delete export hatası: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to delete export',
      error: error.message
    });
  }
});

// Get export statistics
router.get('/statistics', authenticateToken, async (req, res) => {
  logger.info('📊 DataExportV2 Route: Get statistics endpoint çağrıldı');
  
  try {
    const statistics = await dataExportServiceV2.getExportStatistics();
    
    logger.info('✅ DataExportV2 Route: İstatistikler döndürüldü');

    res.json({
      success: true,
      data: statistics
    });
  } catch (error: any) {
    logger.error(`❌ DataExportV2 Route: Get statistics hatası: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to get export statistics',
      error: error.message
    });
  }
});

// Get export formats
router.get('/formats', authenticateToken, async (req, res) => {
  logger.info('📋 DataExportV2 Route: Get formats endpoint çağrıldı');
  
  try {
    const formats = [
      {
        type: 'csv',
        name: 'CSV (Comma Separated Values)',
        description: 'Simple text format, good for spreadsheet applications',
        extensions: ['.csv']
      },
      {
        type: 'json',
        name: 'JSON (JavaScript Object Notation)',
        description: 'Structured data format, good for APIs and data processing',
        extensions: ['.json']
      },
      {
        type: 'excel',
        name: 'Excel (XLSX)',
        description: 'Microsoft Excel format with formatting and multiple sheets',
        extensions: ['.xlsx']
      },
      {
        type: 'pdf',
        name: 'PDF (Portable Document Format)',
        description: 'Portable document format with formatting and charts',
        extensions: ['.pdf']
      }
    ];

    logger.info('✅ DataExportV2 Route: Formatlar döndürüldü');

    res.json({
      success: true,
      data: formats
    });
  } catch (error: any) {
    logger.error(`❌ DataExportV2 Route: Get formats hatası: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to get export formats',
      error: error.message
    });
  }
});

// Get data types
router.get('/data-types', authenticateToken, async (req, res) => {
  logger.info('📋 DataExportV2 Route: Get data types endpoint çağrıldı');
  
  try {
    const dataTypes = [
      {
        type: 'user_analytics',
        name: 'User Analytics',
        description: 'User behavior, journey tracking, and engagement data',
        available_metrics: ['page_views', 'session_duration', 'conversion_rate', 'drop_off_points']
      },
      {
        type: 'performance_metrics',
        name: 'Performance Metrics',
        description: 'System performance, API response times, and resource usage',
        available_metrics: ['cpu_usage', 'memory_usage', 'api_response_time', 'error_rate']
      },
      {
        type: 'business_metrics',
        name: 'Business Metrics',
        description: 'Combined analytics and performance data for business insights',
        available_metrics: ['user_growth', 'revenue_metrics', 'operational_metrics', 'kpi_tracking']
      },
      {
        type: 'custom',
        name: 'Custom Data',
        description: 'Custom filtered data based on specific requirements',
        available_metrics: ['custom_dimensions', 'filtered_data', 'specific_metrics']
      }
    ];

    logger.info('✅ DataExportV2 Route: Data type\'lar döndürüldü');

    res.json({
      success: true,
      data: dataTypes
    });
  } catch (error: any) {
    logger.error(`❌ DataExportV2 Route: Get data types hatası: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to get data types',
      error: error.message
    });
  }
});

export default router; 