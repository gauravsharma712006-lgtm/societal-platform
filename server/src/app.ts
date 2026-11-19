import express, {
  Application,
  Request,
  Response,
  NextFunction,
} from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import problemRoutes from './routes/problem.routes';
import mediaRoutes from './routes/media.routes';
import challengeRoutes from './routes/challenge.routes';
import teamRoutes from './routes/team.routes';
import applicationRoutes from './routes/application.routes';
import solutionRoutes from './routes/solution.routes';
import teamInvitationRoutes from './routes/team-invitation.routes';
import aiRoutes from './routes/ai.routes';
import categoryRoutes from './routes/category.routes';
import { env } from './config/env';
import mongoose from 'mongoose';
import { logError } from './utils/log-error';
import { createAuthRateLimit } from './middleware/auth-rate-limit.middleware';


const app: Application = express();
app.set('trust proxy', env.TRUST_PROXY);
app.disable('x-powered-by');

// Security
app.use(helmet());
app.use('/api', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});
// Count malformed/oversized requests too, before body parsing.
app.use('/api/auth/login', createAuthRateLimit(20));
app.use('/api/auth/register', createAuthRateLimit(10));

// CORS

 // CORS
const configuredOrigins = env.CORS_ORIGIN
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: configuredOrigins?.length
      ? configuredOrigins
      : process.env.NODE_ENV === 'production'
        ? false
        : '*',
  })
);




// Body parsing
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb', parameterLimit: 100 }));

// HTTP request logging
morgan.token('safe-path', (req) => (req as Request).originalUrl?.split('?')[0] || req.url?.split('?')[0] || '/');
app.use(morgan(':method :safe-path :status :res[content-length] - :response-time ms'));

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    message: 'Societal Platform API is running',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/ready', (_req: Request, res: Response) => {
  const ready = mongoose.connection.readyState === 1;
  res.status(ready ? 200 : 503).json({ status: ready ? 'ok' : 'unavailable' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/team-invitations',teamInvitationRoutes);
app.use('/api/solutions', solutionRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/categories', categoryRoutes);



// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
  });
});


// Global error handler
app.use(
  (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const requestError = err as Error & { type?: string };
    const status = requestError.type === 'entity.parse.failed'
      ? 400
      : requestError.type === 'entity.too.large'
        ? 413
        : 500;

    if (status === 500) {
      logError('Unhandled request error', err);
    }

    res.status(status).json({
      status: 'error',
      message: status === 400
        ? 'Invalid JSON request body'
        : status === 413
          ? 'Request body is too large'
          : 'Internal Server Error',
    });
  }
);

export default app;
