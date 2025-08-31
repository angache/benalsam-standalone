import request from 'supertest';
import { app } from '../index';
import { elasticsearchSyncQueue } from '../queues/elasticsearchSyncQueue';

describe('Queue Service Integration Tests', () => {
  beforeAll(async () => {
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    // Clean up queues
    await elasticsearchSyncQueue.close();
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await request(app)
        .get('/api/v1/queue/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.data.timestamp).toBeDefined();
      expect(response.body.data.redis.connected).toBe(true);
      expect(response.body.data.queues.elasticsearchSync.status).toBe('healthy');
    });

    it('should return metrics', async () => {
      const response = await request(app)
        .get('/api/v1/queue/metrics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.memory).toBeDefined();
      expect(response.body.data.queues).toBeDefined();
      expect(response.body.data.processors).toBeDefined();
    });
  });

  describe('Job Management', () => {
    it('should create a new job', async () => {
      const jobData = {
        type: 'ELASTICSEARCH_SYNC',
        operation: 'INSERT',
        table: 'inventory_items',
        recordId: 123,
        changeData: { name: 'Test Item', price: 99.99 }
      };

      const response = await request(app)
        .post('/api/v1/queue/jobs')
        .send(jobData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.job.id).toBeDefined();
      expect(response.body.job.type).toBe('ELASTICSEARCH_SYNC');
      expect(response.body.job.operation).toBe('INSERT');
    });

    it('should get job by id', async () => {
      // First create a job
      const jobData = {
        type: 'ELASTICSEARCH_SYNC',
        operation: 'UPDATE',
        table: 'inventory_items',
        recordId: 456,
        changeData: { name: 'Updated Item' }
      };

      const createResponse = await request(app)
        .post('/api/v1/queue/jobs')
        .send(jobData);

      const jobId = createResponse.body.job.id;

      // Then get the job
      const response = await request(app)
        .get(`/api/v1/queue/jobs/${jobId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.job.id).toBe(jobId);
      expect(response.body.job.type).toBe('ELASTICSEARCH_SYNC');
    });

    it('should retry failed job', async () => {
      // First create a job
      const jobData = {
        type: 'ELASTICSEARCH_SYNC',
        operation: 'DELETE',
        table: 'inventory_items',
        recordId: 789
      };

      const createResponse = await request(app)
        .post('/api/v1/queue/jobs')
        .send(jobData);

      const jobId = createResponse.body.job.id;

      // Then retry the job
      const response = await request(app)
        .put(`/api/v1/queue/jobs/${jobId}/retry`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Job retried successfully');
    });
  });

  describe('Queue Management', () => {
    it('should get queue stats', async () => {
      const response = await request(app)
        .get('/api/v1/queue/queues/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.queues.elasticsearchSync).toBeDefined();
      expect(response.body.queues.elasticsearchSync.waiting).toBeGreaterThanOrEqual(0);
    });

    it('should pause and resume queue', async () => {
      // Pause queue
      let response = await request(app)
        .post('/api/v1/queue/queues/pause')
        .send({ queueName: 'elasticsearchSync' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('paused');

      // Resume queue
      response = await request(app)
        .post('/api/v1/queue/queues/resume')
        .send({ queueName: 'elasticsearchSync' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('resumed');
    });

    it('should clean completed jobs', async () => {
      const response = await request(app)
        .post('/api/v1/queue/queues/clean')
        .send({ 
          queueName: 'elasticsearchSync',
          clean: 'completed',
          olderThan: 24 * 60 * 60 * 1000 // 24 hours
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('cleaned');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid job data', async () => {
      const invalidJobData = {
        type: 'INVALID_TYPE',
        operation: 'INVALID_OPERATION'
      };

      const response = await request(app)
        .post('/api/v1/queue/jobs')
        .send(invalidJobData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should handle non-existent job', async () => {
      const response = await request(app)
        .get('/api/v1/queue/jobs/999999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });
  });
});
