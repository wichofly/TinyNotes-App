import { createApp } from './app';
import { env } from './config/env';
import { acquireProductionInstanceLock, closeDatabase } from './db/client';
import { logger } from './lib/logger';

await acquireProductionInstanceLock();

const app = createApp();
const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'TinyNotes API listening');
});
let shutdownStarted = false;

async function shutdown(signal: string) {
  if (shutdownStarted) return;
  shutdownStarted = true;
  logger.info({ signal }, 'Shutting down');
  server.close(async (serverError) => {
    try {
      if (serverError) throw serverError;
      await closeDatabase();
    } catch (error) {
      process.exitCode = 1;
      logger.error({ err: error }, 'Shutdown failed');
    } finally {
      process.exit();
    }
  });
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
