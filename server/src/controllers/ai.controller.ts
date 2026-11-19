
import { Response } from 'express';
import { env } from '../config/env';
import { logError } from '../utils/log-error';

import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { improveProblemReport } from '../services/ai/problem-assistant.service';

export const improveProblemController = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      status: 'error',
      message: 'Authentication required',
    });
    return;
  }

  if (!env.AI_ENABLED) {
    res.status(503).json({ status: 'error', message: 'The AI assistant is unavailable. Please continue without AI.' });
    return;
  }

  try {
    const suggestion = await improveProblemReport({
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
    });

    res.status(200).json({
      status: 'success',
      message: 'Problem report improved successfully',
      data: suggestion,
    });
  } catch (error) {
    logError('AI problem assistant failed:', error);

    res.status(503).json({
      status: 'error',
      message:
        'The AI assistant is temporarily unavailable. Please try again or continue without AI.',
    });
  }
};
