import path from 'node:path';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { closeDatabase, db } from './client.js';

try {
  await migrate(db, {
    migrationsFolder: path.resolve(process.cwd(), 'src/db/migrations'),
  });
  process.stdout.write('Database migrations applied successfully.\n');
} finally {
  await closeDatabase();
}
