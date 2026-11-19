import mongoose from 'mongoose';

import { env } from './env';

export const connectDatabase = async (): Promise<void> => {
  try {


    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10_000,
      autoIndex: env.NODE_ENV !== 'production',
    });

    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed');

    throw error;
  }


};
