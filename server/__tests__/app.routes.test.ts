import request from 'supertest';
import app from '../src/app';

describe('request parsing', () => {
  it('returns a useful client error for malformed JSON', async () => {
    const response = await request(app).post('/api/auth/login')
      .set('Content-Type', 'application/json').send('{"email":');
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Invalid JSON request body');
  });

  it('rejects oversized JSON without returning a server error', async () => {
    const response = await request(app).post('/api/auth/login')
      .send({ email: 'a'.repeat(110_000) });
    expect(response.status).toBe(413);
    expect(response.body.message).toBe('Request body is too large');
  });
});
