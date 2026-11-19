import jwt from 'jsonwebtoken';
import request from 'supertest';

import app from '../src/app';
import User from '../src/models/user.model';
import * as assistantService from '../src/services/ai/problem-assistant.service';
import { env } from '../src/config/env';

describe('AI problem improvement route', () => {
  const userId = '507f1f77bcf86cd799439011';
  const token = jwt.sign(
    { userId, role: 'USER' },
    process.env.JWT_SECRET as string,
    { expiresIn: '1h' }
  );

  beforeEach(() => {
    jest.spyOn(User, 'findById').mockImplementation((() => {
      const query = {
        select: () => query,
        then: (
          resolve: (value: unknown) => unknown,
          reject?: (reason: unknown) => unknown
        ) => Promise.resolve({ _id: userId, role: 'USER' })
          .then(resolve, reject),
      };

      return query;
    }) as never);
  });

  afterEach(() => {
    env.AI_ENABLED = true;
    jest.restoreAllMocks();
  });
  it('does not contact Ollama when the production feature flag is off', async () => {
    env.AI_ENABLED = false;
    const provider = jest.spyOn(assistantService, 'improveProblemReport');
    const response = await request(app).post('/api/ai/improve-problem')
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'Several streetlights near the community park are not working.' });
    expect(response.status).toBe(503);
    expect(response.body.message).toMatch(/continue without AI/i);
    expect(provider).not.toHaveBeenCalled();
  });

  it('requires authentication', async () => {
    const response = await request(app)
      .post('/api/ai/improve-problem')
      .send({ description: 'A sufficiently detailed problem description.' });

    expect(response.status).toBe(401);
  });

  it('rejects descriptions below the minimum length', async () => {
    const serviceSpy = jest.spyOn(
      assistantService,
      'improveProblemReport'
    );

    const response = await request(app)
      .post('/api/ai/improve-problem')
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'Too short' });

    expect(response.status).toBe(400);
    expect(serviceSpy).not.toHaveBeenCalled();
  });

  it('returns a valid improvement suggestion', async () => {
    jest.spyOn(
      assistantService,
      'improveProblemReport'
    ).mockResolvedValue({
      title: 'Broken streetlights near community park',
      description:
        'Several streetlights near the community park are not working after dark.',
      category: 'INFRASTRUCTURE',
    });

    const response = await request(app)
      .post('/api/ai/improve-problem')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Broken lights',
        description:
          'Several streetlights near the community park are not working after dark.',
      });

    expect(response.status).toBe(200);
    expect(response.body.data.category).toBe('INFRASTRUCTURE');
  });

  it('keeps manual reporting available when Ollama fails', async () => {
    jest.spyOn(
      assistantService,
      'improveProblemReport'
    ).mockRejectedValue(new Error('Ollama unavailable'));

    const response = await request(app)
      .post('/api/ai/improve-problem')
      .set('Authorization', `Bearer ${token}`)
      .send({
        description:
          'Several streetlights near the community park are not working after dark.',
      });

    expect(response.status).toBe(503);
    expect(response.body.message).toMatch(/continue without AI/i);
  });
});
