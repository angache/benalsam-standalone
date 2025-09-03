import { elasticsearchService } from '../../services/elasticsearchService';
import { queueConsumer } from '../../services/queueConsumer';
import { rabbitmqConfig } from '../../config/rabbitmq';
import { supabaseConfig } from '../../config/supabase';
import { mockListing, mockQueueMessage, mockJob } from '../mocks';

describe('Integration Flow: RabbitMQ -> ES -> Job Status', () => {
  beforeAll(async () => {
    // Servisleri başlat
    await queueConsumer.start();
    await elasticsearchService.initializeIndex();
  });

  afterAll(async () => {
    // Servisleri durdur
    await queueConsumer.stop();
    await rabbitmqConfig.closeConnection();
    await elasticsearchConfig.closeConnection();
  });

  beforeEach(async () => {
    // Test öncesi temizlik
    const client = await elasticsearchConfig.getClient();
    await client.deleteByQuery({
      index: 'benalsam_listings',
      body: {
        query: {
          match_all: {}
        }
      },
      refresh: true
    });
  });

  describe('Listing Creation Flow', () => {
    it('should process INSERT message and update job status', async () => {
      // RabbitMQ'ya mesaj gönder
      const channel = await rabbitmqConfig.getChannel();
      await channel.publish(
        'benalsam.listings',
        'listing.insert',
        Buffer.from(JSON.stringify(mockQueueMessage)),
        { messageId: mockQueueMessage.messageId }
      );

      // Job'ın tamamlanmasını bekle
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Job durumunu kontrol et
      const { data: job } = await supabaseConfig.getClient()
        .from('elasticsearch_sync_queue')
        .select('*')
        .eq('id', mockJob.id)
        .single();

      expect(job).toBeDefined();
      expect(job.status).toBe('completed');

      // Elasticsearch'te ilanı kontrol et
      const client = await elasticsearchConfig.getClient();
      const { body } = await client.get({
        index: 'benalsam_listings',
        id: mockListing.id
      });

      expect(body._source).toMatchObject(mockListing);
    });
  });

  describe('Listing Update Flow', () => {
    it('should process UPDATE message and update job status', async () => {
      // Önce ilanı oluştur
      await elasticsearchService.insertListing(mockListing);

      // Update mesajı oluştur
      const updateMessage = {
        ...mockQueueMessage,
        operation: 'UPDATE',
        changeData: {
          ...mockListing,
          title: 'Updated Title'
        }
      };

      // RabbitMQ'ya mesaj gönder
      const channel = await rabbitmqConfig.getChannel();
      await channel.publish(
        'benalsam.listings',
        'listing.update',
        Buffer.from(JSON.stringify(updateMessage)),
        { messageId: `${mockQueueMessage.messageId}_update` }
      );

      // Job'ın tamamlanmasını bekle
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Elasticsearch'te güncellenmiş ilanı kontrol et
      const client = await elasticsearchConfig.getClient();
      const { body } = await client.get({
        index: 'benalsam_listings',
        id: mockListing.id
      });

      expect(body._source.title).toBe('Updated Title');
    });
  });

  describe('Listing Deletion Flow', () => {
    it('should process DELETE message and update job status', async () => {
      // Önce ilanı oluştur
      await elasticsearchService.insertListing(mockListing);

      // Delete mesajı oluştur
      const deleteMessage = {
        ...mockQueueMessage,
        operation: 'DELETE'
      };

      // RabbitMQ'ya mesaj gönder
      const channel = await rabbitmqConfig.getChannel();
      await channel.publish(
        'benalsam.listings',
        'listing.delete',
        Buffer.from(JSON.stringify(deleteMessage)),
        { messageId: `${mockQueueMessage.messageId}_delete` }
      );

      // Job'ın tamamlanmasını bekle
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Elasticsearch'te ilanın silindiğini kontrol et
      const client = await elasticsearchConfig.getClient();
      const exists = await client.exists({
        index: 'benalsam_listings',
        id: mockListing.id
      });

      expect(exists).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid message format', async () => {
      // Geçersiz mesaj gönder
      const channel = await rabbitmqConfig.getChannel();
      await channel.publish(
        'benalsam.listings',
        'listing.insert',
        Buffer.from('invalid json'),
        { messageId: 'invalid_message' }
      );

      // Job'ın failed olmasını bekle
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Job durumunu kontrol et
      const { data: job } = await supabaseConfig.getClient()
        .from('elasticsearch_sync_queue')
        .select('*')
        .eq('id', mockJob.id)
        .single();

      expect(job).toBeDefined();
      expect(job.status).toBe('failed');
      expect(job.error_message).toContain('Invalid message format');
    });

    it('should handle Elasticsearch errors', async () => {
      // Elasticsearch hatası simüle et
      jest.spyOn(elasticsearchService as any, 'getClient').mockRejectedValueOnce(
        new Error('Elasticsearch connection error')
      );

      // RabbitMQ'ya mesaj gönder
      const channel = await rabbitmqConfig.getChannel();
      await channel.publish(
        'benalsam.listings',
        'listing.insert',
        Buffer.from(JSON.stringify(mockQueueMessage)),
        { messageId: mockQueueMessage.messageId }
      );

      // Job'ın failed olmasını bekle
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Job durumunu kontrol et
      const { data: job } = await supabaseConfig.getClient()
        .from('elasticsearch_sync_queue')
        .select('*')
        .eq('id', mockJob.id)
        .single();

      expect(job).toBeDefined();
      expect(job.status).toBe('failed');
      expect(job.error_message).toContain('Elasticsearch connection error');
    });
  });

  describe('Retry Mechanism', () => {
    it('should retry failed operations', async () => {
      // İlk denemede hata ver, sonra başarılı ol
      let attempt = 0;
      jest.spyOn(elasticsearchService as any, 'getClient').mockImplementation(() => {
        if (attempt === 0) {
          attempt++;
          throw new Error('Temporary error');
        }
        return elasticsearchConfig.getClient();
      });

      // RabbitMQ'ya mesaj gönder
      const channel = await rabbitmqConfig.getChannel();
      await channel.publish(
        'benalsam.listings',
        'listing.insert',
        Buffer.from(JSON.stringify(mockQueueMessage)),
        { messageId: mockQueueMessage.messageId }
      );

      // Retry ve başarılı işlemi bekle
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Job durumunu kontrol et
      const { data: job } = await supabaseConfig.getClient()
        .from('elasticsearch_sync_queue')
        .select('*')
        .eq('id', mockJob.id)
        .single();

      expect(job).toBeDefined();
      expect(job.status).toBe('completed');
      expect(job.retry_count).toBe(1);
    });
  });
});
