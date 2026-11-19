describe('release environment validation', () => {
  jest.mock('dotenv', () => ({ config: jest.fn() }));
  const original = { ...process.env };

  beforeEach(() => {
    delete process.env.PORT;
    delete process.env.HOST;
    delete process.env.AI_ENABLED;
    delete process.env.JWT_ACCESS_TOKEN_TTL_SECONDS;
    delete process.env.TRUST_PROXY;
    process.env.JWT_ISSUER = 'societal-platform';
    process.env.JWT_AUDIENCE = 'societal-platform-web';
  });

  afterEach(() => {
    process.env = { ...original };
    jest.resetModules();
  });

  const loadEnv = () => {
    jest.resetModules();
    return require('./env').env;
  };

  it('normalizes local Ollama configuration', () => {
    process.env.OLLAMA_BASE_URL = ' http://127.0.0.1:11434/ ';
    process.env.OLLAMA_MODEL = ' local-test-model ';
    expect(loadEnv()).toMatchObject({
      OLLAMA_BASE_URL: 'http://127.0.0.1:11434',
      OLLAMA_MODEL: 'local-test-model',
    });
  });

  it('rejects unsupported Ollama protocols', () => {
    process.env.OLLAMA_BASE_URL = 'file:///tmp/ollama';
    expect(loadEnv).toThrow('OLLAMA_BASE_URL must be an HTTP(S) origin');
  });

  it.each(['', '*', 'https://web.example/app', 'https://web.example, *'])(
    'rejects unsafe or missing production CORS configuration: %s', (origin) => {
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = 'c0acb8ef14372659da8059e81d1673bdbf564ab874f26ec523d98670ce125a94';
      process.env.CORS_ORIGIN = origin;
      expect(loadEnv).toThrow('CORS_ORIGIN must contain explicit HTTP(S) origins');
    }
  );

  it('accepts multiple explicit production frontend origins', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'c0acb8ef14372659da8059e81d1673bdbf564ab874f26ec523d98670ce125a94';
    process.env.CORS_ORIGIN = 'https://web.example, https://admin.example';
    expect(loadEnv().CORS_ORIGIN).toBe('https://web.example, https://admin.example');
  });

  it.each(['0', '-1', '1.2', '65536', '5000abc', ' '])('rejects invalid PORT %s', (port) => {
    process.env.PORT = port;
    expect(loadEnv).toThrow('PORT must be an integer');
  });
  it('rejects invalid NODE_ENV', () => {
    process.env.NODE_ENV = 'prod';
    expect(loadEnv).toThrow('NODE_ENV must be');
  });
  it.each(['true', '1', '*', '0.0.0.0/0'])('rejects unrestricted trust proxy %s', (value) => {
    process.env.TRUST_PROXY = value;
    expect(loadEnv).toThrow('TRUST_PROXY must be');
  });
  it('allows EC2 instance-role credentials and temporary local credentials', () => {
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECRET_ACCESS_KEY;
    expect(loadEnv().AWS_ACCESS_KEY_ID).toBe('');
    process.env.AWS_ACCESS_KEY_ID = 'test-key';
    expect(loadEnv).toThrow('must be provided together');
    process.env.AWS_SECRET_ACCESS_KEY = 'test-secret';
    process.env.AWS_SESSION_TOKEN = 'test-session';
    expect(loadEnv().AWS_SESSION_TOKEN).toBe('test-session');
  });
  it.each(['short', 'a'.repeat(64), 'replace-with-a-long-production-secret-value'])('rejects weak production secrets', (secret) => {
    process.env.NODE_ENV = 'production';
    process.env.CORS_ORIGIN = 'https://web.example';
    process.env.JWT_SECRET = secret;
    expect(loadEnv).toThrow('JWT_SECRET must be');
  });
  it('requires production scope and rejects an excessive token lifetime', () => {
    process.env.NODE_ENV = 'production';
    process.env.CORS_ORIGIN = 'https://web.example';
    process.env.JWT_SECRET = 'c0acb8ef14372659da8059e81d1673bdbf564ab874f26ec523d98670ce125a94';
    delete process.env.JWT_ISSUER;
    expect(loadEnv).toThrow('JWT_ISSUER and JWT_AUDIENCE must be set');
    process.env.JWT_ISSUER = 'societal-platform';
    process.env.JWT_ACCESS_TOKEN_TTL_SECONDS = '86400';
    expect(loadEnv).toThrow('JWT_ACCESS_TOKEN_TTL_SECONDS must be');
    delete process.env.JWT_ACCESS_TOKEN_TTL_SECONDS;
    expect(loadEnv()).toMatchObject({ JWT_ACCESS_TOKEN_TTL_SECONDS: 28800, AI_ENABLED: false, HOST: '127.0.0.1' });
  });
  it('rejects HTTP CORS and public API binding in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'c0acb8ef14372659da8059e81d1673bdbf564ab874f26ec523d98670ce125a94';
    process.env.CORS_ORIGIN = 'http://web.example';
    expect(loadEnv).toThrow('CORS_ORIGIN must contain');
    process.env.CORS_ORIGIN = 'https://web.example';
    process.env.HOST = '0.0.0.0';
    expect(loadEnv).toThrow('production requires loopback');
  });
  it.each(['yes', '1'])('rejects invalid AI flag %s', (flag) => {
    process.env.AI_ENABLED = flag;
    expect(loadEnv).toThrow('AI_ENABLED must be');
  });
});
