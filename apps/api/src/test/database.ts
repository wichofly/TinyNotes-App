import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sql } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

export async function prepareTestDatabase() {
  const { db } = await import('../db/client.js');
  const migrationsFolder = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../db/migrations',
  );
  await migrate(db, { migrationsFolder });
  await resetTestDatabase();
}

export async function resetTestDatabase() {
  const { db } = await import('../db/client.js');
  await db.execute(
    sql`truncate table "notes", "session", "account", "verification", "user" restart identity cascade`,
  );
}
