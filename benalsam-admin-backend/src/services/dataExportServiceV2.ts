import { Client } from '@elastic/elasticsearch';
import logger from '../config/logger';
import * as fs from 'fs';
import * as path from 'path';

// Types
export interface ExportRequest {
  id: string;
  user_id: string;
  export_type: 'csv' | 'json' | 'excel' | 'pdf';
  data_type: 'user_analytics' | 'performance_metrics' | 'business_metrics' | 'custom';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: Date;
  completed_at?: Date;
  file_path?: string;
  filters?: any;
  schedule?: any;
}

export interface ExportStatistics {
  total_requests: number;
  pending_requests: number;
  completed_requests: number;
  failed_requests: number;
  total_size_mb: number;
}

export class DataExportServiceV2 {
  private client: Client;
  private exportsIndex: string = 'analytics_exports';
  private exportsDir: string = path.join(__dirname, '../../exports');
  private debugDir: string = '/tmp';

  constructor() {
    logger.info('🔧 DataExportServiceV2: Constructor başlatılıyor...');
    
    // Elasticsearch URL'ini environment'dan al
    const elasticsearchUrl = process.env.ELASTICSEARCH_URL || 'http://209.227.228.96:9200';
    logger.info(`🔧 DataExportServiceV2: Elasticsearch URL: ${elasticsearchUrl}`);
    
    // Elasticsearch client oluştur
    this.client = new Client({
      node: elasticsearchUrl,
      maxRetries: 3,
      requestTimeout: 10000,
      sniffOnStart: false
    });
    
    // Exports dizinini oluştur
    if (!fs.existsSync(this.exportsDir)) {
      fs.mkdirSync(this.exportsDir, { recursive: true });
      logger.info(`🔧 DataExportServiceV2: Exports dizini oluşturuldu: ${this.exportsDir}`);
    }
    
    logger.info('✅ DataExportServiceV2: Constructor tamamlandı');
  }

  /**
   * Export isteklerini getir
   */
  async getExportRequests(userId?: string, status?: string): Promise<ExportRequest[]> {
    logger.info('📋 DataExportServiceV2: getExportRequests başlatılıyor...');
    logger.info(`📋 DataExportServiceV2: userId=${userId}, status=${status}`);
    
    try {
      // Query oluştur
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

      logger.info(`📋 DataExportServiceV2: Elasticsearch query: ${JSON.stringify(query)}`);

      // Elasticsearch'e istek gönder
      const response = await this.client.search({
        index: this.exportsIndex,
        body: {
          query,
          sort: [{ created_at: { order: 'desc' } }],
          size: 100
        }
      });

      // Response'u debug için dosyaya kaydet
      this.saveResponseToFile('export_requests_response.json', response);
      
      logger.info(`📋 DataExportServiceV2: Response alındı, type: ${typeof response}`);
      logger.info(`📋 DataExportServiceV2: Response null mu: ${response === null}`);
      logger.info(`📋 DataExportServiceV2: Response undefined mu: ${response === undefined}`);

                        // Response yapısını kontrol et
                  if (!response || !(response as any).hits) {
                    logger.warn('⚠️ DataExportServiceV2: Geçersiz response yapısı');
                    this.saveResponseToFile('export_requests_invalid_response.json', response);
                    return [];
                  }

                  const hits = (response as any).hits.hits;
      logger.info(`📋 DataExportServiceV2: ${hits.length} export isteği bulundu`);

      // Sonuçları dönüştür
      const requests = hits.map((hit: any) => ({
        ...hit._source,
        created_at: new Date(hit._source.created_at),
        completed_at: hit._source.completed_at ? new Date(hit._source.completed_at) : undefined
      }));

      logger.info(`✅ DataExportServiceV2: getExportRequests başarılı, ${requests.length} istek döndürüldü`);
      return requests;

    } catch (error: any) {
      logger.error(`❌ DataExportServiceV2: getExportRequests hatası: ${error.message}`);
      this.saveResponseToFile('export_requests_error.json', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Export isteği oluştur
   */
  async createExportRequest(data: {
    user_id: string;
    export_type: 'csv' | 'json' | 'excel' | 'pdf';
    data_type: 'user_analytics' | 'performance_metrics' | 'business_metrics' | 'custom';
    filters?: any;
    schedule?: any;
  }): Promise<ExportRequest> {
    logger.info('📝 DataExportServiceV2: createExportRequest başlatılıyor...');
    
    try {
      const exportRequest: ExportRequest = {
        id: `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: data.user_id,
        export_type: data.export_type,
        data_type: data.data_type,
        status: 'pending',
        created_at: new Date(),
        filters: data.filters,
        schedule: data.schedule
      };

      // Elasticsearch'e kaydet
      await this.client.index({
        index: this.exportsIndex,
        id: exportRequest.id,
        body: exportRequest
      });

      logger.info(`✅ DataExportServiceV2: Export isteği oluşturuldu: ${exportRequest.id}`);
      return exportRequest;

    } catch (error: any) {
      logger.error(`❌ DataExportServiceV2: createExportRequest hatası: ${error.message}`);
      throw error;
    }
  }

  /**
   * Export işlemini gerçekleştir
   */
  async processExport(exportRequest: ExportRequest): Promise<any> {
    logger.info(`🔄 DataExportServiceV2: processExport başlatılıyor... ID: ${exportRequest.id}`);
    
    try {
      // Status'u processing olarak güncelle
      await this.client.update({
        index: this.exportsIndex,
        id: exportRequest.id,
        body: {
          doc: { status: 'processing' }
        }
      });

      // Mock export işlemi (gerçek implementasyon burada olacak)
      await new Promise(resolve => setTimeout(resolve, 2000));

      const filePath = path.join(this.exportsDir, `${exportRequest.id}.${exportRequest.export_type}`);
      
      // Mock dosya oluştur
      fs.writeFileSync(filePath, `Mock export data for ${exportRequest.data_type}`);

      // Status'u completed olarak güncelle
      await this.client.update({
        index: this.exportsIndex,
        id: exportRequest.id,
        body: {
          doc: { 
            status: 'completed',
            completed_at: new Date(),
            file_path: filePath
          }
        }
      });

      logger.info(`✅ DataExportServiceV2: Export tamamlandı: ${exportRequest.id}`);
      return { success: true, file_path: filePath };

    } catch (error: any) {
      logger.error(`❌ DataExportServiceV2: processExport hatası: ${error.message}`);
      
      // Status'u failed olarak güncelle
      await this.client.update({
        index: this.exportsIndex,
        id: exportRequest.id,
        body: {
          doc: { status: 'failed' }
        }
      });
      
      throw error;
    }
  }

  /**
   * Export istatistiklerini getir
   */
  async getExportStatistics(): Promise<ExportStatistics> {
    logger.info('📊 DataExportServiceV2: getExportStatistics başlatılıyor...');
    
    try {
      const requests = await this.getExportRequests();
      
      const stats: ExportStatistics = {
        total_requests: requests.length,
        pending_requests: requests.filter(r => r.status === 'pending').length,
        completed_requests: requests.filter(r => r.status === 'completed').length,
        failed_requests: requests.filter(r => r.status === 'failed').length,
        total_size_mb: 0 // Gerçek implementasyonda hesaplanacak
      };

      logger.info(`✅ DataExportServiceV2: İstatistikler hesaplandı`);
      return stats;

    } catch (error: any) {
      logger.error(`❌ DataExportServiceV2: getExportStatistics hatası: ${error.message}`);
      throw error;
    }
  }

  /**
   * Export isteğini sil
   */
  async deleteExport(exportId: string): Promise<void> {
    logger.info(`🗑️ DataExportServiceV2: deleteExport başlatılıyor... ID: ${exportId}`);
    
    try {
      await this.client.delete({
        index: this.exportsIndex,
        id: exportId
      });

      logger.info(`✅ DataExportServiceV2: Export silindi: ${exportId}`);

    } catch (error: any) {
      logger.error(`❌ DataExportServiceV2: deleteExport hatası: ${error.message}`);
      throw error;
    }
  }

  /**
   * Index'leri başlat
   */
  async initializeIndexes(): Promise<void> {
    logger.info('🏗️ DataExportServiceV2: Indexler baslatiliyor...');
    
    try {
      const indexExists = await this.client.indices.exists({
        index: this.exportsIndex
      });

      // Index varsa sil ve yeniden oluştur
      if ((indexExists as any).body) {
        logger.info(`🗑️ DataExportServiceV2: Mevcut ${this.exportsIndex} index'i siliniyor...`);
        await this.client.indices.delete({
          index: this.exportsIndex
        });
        logger.info(`✅ DataExportServiceV2: ${this.exportsIndex} index'i silindi`);
      }

      // Yeni index oluştur
      await this.client.indices.create({
        index: this.exportsIndex,
        body: {
          mappings: {
            properties: {
              id: { type: 'keyword' },
              user_id: { type: 'keyword' },
              export_type: { type: 'keyword' },
              data_type: { type: 'keyword' },
              status: { type: 'keyword' },
              created_at: { type: 'date' },
              completed_at: { type: 'date' },
              file_path: { type: 'keyword' },
              filters: { type: 'object', dynamic: true },
              schedule: { type: 'object', dynamic: true }
            }
          }
        }
      });
      logger.info(`✅ DataExportServiceV2: ${this.exportsIndex} index'i oluşturuldu`);

    } catch (error: any) {
      logger.error(`❌ DataExportServiceV2: initializeIndexes hatası: ${error.message}`);
      throw error;
    }
  }

  /**
   * Response'u debug için dosyaya kaydet
   */
  private saveResponseToFile(filename: string, data: any): void {
    try {
      const filePath = path.join(this.debugDir, filename);
      const jsonString = JSON.stringify(data, null, 2);
      fs.writeFileSync(filePath, jsonString);
      logger.info(`💾 DataExportServiceV2: Response kaydedildi: ${filePath} (${jsonString.length} chars)`);
    } catch (error: any) {
      logger.error(`❌ DataExportServiceV2: Response kaydetme hatası: ${error.message}`);
    }
  }
}

// Singleton instance
let dataExportServiceV2Instance: DataExportServiceV2 | null = null;

export const getDataExportServiceV2 = (): DataExportServiceV2 => {
  if (!dataExportServiceV2Instance) {
    logger.info('🏗️ DataExportServiceV2: Yeni instance oluşturuluyor...');
    dataExportServiceV2Instance = new DataExportServiceV2();
  }
  return dataExportServiceV2Instance;
};

export default getDataExportServiceV2(); 