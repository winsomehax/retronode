const request = require('supertest');
const app = require('../app');

describe('Basic Application Tests', () => {
  test('Server is running and responds to GET /', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
  });
});