import dotenv from 'dotenv';

dotenv.config();

const getEnv = (
  key: string,
  required = true
): string => {
  const value = process.env[key];

  if (!value && required) {
    throw new Error(
      `${key} is not defined`
    );
  }

  return value || '';
};

export const env = {
  NODE_ENV:
    process.env.NODE_ENV || 'development',

  PORT:
    Number(process.env.PORT) || 5000,

  MONGODB_URI:
    getEnv('MONGODB_URI'),

  JWT_SECRET:

    getEnv('JWT_SECRET'),

  CORS_ORIGIN:
    process.env.CORS_ORIGIN || '*',



  AWS_REGION: getEnv('AWS_REGION'),
  AWS_ACCESS_KEY_ID: getEnv('AWS_ACCESS_KEY_ID'),
  AWS_SECRET_ACCESS_KEY: getEnv('AWS_SECRET_ACCESS_KEY'),
  AWS_S3_BUCKET_NAME: getEnv('AWS_S3_BUCKET_NAME'),
};