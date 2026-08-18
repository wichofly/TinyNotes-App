import app from './app.js';
import { env } from './config/env.js';
import { acquireProductionInstanceLock, closeDatabase } from './db/client.js';
import { logger } from './lib/logger.js';

const isVercelRuntime = process.env.VERCEL === '1';

if (!isVercelRuntime) {
  await acquireProductionInstanceLock();

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
}

export default app;
