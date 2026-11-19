process.env.NODE_ENV = 'test';
process.env.AI_ENABLED = 'true';
process.env.TRUST_PROXY = 'false';
process.env.JWT_ISSUER = 'societal-platform';
process.env.JWT_AUDIENCE = 'societal-platform-web';

process.env.MONGODB_URI =
    'mongodb://127.0.0.1:27017/societal_platform_test';

process.env.JWT_SECRET =
    'test-only-secret-for-jest';

process.env.AWS_REGION = 'ap-south-1';
process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
process.env.AWS_S3_BUCKET_NAME = 'test-bucket';
