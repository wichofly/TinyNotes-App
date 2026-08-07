const defaultTestDatabaseUrl =
  'postgresql://tinynotes_test:tinynotes_test@127.0.0.1:5433/tinynotes_test';

export function configureTestEnvironment() {
  const databaseUrl = process.env.TEST_DATABASE_URL ?? defaultTestDatabaseUrl;
  const databaseName = new URL(databaseUrl).pathname.slice(1);

  if (databaseName !== 'tinynotes_test') {
    throw new Error('Tests may only connect to the tinynotes_test database.');
  }

  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = databaseUrl;
  process.env.BETTER_AUTH_SECRET = 'tinynotes-test-secret-at-least-32-characters';
  process.env.BETTER_AUTH_URL = 'http://127.0.0.1:3000';
  process.env.WEB_ORIGIN = 'http://127.0.0.1:5173';
  process.env.PUBLIC_APP_URL = 'http://127.0.0.1:5173';
  process.env.LOG_LEVEL = 'silent';
  process.env.TRUST_PROXY = 'false';
}
