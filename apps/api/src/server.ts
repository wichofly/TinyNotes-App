import { createApp } from './app';
import { env } from './config/env';
import { acquireProductionInstanceLock, closeDatabase } from './db/client';
import { logger } from './lib/logger';

await acquireProductionInstanceLock();

const app = createApp();
const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'TinyNotes API listening');
});

async function shutdown(signal: string) {
  logger.info({ signal }, 'Shutting down');
  server.close(async () => {
    await closeDatabase();
    process.exit(0);
  });
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
