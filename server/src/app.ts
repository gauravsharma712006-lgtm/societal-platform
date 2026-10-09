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
import teamInvitationRoutes from './routes/team-invitation.routes';


const app: Application = express();

// Security
app.use(helmet());

// CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
  })
);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP request logging
app.use(morgan('dev'));

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    message: 'Societal Platform API is running',
    timestamp: new Date().toISOString(),
  });
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



// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.method} ${req.originalUrl} not found`,
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
    console.error(err.stack);

    res.status(500).json({
      status: 'error',
      message: 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && {
        error: err.message,
      }),
    });
  }
);

export default app;