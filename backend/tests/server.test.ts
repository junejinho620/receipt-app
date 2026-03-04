import request from 'supertest';
import { app, prisma } from '../src/index';

describe('API Server Core', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/health', () => {
    it('should return 200 OK and status ok', async () => {
      const response = await request(app).get('/api/health');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Security Boundaries', () => {
    it('should block unauthenticated requests to protected endpoints (401)', async () => {
      // Trying to get self profile without a token
      const response = await request(app).get('/api/users/profile');
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Access token missing');
    });

    it('should block unauthenticated attempts to hit the shred endpoint', async () => {
      const response = await request(app).delete('/api/users/profile');
      expect(response.status).toBe(401);
    });
  });
});
