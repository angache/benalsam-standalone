import request from 'supertest';
import express from 'express';
import healthRoutes from '../routes/health';

const app = express();
app.use('/api/v1/health', healthRoutes);

describe('Health Endpoints', () => {
  describe('GET /api/v1/health', () => {
    it('should return basic health status', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('version');
    });
  });

  describe('GET /api/v1/health/detailed', () => {
    it('should return detailed health status', async () => {
      const response = await request(app)
        .get('/api/v1/health/detailed')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('services');
      expect(response.body).toHaveProperty('metrics');
    });
  });
});
