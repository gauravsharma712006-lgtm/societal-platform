import express from 'express';
import request from 'supertest';
import { createAuthRateLimit } from '../auth-rate-limit.middleware';

const makeApp = (trustProxy: false | 'loopback' = false) => {
  const app = express();
  app.set('trust proxy', trustProxy);
  app.post('/login', createAuthRateLimit(2, 1000), express.json(), (_req, res) => res.sendStatus(204));
  app.post('/register', createAuthRateLimit(1, 1000), (_req, res) => res.sendStatus(204));
  return app;
};
describe('authentication rate limits', () => {
  afterEach(() => jest.restoreAllMocks());
  it('returns a consistent 429 with retry time and resets after the window', async () => {
    const clock = jest.spyOn(Date, 'now').mockReturnValue(1000);
    const app = makeApp();
    expect((await request(app).post('/login')).status).toBe(204);
    expect((await request(app).post('/login')).status).toBe(204);
    const limited = await request(app).post('/login');
    expect(limited.status).toBe(429);
    expect(limited.headers['retry-after']).toBe('1');
    expect(limited.body.status).toBe('error');
    clock.mockReturnValue(2001);
    expect((await request(app).post('/login')).status).toBe(204);
  });
  it('does not trust forged forwarding headers without a proxy', async () => {
    const app = makeApp();
    for (let i = 1; i <= 3; i++) {
      expect((await request(app).post('/login').set('X-Forwarded-For', `192.0.2.${i}`)).status).toBe(i === 3 ? 429 : 204);
    }
  });
  it('uses the client address supplied by the trusted loopback proxy', async () => {
    const app = makeApp('loopback');
    for (let i = 1; i <= 3; i++) {
      expect((await request(app).post('/login').set('X-Forwarded-For', `192.0.2.${i}`)).status).toBe(204);
    }
  });
  it('groups rotating IPv6 client addresses by /64', async () => {
    const app = makeApp('loopback');
    for (let i = 1; i <= 3; i++) {
      expect((await request(app).post('/login').set('X-Forwarded-For', `2001:db8:1234:5678::${i}`)).status).toBe(i === 3 ? 429 : 204);
    }
  });
  it('counts malformed bodies and keeps login/registration counters separate', async () => {
    const app = makeApp();
    await request(app).post('/login').set('Content-Type', 'application/json').send('{');
    await request(app).post('/login');
    expect((await request(app).post('/login')).status).toBe(429);
    expect((await request(app).post('/register')).status).toBe(204);
    expect((await request(app).post('/register')).status).toBe(429);
  });
});
