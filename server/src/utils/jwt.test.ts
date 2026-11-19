
import jwt from 'jsonwebtoken';
import { generateAccessToken } from './jwt';

describe('JWT access token', () => {
  const userId = '507f1f77bcf86cd799439011';
  const role = 'USER';

  it('signs tokens using HS256', () => {
    const token = generateAccessToken(userId, role);

    const decoded = jwt.decode(token, { complete: true });

    expect(decoded?.header.alg).toBe('HS256');
  });

  it('sets access token expiry to one day', () => {
    const token = generateAccessToken(userId, role);
    const decoded = jwt.decode(token);

    expect(decoded).toMatchObject({
      userId,
      role,
    });

    if (
      typeof decoded !== 'object' ||
      decoded === null ||
      typeof decoded.iat !== 'number' ||
      typeof decoded.exp !== 'number'
    ) {
      throw new Error('Token timestamps are missing');
    }

    expect(decoded.exp - decoded.iat).toBe(24 * 60 * 60);
  });

  it('verifies tokens using the configured secret', () => {
    const token = generateAccessToken(userId, role);

    expect(() =>
      jwt.verify(token, 'incorrect-test-secret')
    ).toThrow();
  });
});
