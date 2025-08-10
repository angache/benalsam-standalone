import { Client } from '@elastic/elasticsearch';
import logger from '../config/logger';
import * as fs from 'fs';
import * as path from 'path';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { AdminElasticsearchService } from './elasticsearchService';

// Interfaces
export interface ExportRequest {
  id: string;
  user_id: string;
  export_type: 'csv' | 'json' | 'excel' | 'pdf';
  data_type: 'user_analytics' | 'performance_metrics' | 'business_metrics' | 'custom';
  filters: {
    date_range?: {
      start: string;
      end: string;
    };
    metrics?: string[];
    user_segments?: string[];
    custom_dimensions?: Record<string, any>;
  };
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
    time?: string;
    days?: string[];
  };
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: Date;
  completed_at?: Date;
  file_path?: string;
  file_size?: number;
  error_message?: string;
}

export interface ExportResult {
  success: boolean;
  data?: any;
  file_path?: string;
  file_size?: number;
  error?: string;
}

export class DataExportService {
  private client: Client;
  private exportsIndex: string = 'analytics_exports';
  private exportsDir: string = path.join(__dirname, '../../exports');

  constructor() {
    logger.info('DataExportService: Constructor called');
    
    // Use the same Elasticsearch client configuration as other services
    // Pass the correct URL from environment variables
    const elasticsearchUrl = process.env.ELASTICSEARCH_URL || 'http://209.227.228.96:9200';
    logger.info(`DataExportService: Using Elasticsearch URL: ${elasticsearchUrl}`);
    
    const elasticsearchService = new AdminElasticsearchService(elasticsearchUrl);
    this.client = elasticsearchService.getClient();
    logger.info('DataExportService: Elasticsearch client initialized');

    // Create exports directory if it doesn't exist
    if (!fs.existsSync(this.exportsDir)) {
      fs.mkdirSync(this.exportsDir, { recursive: true });
    }
    logger.info('DataExportService: Constructor completed');
  }

  async initializeIndexes(): Promise<void> {
    try {
      // Check if exports index exists
      const indexExists = await this.client.indices.exists({
        index: this.exportsIndex
      });

      if (!indexExists) {
        await this.client.indices.create({
          index: this.exportsIndex,
          body: {
            mappings: {
              properties: {
                id: { type: 'keyword' },
                user_id: { type: 'keyword' },
                export_type: { type: 'keyword' },
                data_type: { type: 'keyword' },
                filters: { type: 'object', dynamic: true },
                schedule: { type: 'object', dynamic: true },
                status: { type: 'keyword' },
                created_at: { type: 'date' },
                completed_at: { type: 'date' },
                file_path: { type: 'keyword' },
                file_size: { type: 'long' },
                error_message: { type: 'text' }
              }
            }
          }
        });
        logger.info('Analytics exports index created successfully');
      }
    } catch (error: any) {
      logger.error('Error initializing exports index:', error);
      throw error;
    }
  }

  async createExportRequest(request: Omit<ExportRequest, 'id' | 'created_at' | 'status'>): Promise<ExportRequest> {
    try {
      const exportRequest: ExportRequest = {
        ...request,
        id: `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'pending',
        created_at: new Date()
      };

      await this.client.index({
        index: this.exportsIndex,
        id: exportRequest.id,
        body: exportRequest
      });

      logger.info(`Export request created: ${exportRequest.id}`);
      return exportRequest;
    } catch (error: any) {
      logger.error('Error creating export request:', error);
      throw error;
    }
  }

  async getExportRequests(userId?: string, status?: string): Promise<ExportRequest[]> {
    let response: any = null;
    try {
      const query: any = {
        bool: {
          must: []
        }
      };

      if (userId) {
        query.bool.must.push({ term: { user_id: userId } });
      }

      if (status) {
        query.bool.must.push({ term: { status: status } });
      }

      logger.info(`DataExportService: Searching index: ${this.exportsIndex}`);
      logger.info(`DataExportService: Query: ${JSON.stringify(query)}`);

                        response = await this.client.search({
                    index: this.exportsIndex,
                    body: {
                      query,
                      sort: [{ created_at: { order: 'desc' } }],
                      size: 100
                    }
                  });

                  logger.info('DataExportService: Response received, type: ' + typeof response);
                  logger.info('DataExportService: Response is null: ' + (response === null));
                  logger.info('DataExportService: Response is undefined: ' + (response === undefined));

                  // Save response to file for detailed analysis
                  try {
                    const responseFilePath = '/tmp/es_export_requests_response.json';
                    const responseString = JSON.stringify(response, null, 2);
                    fs.writeFileSync(responseFilePath, responseString);
                    logger.info(`DataExportService: Response saved to file: ${responseFilePath}, size: ${responseString.length} chars`);
                  } catch (fileError) {
                    logger.error('DataExportService: Error saving response to file: ' + fileError);
                  }

                  logger.info('DataExportService: Raw response: ' + JSON.stringify(response, null, 2));

      // Check if response exists and has the expected structure
      if (!response || !(response as any).body || !(response as any).body.hits) {
        logger.warn('No export requests found or invalid response structure: ' + JSON.stringify(response, null, 2));
        return [];
      }

      const hits = (response as any).body.hits.hits;
      logger.info(`DataExportService: Found ${hits.length} export requests`);

      return hits.map((hit: any) => ({
        ...hit._source,
        created_at: new Date(hit._source.created_at),
        completed_at: hit._source.completed_at ? new Date(hit._source.completed_at) : undefined
      }));
    } catch (error: any) {
      logger.error('Error getting export requests: ' + (error?.message || error) + ' | Response: ' + (response ? JSON.stringify(response, null, 2) : 'null'));
      throw error;
    }
  }

  async processExport(exportRequest: ExportRequest): Promise<ExportResult> {
    try {
      // Update status to processing
      await this.updateExportStatus(exportRequest.id, 'processing');

      // Fetch data based on type and filters
      const data = await this.fetchData(exportRequest.data_type, exportRequest.filters);

      // Export based on format
      let result: ExportResult;
      switch (exportRequest.export_type) {
        case 'csv':
          result = await this.exportToCSV(data, exportRequest);
          break;
        case 'json':
          result = await this.exportToJSON(data, exportRequest);
          break;
        case 'excel':
          result = await this.exportToExcel(data, exportRequest);
          break;
        case 'pdf':
          result = await this.exportToPDF(data, exportRequest);
          break;
        default:
          throw new Error(`Unsupported export type: ${exportRequest.export_type}`);
      }

      // Update export request with results
      await this.updateExportStatus(exportRequest.id, 'completed', {
        file_path: result.file_path,
        file_size: result.file_size
      });

      return result;
    } catch (error: any) {
      logger.error('Error processing export:', error);
      
      // Update export request with error
      await this.updateExportStatus(exportRequest.id, 'failed', {
        error_message: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  private async fetchData(dataType: string, filters: any): Promise<any> {
    try {
      switch (dataType) {
        case 'user_analytics':
          return await this.fetchUserAnalytics(filters);
        case 'performance_metrics':
          return await this.fetchPerformanceMetrics(filters);
        case 'business_metrics':
          return await this.fetchBusinessMetrics(filters);
        case 'custom':
          return await this.fetchCustomData(filters);
        default:
          throw new Error(`Unsupported data type: ${dataType}`);
      }
    } catch (error: any) {
      logger.error('Error fetching data:', error);
      throw error;
    }
  }

  private async fetchUserAnalytics(filters: any): Promise<any> {
    const query: any = {
      bool: {
        must: [
          { term: { _index: 'user_journeys' } }
        ]
      }
    };

    if (filters.date_range) {
      query.bool.must.push({
        range: {
          start_time: {
            gte: filters.date_range.start,
            lte: filters.date_range.end
          }
        }
      });
    }

    const response = await this.client.search({
      index: 'user_journeys',
      body: {
        query,
        size: 1000
      }
    });

    // Check if response exists and has the expected structure
    if (!response || !(response as any).body || !(response as any).body.hits) {
      logger.warn('No user analytics data found or invalid response structure');
      return [];
    }

    return (response as any).body.hits.hits.map((hit: any) => hit._source);
  }

  private async fetchPerformanceMetrics(filters: any): Promise<any> {
    const query: any = {
      bool: {
        must: [
          { term: { _index: 'performance_metrics' } }
        ]
      }
    };

    if (filters.date_range) {
      query.bool.must.push({
        range: {
          timestamp: {
            gte: filters.date_range.start,
            lte: filters.date_range.end
          }
        }
      });
    }

    const response = await this.client.search({
      index: 'performance_metrics',
      body: {
        query,
        size: 1000
      }
    });

    // Check if response exists and has the expected structure
    if (!response || !(response as any).body || !(response as any).body.hits) {
      logger.warn('No performance metrics data found or invalid response structure');
      return [];
    }

    return (response as any).body.hits.hits.map((hit: any) => hit._source);
  }

  private async fetchBusinessMetrics(filters: any): Promise<any> {
    // Combine data from multiple sources for business metrics
    const [userAnalytics, performanceMetrics] = await Promise.all([
      this.fetchUserAnalytics(filters),
      this.fetchPerformanceMetrics(filters)
    ]);

    return {
      user_analytics: userAnalytics,
      performance_metrics: performanceMetrics,
      summary: {
        total_users: userAnalytics.length,
        total_metrics: performanceMetrics.length,
        date_range: filters.date_range
      }
    };
  }

  private async fetchCustomData(filters: any): Promise<any> {
    // Custom data fetching based on filters
    return await this.fetchUserAnalytics(filters);
  }

  private async exportToCSV(data: any[], exportRequest: ExportRequest): Promise<ExportResult> {
    try {
      if (!data || data.length === 0) {
        throw new Error('No data to export');
      }

      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => JSON.stringify(row[header])).join(','))
      ].join('\n');

      const fileName = `${exportRequest.id}_${exportRequest.data_type}.csv`;
      const filePath = path.join(this.exportsDir, fileName);

      fs.writeFileSync(filePath, csvContent, 'utf8');
      const fileSize = fs.statSync(filePath).size;

      return {
        success: true,
        data: csvContent,
        file_path: filePath,
        file_size: fileSize
      };
    } catch (error: any) {
      logger.error('Error exporting to CSV:', error);
      throw error;
    }
  }

  private async exportToJSON(data: any[], exportRequest: ExportRequest): Promise<ExportResult> {
    try {
      const fileName = `${exportRequest.id}_${exportRequest.data_type}.json`;
      const filePath = path.join(this.exportsDir, fileName);

      const jsonContent = JSON.stringify(data, null, 2);
      fs.writeFileSync(filePath, jsonContent, 'utf8');
      const fileSize = fs.statSync(filePath).size;

      return {
        success: true,
        data: data,
        file_path: filePath,
        file_size: fileSize
      };
    } catch (error: any) {
      logger.error('Error exporting to JSON:', error);
      throw error;
    }
  }

  private async exportToExcel(data: any[], exportRequest: ExportRequest): Promise<ExportResult> {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Analytics Data');

      if (data && data.length > 0) {
        // Add headers
        const headers = Object.keys(data[0]);
        worksheet.addRow(headers);

        // Add data rows
        data.forEach(row => {
          const rowData = headers.map(header => row[header]);
          worksheet.addRow(rowData);
        });

        // Style headers
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };
      }

      const fileName = `${exportRequest.id}_${exportRequest.data_type}.xlsx`;
      const filePath = path.join(this.exportsDir, fileName);

      await workbook.xlsx.writeFile(filePath);
      const fileSize = fs.statSync(filePath).size;

      return {
        success: true,
        data: data,
        file_path: filePath,
        file_size: fileSize
      };
    } catch (error: any) {
      logger.error('Error exporting to Excel:', error);
      throw error;
    }
  }

  private async exportToPDF(data: any[], exportRequest: ExportRequest): Promise<ExportResult> {
    try {
      const fileName = `${exportRequest.id}_${exportRequest.data_type}.pdf`;
      const filePath = path.join(this.exportsDir, fileName);

      const doc = new PDFDocument();
      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);

      // Add title
      doc.fontSize(20).text('Analytics Report', { align: 'center' });
      doc.moveDown();

      // Add metadata
      doc.fontSize(12).text(`Export Type: ${exportRequest.export_type}`);
      doc.text(`Data Type: ${exportRequest.data_type}`);
      doc.text(`Generated: ${new Date().toISOString()}`);
      doc.moveDown();

      // Add data summary
      if (data && data.length > 0) {
        doc.fontSize(14).text('Data Summary', { underline: true });
        doc.fontSize(10).text(`Total Records: ${data.length}`);
        doc.moveDown();

        // Add sample data (first 10 records)
        const sampleData = data.slice(0, 10);
        doc.fontSize(12).text('Sample Data:', { underline: true });
        doc.moveDown();

        sampleData.forEach((record, index) => {
          doc.fontSize(10).text(`Record ${index + 1}:`);
          Object.entries(record).forEach(([key, value]) => {
            doc.fontSize(8).text(`  ${key}: ${JSON.stringify(value)}`);
          });
          doc.moveDown();
        });
      }

      doc.end();

      return new Promise((resolve, reject) => {
        stream.on('finish', () => {
          const fileSize = fs.statSync(filePath).size;
          resolve({
            success: true,
            data: data,
            file_path: filePath,
            file_size: fileSize
          });
        });

        stream.on('error', (error) => {
          reject(error);
        });
      });
    } catch (error: any) {
      logger.error('Error exporting to PDF:', error);
      throw error;
    }
  }

  private async updateExportStatus(exportId: string, status: string, additionalData?: any): Promise<void> {
    try {
      const updateBody: any = {
        status,
        ...additionalData
      };

      if (status === 'completed' || status === 'failed') {
        updateBody.completed_at = new Date();
      }

      await this.client.update({
        index: this.exportsIndex,
        id: exportId,
        body: {
          doc: updateBody
        }
      });

      logger.info(`Export ${exportId} status updated to: ${status}`);
    } catch (error: any) {
      logger.error('Error updating export status:', error);
      throw error;
    }
  }

  async deleteExport(exportId: string): Promise<void> {
    try {
      // Get export request to find file path
      const response = await this.client.get({
        index: this.exportsIndex,
        id: exportId
      });

      const exportRequest = (response as any).body._source;

      // Delete file if exists
      if (exportRequest.file_path && fs.existsSync(exportRequest.file_path)) {
        fs.unlinkSync(exportRequest.file_path);
      }

      // Delete from Elasticsearch
      await this.client.delete({
        index: this.exportsIndex,
        id: exportId
      });

      logger.info(`Export ${exportId} deleted successfully`);
    } catch (error: any) {
      logger.error('Error deleting export:', error);
      throw error;
    }
  }

  async getExportStatistics(): Promise<any> {
    try {
      const response = await this.client.search({
        index: this.exportsIndex,
        body: {
          aggs: {
            export_types: {
              terms: { field: 'export_type' }
            },
            data_types: {
              terms: { field: 'data_type' }
            },
            status_distribution: {
              terms: { field: 'status' }
            },
            daily_exports: {
              date_histogram: {
                field: 'created_at',
                calendar_interval: 'day'
              }
            }
          },
          size: 0
        }
      });

      return (response as any).body?.aggregations || {};
    } catch (error: any) {
      logger.error('Error getting export statistics:', error);
      throw error;
    }
  }
}

// Create a singleton instance with lazy initialization
let dataExportServiceInstance: DataExportService | null = null;

const getDataExportService = (): DataExportService => {
  if (!dataExportServiceInstance) {
    logger.info('DataExportService: Creating new instance');
    dataExportServiceInstance = new DataExportService();
  }
  return dataExportServiceInstance;
};

export default getDataExportService(); 