
import { env } from './config/env';


import app from './app';
import { connectDatabase } from './config/database';

const PORT = env.PORT;
const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();

    app.listen(PORT, () => {
      console.log(
        `Server running in ${env.NODE_ENV || 'development'} mode on port ${PORT}`
      );
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();


