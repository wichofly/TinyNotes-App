import type { NoteListItem, OwnedNote, PublicNote } from '@tinynotes/shared';
import type { OwnedNoteRow } from './notes.repository.js';

export function createShareUrl(token: string | null, publicAppUrl: string) {
  if (!token) return null;
  return new URL(`/s/${token}`, publicAppUrl).toString();
}

export function toNoteListItem(note: {
  id: string;
  title: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}): NoteListItem {
  return {
    id: note.id,
    title: note.title,
    isPublic: note.isPublic,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  };
}

export function toOwnedNote(note: OwnedNoteRow, publicAppUrl: string): OwnedNote {
  return {
    ...toNoteListItem(note),
    content: note.content,
    shareUrl: note.isPublic ? createShareUrl(note.shareToken, publicAppUrl) : null,
  };
}

export function toPublicNote(note: {
  title: string;
  content: OwnedNoteRow['content'];
  publishedAt: Date | null;
  updatedAt: Date;
}): PublicNote {
  if (!note.publishedAt) throw new Error('A public note must have a published timestamp.');
  return {
    title: note.title,
    content: note.content,
    publishedAt: note.publishedAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  };
}
