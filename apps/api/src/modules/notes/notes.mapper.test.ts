import type { NoteRow } from '../../db/schema';
import { describe, expect, it } from 'vitest';
import { toOwnedNote } from './notes.mapper';

describe('toOwnedNote', () => {
  it('maps explicit public DTO fields without owner data', () => {
    const now = new Date('2026-08-06T18:00:00.000Z');
    const row: NoteRow = {
      id: 'ac061a4d-e181-4ca9-8f96-fb595e9fae5d',
      userId: 'private-user-id',
      title: 'A note',
      content: { type: 'doc', content: [] },
      shareToken: null,
      isPublic: false,
      createdAt: now,
      updatedAt: now,
      publishedAt: null,
    };

    expect(toOwnedNote(row, 'http://localhost:5173')).toEqual({
      id: row.id,
      title: row.title,
      content: row.content,
      isPublic: false,
      shareUrl: null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
  });
});
