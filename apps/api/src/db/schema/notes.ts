import type { RichTextNode } from '@tinynotes/shared';
import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  jsonb,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { user } from './auth.js';

export const notes = pgTable(
  'notes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: varchar('user_id', { length: 255 })
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 120 }).notNull(),
    content: jsonb('content').$type<RichTextNode>().notNull(),
    shareToken: varchar('share_token', { length: 64 }),
    isPublic: boolean('is_public').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    publishedAt: timestamp('published_at', { withTimezone: true }),
  },
  (table) => [
    index('notes_user_updated_idx').on(table.userId, table.updatedAt.desc()),
    uniqueIndex('notes_share_token_unique')
      .on(table.shareToken)
      .where(sql`${table.shareToken} is not null`),
    check(
      'notes_public_state_check',
      sql`(${table.isPublic} = true AND ${table.shareToken} IS NOT NULL AND ${table.publishedAt} IS NOT NULL)
        OR (${table.isPublic} = false AND ${table.shareToken} IS NULL AND ${table.publishedAt} IS NULL)`,
    ),
  ],
);

export type NoteRow = typeof notes.$inferSelect;
