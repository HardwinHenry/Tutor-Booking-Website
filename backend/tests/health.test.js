const request = require('supertest');
const app = require('../src/app');

describe('Health Check Endpoints', () => {
  it('GET /api/health should return 200 with service health details', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('statusCode', 200);
    expect(res.body).toHaveProperty('message', 'Health check passed');
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('service', 'Tutor Connect Backend API');
    expect(res.body.data).toHaveProperty('database');
    expect(res.body.data.database).toHaveProperty('status');
  });

  it('GET /health (root alias) should also return 200', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /api should return API root metadata', async () => {
    const res = await request(app).get('/api');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('name', 'Tutor Connect Platform API');
    expect(res.body).toHaveProperty('endpoints');
    expect(res.body.endpoints).toHaveProperty('health', '/api/health');
  });
});

