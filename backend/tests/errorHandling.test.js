const request = require('supertest');
const app = require('../src/app');

describe('Error Handling Middleware', () => {
  it('GET /api/non-existent-route should return unified 404 error format', async () => {
    const res = await request(app).get('/api/non-existent-route');

    expect(res.status).toBe(404);
    expect(res.body).toEqual(
      expect.objectContaining({
        success: false,
        statusCode: 404,
        message: expect.stringContaining('Cannot GET /api/non-existent-route'),
        errors: [],
      })
    );
  });

  it('POST with malformed JSON body should return unified 400 error format', async () => {
    const res = await request(app)
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send('{ "invalidJson": ');

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('statusCode', 400);
    expect(res.body.message).toMatch(/Malformed JSON/);
  });
});

