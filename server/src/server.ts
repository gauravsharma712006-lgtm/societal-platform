
import { env } from './config/env';


import app from './app';
import { connectDatabase } from './config/database';
import mongoose from 'mongoose';
import { Server } from 'http';
import { logError } from './utils/log-error';

const PORT = env.PORT;
let server: Server | undefined;
let stopping = false;

const shutdown = async (exitCode: number): Promise<void> => {
  if (stopping) return;
  stopping = true;
  console.log('Stopping API');
  const deadline = setTimeout(() => {
    server?.closeAllConnections();
    process.exit(1);
  }, 15_000);
  deadline.unref();
  try {
    if (server?.listening) {
      await new Promise<void>((resolve, reject) => server!.close((error) => error ? reject(error) : resolve()));
    }
    await mongoose.disconnect();
    clearTimeout(deadline);
    process.exit(exitCode);
  } catch (error) {
    logError('API shutdown failed', error);
    process.exit(1);
  }
};

process.once('SIGTERM', () => { void shutdown(0); });
process.once('SIGINT', () => { void shutdown(0); });
process.once('uncaughtException', (error) => { logError('Uncaught exception', error); void shutdown(1); });
process.once('unhandledRejection', (error) => { logError('Unhandled rejection', error); void shutdown(1); });
const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();

    if (stopping) return;
    server = app.listen(PORT, env.HOST, () => {
      console.log(
        `Server running in ${env.NODE_ENV || 'development'} mode on port ${PORT}`
      );
    });
    server.requestTimeout = 90_000;
    server.headersTimeout = 15_000;
    server.keepAliveTimeout = 5_000;
    server.on('error', (error) => { logError('HTTP server failed', error); void shutdown(1); });
  } catch (error) {
    logError('Failed to start server', error);
    await shutdown(1);
  }
};

startServer();


