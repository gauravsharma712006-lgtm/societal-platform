import express from 'express';
import request from 'supertest';
import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../src/config/env';
import User from '../src/models/user.model';
import { authenticate } from '../src/middleware/auth.middleware';
import { authorize } from '../src/middleware/authorize.middleware';
import { generateAccessToken } from '../src/utils/jwt';

const userId = '507f1f77bcf86cd799439011';
const app = express();
app.get('/private', authenticate, (req, res) => res.json(req.user));
app.get('/admin', authenticate, authorize('ADMIN'), (_req, res) => res.sendStatus(204));
app.use((_err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => res.sendStatus(503));
const token = (payload: object = { userId, role: 'USER' }, options: SignOptions = {}) =>
  jwt.sign(payload, env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '1h', ...options });
const originalEnv = { ...env };

describe('JWT and current-user authorization regressions', () => {
  beforeEach(() => {
    jest.spyOn(User, 'findById').mockReturnValue({
      select: () => Promise.resolve({ _id: userId, role: 'USER', isActive: true }),
    } as never);
  });
  afterEach(() => {
    Object.assign(env, originalEnv);
    jest.restoreAllMocks();
  });

  it.each([
    ['missing', () => ''],
    ['malformed', () => 'Bearer abc.def.ghi'],
    ['invalid signature', () => `Bearer ${jwt.sign({ userId, role: 'USER' }, 'wrong-secret', { expiresIn: '1h' })}`],
    ['expired', () => `Bearer ${token(undefined, { expiresIn: '-1s' })}`],
    ['tampered payload', () => {
      const parts = token().split('.');
      parts[1] = Buffer.from(JSON.stringify({ userId, role: 'ADMIN', exp: 9999999999, iat: 1 })).toString('base64url');
      return `Bearer ${parts.join('.')}`;
    }],
    ['unsupported algorithm', () => `Bearer ${token(undefined, { algorithm: 'HS384' })}`],
    ['unsigned', () => `Bearer ${jwt.sign({ userId, role: 'USER' }, '', { algorithm: 'none' })}`],
    ['missing expiry', () => `Bearer ${jwt.sign({ userId, role: 'USER' }, env.JWT_SECRET)}`],
    ['missing issued-at', () => `Bearer ${token(undefined, { noTimestamp: true })}`],
    ['invalid identifier', () => `Bearer ${token({ userId: 'not-an-id', role: 'USER' })}`],
    ['invalid role', () => `Bearer ${token({ userId, role: 'SUPERADMIN' })}`],
    ['future issued-at', () => `Bearer ${token({ userId, role: 'USER', iat: Math.floor(Date.now() / 1000) + 3600 })}`],
    ['excessive lifetime', () => `Bearer ${token(undefined, { expiresIn: '30d' })}`],
    ['extra bearer data', () => `Bearer ${token()} extra`],
  ])('rejects %s without querying MongoDB', async (_name, authorization) => {
    const response = await request(app).get('/private').set('Authorization', authorization());
    expect(response.status).toBe(401);
    expect(User.findById).not.toHaveBeenCalled();
    expect(response.body).not.toHaveProperty('stack');
  });

  it.each(['USER', 'STUDENT'])('%s cannot access ADMIN routes even with a signed ADMIN claim', async (role) => {
    jest.mocked(User.findById).mockReturnValue({ select: () => Promise.resolve({ _id: userId, role }) } as never);
    expect((await request(app).get('/admin').set('Authorization', `Bearer ${token({ userId, role: 'ADMIN' })}`)).status).toBe(403);
  });
  it('revokes a stale ADMIN role after demotion', async () => {
    const adminToken = generateAccessToken(userId, 'ADMIN');
    jest.mocked(User.findById).mockReturnValueOnce({ select: () => Promise.resolve({ _id: userId, role: 'ADMIN' }) } as never);
    expect((await request(app).get('/admin').set('Authorization', `Bearer ${adminToken}`)).status).toBe(204);
    expect((await request(app).get('/admin').set('Authorization', `Bearer ${adminToken}`)).status).toBe(403);
  });
  it.each([null, { _id: userId, role: 'ADMIN', isActive: false }])('rejects deleted/disabled accounts: %j', async (user) => {
    jest.mocked(User.findById).mockReturnValue({ select: () => Promise.resolve(user) } as never);
    expect((await request(app).get('/private').set('Authorization', `Bearer ${token()}`)).status).toBe(401);
  });
  it('allows a legitimate user without the new optional account field', async () => {
    jest.mocked(User.findById).mockReturnValue({ select: () => Promise.resolve({ _id: userId, role: 'USER' }) } as never);
    const response = await request(app).get('/private').set('Authorization', `Bearer ${generateAccessToken(userId, 'USER')}`);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ userId, role: 'USER' });
  });
  it('fails closed on database outages', async () => {
    jest.mocked(User.findById).mockReturnValue({ select: () => Promise.reject(new Error('database unavailable')) } as never);
    expect((await request(app).get('/admin').set('Authorization', `Bearer ${token({ userId, role: 'ADMIN' })}`)).status).toBe(503);
  });
  it.each([
    {}, { issuer: 'another-app', audience: originalEnv.JWT_AUDIENCE },
    { issuer: originalEnv.JWT_ISSUER, audience: 'another-client' },
  ])('rejects missing/wrong production issuer or audience: %j', async (options) => {
    env.NODE_ENV = 'production';
    expect((await request(app).get('/private').set('Authorization', `Bearer ${token(undefined, options)}`)).status).toBe(401);
  });
  it('accepts correctly scoped production tokens and the configured lifetime', async () => {
    env.NODE_ENV = 'production';
    env.JWT_ACCESS_TOKEN_TTL_SECONDS = 28800;
    const accessToken = generateAccessToken(userId, 'USER');
    const decoded = jwt.decode(accessToken) as jwt.JwtPayload;
    expect(decoded.exp! - decoded.iat!).toBe(28800);
    expect(Object.keys(decoded).sort()).toEqual(['aud', 'exp', 'iat', 'iss', 'role', 'userId']);
    expect((await request(app).get('/private').set('Authorization', `Bearer ${accessToken}`)).status).toBe(200);
  });
});
