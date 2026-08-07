import { configureTestEnvironment } from './test-env';

configureTestEnvironment();

const { prepareTestDatabase } = await import('./database');
await prepareTestDatabase();
await import('../server');
