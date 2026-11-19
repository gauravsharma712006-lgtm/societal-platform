import bcrypt from 'bcrypt';
import User from '../models/user.model';
import { loginUser, registerUser } from './auth.service';
import { registerSchema, loginSchema } from '../validators/auth.validator';
import { logError } from '../utils/log-error';

describe('password and account security', () => {
  afterEach(() => jest.restoreAllMocks());
  it.each([['a'.repeat(72), true], ['a'.repeat(73), false], ['界'.repeat(24), true], ['界'.repeat(25), false]])(
    'enforces the bcrypt byte boundary for %s', (password, accepted) => {
      expect(registerSchema.safeParse({ name: 'Citizen', email: 'test@example.com', password }).success).toBe(accepted);
    }
  );
  it('requires stronger new passwords while accepting legacy login input', () => {
    expect(registerSchema.safeParse({ name: 'Citizen', email: 'test@example.com', password: 'sixsix' }).success).toBe(false);
    expect(loginSchema.safeParse({ email: 'test@example.com', password: 'old' }).success).toBe(true);
    expect(loginSchema.safeParse({ email: 'test@example.com', password: 'a'.repeat(100) }).success).toBe(true);
  });
  it('does bcrypt work for unknown accounts and returns the same credential error', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue(null);
    const compare = jest.spyOn(bcrypt, 'compare');
    await expect(loginUser({ email: 'missing@example.com', password: 'wrong' })).rejects.toThrow('INVALID_CREDENTIALS');
    expect(compare).toHaveBeenCalledTimes(1);
  });
  it('rejects disabled accounts even with a valid bcrypt password', async () => {
    const password = await bcrypt.hash('existing-password', 12);
    jest.spyOn(User, 'findOne').mockResolvedValue({ password, isActive: false } as never);
    await expect(loginUser({ email: 'disabled@example.com', password: 'existing-password' })).rejects.toThrow('INVALID_CREDENTIALS');
  });
  it('keeps legitimate legacy passwords usable and returns no hash', async () => {
    const password = await bcrypt.hash('legacy', 12);
    jest.spyOn(User, 'findOne').mockResolvedValue({ _id: '507f1f77bcf86cd799439011', password, name: 'Citizen', email: 'test@example.com', role: 'USER', isVerified: false } as never);
    const result = await loginUser({ email: 'test@example.com', password: 'legacy' });
    expect(result.accessToken).toEqual(expect.any(String));
    expect(result.user).not.toHaveProperty('password');
  });
  it('ignores client role/activation fields at registration', async () => {
    const input = registerSchema.parse({ name: 'Citizen', email: 'test@example.com', password: 'strong-password', role: 'ADMIN', isActive: true });
    jest.spyOn(User, 'findOne').mockResolvedValue(null);
    const create = jest.spyOn(User, 'create').mockResolvedValue({ _id: '507f1f77bcf86cd799439011', name: input.name, email: input.email, role: 'USER', isVerified: false } as never);
    await registerUser(input);
    expect(create).toHaveBeenCalledWith({ name: input.name, email: input.email, password: expect.stringMatching(/^\$2[ab]\$12\$/) });
  });
  it('never logs sensitive error messages or attached documents', () => {
    const output = jest.spyOn(console, 'error').mockImplementation(() => {});
    logError('Authentication failed', Object.assign(new Error('password=private-value'), { document: { password: 'hash' } }));
    expect(output).toHaveBeenCalledWith({ event: 'Authentication failed', errorType: 'Error' });
  });
});
