import { drizzle } from 'drizzle-orm/node-postgres';
import pg, { type PoolClient } from 'pg';
import { env } from '../config/env';
import * as schema from './schema';

const instanceLockKeys: [number, number] = [1_414_090_329, 1_313_821_765];
let instanceLockClient: PoolClient | undefined;

export const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  max: env.NODE_ENV === 'test' ? 5 : 10,
});

export const db = drizzle(pool, { schema });

export async function acquireProductionInstanceLock(): Promise<void> {
  if (env.NODE_ENV !== 'production' || instanceLockClient) return;

  const client = await pool.connect();
  try {
    const result = await client.query<{ acquired: boolean }>(
      'SELECT pg_try_advisory_lock($1, $2) AS acquired',
      instanceLockKeys,
    );

    if (!result.rows[0]?.acquired) {
      throw new Error(
        'Another TinyNotes API instance is already using this database. ' +
          'The in-memory rate limiters require a single production instance.',
      );
    }

    instanceLockClient = client;
  } catch (error) {
    client.release();
    throw error;
  }
}

export async function closeDatabase(): Promise<void> {
  const client = instanceLockClient;
  instanceLockClient = undefined;

  if (client) {
    try {
      await client.query('SELECT pg_advisory_unlock($1, $2)', instanceLockKeys);
    } finally {
      client.release();
    }
  }

  await pool.end();
}
