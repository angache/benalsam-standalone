import express from 'express';
import dataExportService from '../services/dataExportService';
import { authenticateToken } from '../middleware/auth';
import logger from '../config/logger';

const router: express.Router = express.Router();

// Initialize data export system
router.post('/initialize', authenticateToken, async (req, res) => {
  try {
    await dataExportService.initializeIndexes();
    res.json({
      success: true,
      message: 'Data export system initialized successfully'
    });
  } catch (error: any) {
    logger.error('Error initializing data export system:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize data export system',
      error: error.message
    });
  }
});

// Create export request
router.post('/requests', authenticateToken, async (req, res) => {
  try {
    const { export_type, data_type, filters, schedule } = req.body;
    const user_id = (req as any).admin?.id || (req as any).user?.adminId || (req as any).user?.id;

    const exportRequest = await dataExportService.createExportRequest({
      user_id,
      export_type,
      data_type,
      filters,
      schedule
    });

    res.json({
      success: true,
      data: exportRequest
    });
  } catch (error: any) {
    logger.error('Error creating export request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create export request',
      error: error.message
    });
  }
});

// Get export requests
router.get('/requests', authenticateToken, async (req, res) => {
  try {
    const { user_id, status } = req.query;
    logger.info(`DataExport Route: Getting export requests for user_id: ${user_id}, status: ${status}`);
    logger.info(`DataExport Route: dataExportService instance: ${typeof dataExportService}`);
    logger.info(`DataExport Route: About to call getExportRequests method`);
    
    const requests = await dataExportService.getExportRequests(
      user_id as string,
      status as string
    );

    logger.info(`DataExport Route: Found ${requests.length} export requests`);

    res.json({
      success: true,
      data: requests
    });
  } catch (error: any) {
    logger.error('Error getting export requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get export requests',
      error: error.message
    });
  }
});

// Process export
router.post('/process/:exportId', authenticateToken, async (req, res) => {
  try {
    const { exportId } = req.params;
    
    // Get export request
    const requests = await dataExportService.getExportRequests();
    const exportRequest = requests.find(req => req.id === exportId);
    
    if (!exportRequest) {
      return res.status(404).json({
        success: false,
        message: 'Export request not found'
      });
    }

    const result = await dataExportService.processExport(exportRequest);

    return res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('Error processing export:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process export',
      error: error.message
    });
  }
});

// Download export file
router.get('/download/:exportId', authenticateToken, async (req, res) => {
  try {
    const { exportId } = req.params;
    
    // Get export request
    const requests = await dataExportService.getExportRequests();
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

    // Check if file exists
    const fs = require('fs');
    if (!fs.existsSync(exportRequest.file_path)) {
      return res.status(404).json({
        success: false,
        message: 'Export file not found'
      });
    }

    // Determine file extension
    let extension = '';
    switch (exportRequest.export_type) {
      case 'csv':
        extension = '.csv';
        break;
      case 'json':
        extension = '.json';
        break;
      case 'excel':
        extension = '.xlsx';
        break;
      case 'pdf':
        extension = '.pdf';
        break;
    }

    const fileName = `analytics_export_${exportRequest.data_type}${extension}`;

    res.download(exportRequest.file_path, fileName, (err) => {
      if (err) {
        logger.error('Error downloading file:', err);
        res.status(500).json({
          success: false,
          message: 'Failed to download file'
        });
      }
    });
    return;
  } catch (error: any) {
    logger.error('Error downloading export:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to download export',
      error: error.message
    });
  }
});

// Delete export
router.delete('/requests/:exportId', authenticateToken, async (req, res) => {
  try {
    const { exportId } = req.params;
    await dataExportService.deleteExport(exportId);

    res.json({
      success: true,
      message: 'Export deleted successfully'
    });
  } catch (error: any) {
    logger.error('Error deleting export:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete export',
      error: error.message
    });
  }
});

// Get export statistics
router.get('/statistics', authenticateToken, async (req, res) => {
  try {
    const statistics = await dataExportService.getExportStatistics();

    res.json({
      success: true,
      data: statistics
    });
  } catch (error: any) {
    logger.error('Error getting export statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get export statistics',
      error: error.message
    });
  }
});

// Quick export (create and process immediately)
router.post('/quick-export', authenticateToken, async (req, res) => {
  try {
    const { export_type, data_type, filters } = req.body;
    const user_id = (req as any).admin?.id || (req as any).user?.adminId || (req as any).user?.id;

    // Create export request
    const exportRequest = await dataExportService.createExportRequest({
      user_id,
      export_type,
      data_type,
      filters
    });

    // Process export immediately
    const result = await dataExportService.processExport(exportRequest);

    res.json({
      success: true,
      data: {
        export_request: exportRequest,
        result: result
      }
    });
  } catch (error: any) {
    logger.error('Error in quick export:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform quick export',
      error: error.message
    });
  }
});

// Get available export formats
router.get('/formats', authenticateToken, async (req, res) => {
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

    res.json({
      success: true,
      data: formats
    });
  } catch (error: any) {
    logger.error('Error getting export formats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get export formats',
      error: error.message
    });
  }
});

// Get available data types
router.get('/data-types', authenticateToken, async (req, res) => {
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

    res.json({
      success: true,
      data: dataTypes
    });
  } catch (error: any) {
    logger.error('Error getting data types:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get data types',
      error: error.message
    });
  }
});

export default router; 