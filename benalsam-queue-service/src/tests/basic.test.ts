import { elasticsearchSyncQueue } from '../queues/elasticsearchSyncQueue';

describe('Basic Queue Tests', () => {
  afterAll(async () => {
    await elasticsearchSyncQueue.close();
  });

  it('should have elasticsearchSyncQueue defined', () => {
    expect(elasticsearchSyncQueue).toBeDefined();
    expect(typeof elasticsearchSyncQueue.add).toBe('function');
  });

  it('should be able to add a job to queue', async () => {
    const job = await elasticsearchSyncQueue.add('test-job', {
      type: 'ELASTICSEARCH_SYNC',
      operation: 'INSERT',
      table: 'test_table',
      recordId: 1,
      changeData: { test: 'data' }
    });

    expect(job).toBeDefined();
    expect(job.id).toBeDefined();
    expect(job.data.type).toBe('ELASTICSEARCH_SYNC');
  });

  it('should be able to get queue stats', async () => {
    const stats = await elasticsearchSyncQueue.getJobCounts();
    
    expect(stats).toBeDefined();
    expect(typeof stats.waiting).toBe('number');
    expect(typeof stats.active).toBe('number');
    expect(typeof stats.completed).toBe('number');
    expect(typeof stats.failed).toBe('number');
  });
});
