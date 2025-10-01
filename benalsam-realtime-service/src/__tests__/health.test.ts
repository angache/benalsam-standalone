import request from 'supertest';
import express from 'express';
import { healthRoutes } from '../routes/health';

const app = express();
app.use('/api/v1/health', healthRoutes);

describe('Health Check', () => {
  it('should return health status', async () => {
    const response = await request(app)
      .get('/api/v1/health')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('healthy');
    expect(response.body.data.service).toBe('realtime-service');
  });
});
