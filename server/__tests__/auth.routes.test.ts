import request from 'supertest';

import app from '../src/app';
import * as authService from '../src/services/auth.service';

describe('Authentication API routes', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('registers a valid user without returning a password', async () => {
    jest.spyOn(authService, 'registerUser').mockResolvedValue({
      id: '507f1f77bcf86cd799439011' as never,
      name: 'Test Citizen',
      email: 'citizen@example.com',
      role: 'USER',
      isVerified: false,
    });

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Citizen',
        email: 'Citizen@Example.com',
        password: 'secure-password',
      });

    expect(response.status).toBe(201);
    expect(response.body.data).not.toHaveProperty('password');
    expect(authService.registerUser).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'citizen@example.com' })
    );
  });

  it('rejects duplicate registration', async () => {
    jest.spyOn(authService, 'registerUser').mockRejectedValue(
      new Error('USER_ALREADY_EXISTS')
    );

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Citizen',
        email: 'citizen@example.com',
        password: 'secure-password',
      });

    expect(response.status).toBe(409);
  });

  it('rejects invalid registration payloads', async () => {
    const serviceSpy = jest.spyOn(authService, 'registerUser');

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'T',
        email: 'not-an-email',
        password: 'short',
      });

    expect(response.status).toBe(400);
    expect(serviceSpy).not.toHaveBeenCalled();
  });

  it('logs in with valid credentials', async () => {
    jest.spyOn(authService, 'loginUser').mockResolvedValue({
      accessToken: 'test-token',
      user: {
        id: '507f1f77bcf86cd799439011' as never,
        name: 'Test Citizen',
        email: 'citizen@example.com',
        role: 'USER',
        isVerified: false,
      },
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'citizen@example.com',
        password: 'secure-password',
      });

    expect(response.status).toBe(200);
    expect(response.body.data.accessToken).toBe('test-token');
    expect(response.body.data.user).not.toHaveProperty('password');
  });

  it('returns 401 for invalid credentials', async () => {
    jest.spyOn(authService, 'loginUser').mockRejectedValue(
      new Error('INVALID_CREDENTIALS')
    );

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'citizen@example.com',
        password: 'wrong-password',
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid email or password');
  });

  it('rejects invalid login payloads before calling the service', async () => {
    const serviceSpy = jest.spyOn(authService, 'loginUser');

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'not-an-email',
        password: '',
      });

    expect(response.status).toBe(400);
    expect(serviceSpy).not.toHaveBeenCalled();
  });
});
