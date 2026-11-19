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


const nodeEnv = process.env.NODE_ENV || 'development';
if (!['development', 'test', 'production'].includes(nodeEnv)) {
  throw new Error('NODE_ENV must be development, test or production');
}
const production = nodeEnv === 'production';
const integerEnv = (key: string, fallback: number, min: number, max: number): number => {
  const raw = process.env[key];
  if (raw === undefined || raw === '') return fallback;
  if (!/^\d+$/.test(raw) || !Number.isSafeInteger(Number(raw)) || Number(raw) < min || Number(raw) > max) {
    throw new Error(`${key} must be an integer between ${min} and ${max}`);
  }
  return Number(raw);
};
const booleanEnv = (key: string, fallback: boolean): boolean => {
  const raw = process.env[key];
  if (raw === undefined || raw === '') return fallback;
  if (!['true', 'false'].includes(raw)) throw new Error(`${key} must be true or false`);
  return raw === 'true';
};
const jwtSecret = getEnv('JWT_SECRET');
const corsOrigin = process.env.CORS_ORIGIN?.trim() || '';
const ollamaBaseUrl = (
  process.env.OLLAMA_BASE_URL?.trim() || 'http://127.0.0.1:11434'
).replace(/\/+$/, '');

const isHttpOrigin = (value: string): boolean => {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) &&
      !url.username && !url.password && url.origin === value;
  } catch {
    return false;
  }
};

if (
  production &&
  (!corsOrigin || corsOrigin.split(',').some((origin) =>
    !isHttpOrigin(origin.trim()) || !origin.trim().startsWith('https://')
  ))
) {
  throw new Error('CORS_ORIGIN must contain explicit HTTP(S) origins in production');
}

if (!isHttpOrigin(ollamaBaseUrl)) {
  throw new Error('OLLAMA_BASE_URL must be an HTTP(S) origin');
}

if (
  production &&
  (Buffer.byteLength(jwtSecret, 'utf8') < 32 || new Set(jwtSecret).size < 12 ||
    /placeholder|replace|change.?me|example|test.?secret/i.test(jwtSecret))
) {
  throw new Error(
    'JWT_SECRET must be at least 32 bytes of randomly generated secret material in production'
  );
}

const mongodbUri = getEnv('MONGODB_URI');
if (!/^mongodb(?:\+srv)?:\/\/\S+$/.test(mongodbUri)) {
  throw new Error('MONGODB_URI must be a MongoDB connection URI');
}
const jwtIssuer = process.env.JWT_ISSUER?.trim() || (production ? '' : 'societal-platform');
const jwtAudience = process.env.JWT_AUDIENCE?.trim() || (production ? '' : 'societal-platform-web');
if (!jwtIssuer || !jwtAudience || jwtIssuer.length > 200 || jwtAudience.length > 200) {
  throw new Error('JWT_ISSUER and JWT_AUDIENCE must be set (maximum 200 characters)');
}
const trustProxy = process.env.TRUST_PROXY || 'false';
if (!['false', 'loopback'].includes(trustProxy)) {
  throw new Error('TRUST_PROXY must be false or loopback');
}
const host = process.env.HOST || (production ? '127.0.0.1' : '0.0.0.0');
if (!['127.0.0.1', '0.0.0.0', '::1'].includes(host) || (production && host === '0.0.0.0')) {
  throw new Error('HOST must be a supported bind address; production requires loopback');
}
const awsAccessKeyId = getEnv('AWS_ACCESS_KEY_ID', false);
const awsSecretAccessKey = getEnv('AWS_SECRET_ACCESS_KEY', false);
if (Boolean(awsAccessKeyId) !== Boolean(awsSecretAccessKey)) {
  throw new Error('AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be provided together or both omitted');
}
const awsRegion = getEnv('AWS_REGION');
const awsBucket = getEnv('AWS_S3_BUCKET_NAME');
if (!/^[a-z]{2}(?:-[a-z]+)+-\d+$/.test(awsRegion)) throw new Error('AWS_REGION is invalid');
if (!/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(awsBucket) || awsBucket.includes('..') || /^\d+\.\d+\.\d+\.\d+$/.test(awsBucket)) {
  throw new Error('AWS_S3_BUCKET_NAME is invalid');
}

export const env = {
  NODE_ENV:
    nodeEnv,

  PORT:
    integerEnv('PORT', 5000, 1, 65535),

  HOST: host,
  TRUST_PROXY: trustProxy === 'loopback' ? 'loopback' : false,

  MONGODB_URI:
    mongodbUri,

  OLLAMA_BASE_URL:
    ollamaBaseUrl,

  OLLAMA_MODEL:
    process.env.OLLAMA_MODEL?.trim() || 'llama3.1:8b',

  JWT_SECRET: jwtSecret,
  JWT_ISSUER: jwtIssuer,
  JWT_AUDIENCE: jwtAudience,
  JWT_ACCESS_TOKEN_TTL_SECONDS: integerEnv('JWT_ACCESS_TOKEN_TTL_SECONDS', production ? 28800 : 86400, 300, production ? 28800 : 86400),
  AI_ENABLED: booleanEnv('AI_ENABLED', !production),


  CORS_ORIGIN: corsOrigin,

  AWS_REGION: awsRegion,
  AWS_ACCESS_KEY_ID: awsAccessKeyId,
  AWS_SECRET_ACCESS_KEY: awsSecretAccessKey,
  AWS_SESSION_TOKEN: getEnv('AWS_SESSION_TOKEN', false),
  AWS_S3_BUCKET_NAME: awsBucket,

};
