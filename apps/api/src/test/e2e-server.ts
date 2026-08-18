import { configureTestEnvironment } from './test-env.js';

configureTestEnvironment();

const { prepareTestDatabase } = await import('./database.js');
await prepareTestDatabase();
await import('../server.js');
