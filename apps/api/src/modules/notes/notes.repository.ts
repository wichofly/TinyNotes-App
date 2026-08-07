import type { CreateNoteInput, RichTextNode, UpdateNoteInput } from '@tinynotes/shared';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { notes, type NoteRow } from '../../db/schema';

export async function listOwnedNotes(userId: string) {
  return db
    .select({
      id: notes.id,
      title: notes.title,
      isPublic: notes.isPublic,
      createdAt: notes.createdAt,
      updatedAt: notes.updatedAt,
    })
    .from(notes)
    .where(eq(notes.userId, userId))
    .orderBy(desc(notes.updatedAt))
    .limit(100);
}

export async function findOwnedNote(noteId: string, userId: string) {
  const [note] = await db
    .select()
    .from(notes)
    .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
    .limit(1);
  return note;
}

export async function insertNote(userId: string, input: CreateNoteInput) {
  const [note] = await db
    .insert(notes)
    .values({ userId, title: input.title, content: input.content })
    .returning();
  return note;
}

export async function updateOwnedNote(noteId: string, userId: string, input: UpdateNoteInput) {
  const changes: { title?: string; content?: RichTextNode; updatedAt: Date } = {
    updatedAt: new Date(),
  };
  if (input.title !== undefined) changes.title = input.title;
  if (input.content !== undefined) changes.content = input.content;

  const [note] = await db
    .update(notes)
    .set(changes)
    .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
    .returning();
  return note;
}

export async function deleteOwnedNote(noteId: string, userId: string) {
  const [deleted] = await db
    .delete(notes)
    .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
    .returning({ id: notes.id });
  return deleted;
}

export async function publishPrivateNote(noteId: string, userId: string, shareToken: string) {
  const [note] = await db
    .update(notes)
    .set({ isPublic: true, shareToken, publishedAt: new Date() })
    .where(and(eq(notes.id, noteId), eq(notes.userId, userId), eq(notes.isPublic, false)))
    .returning();
  return note;
}

export async function unpublishOwnedNote(noteId: string, userId: string) {
  const [note] = await db
    .update(notes)
    .set({ isPublic: false, shareToken: null, publishedAt: null })
    .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
    .returning();
  return note;
}

export async function findPublicNote(shareToken: string) {
  const [note] = await db
    .select({
      title: notes.title,
      content: notes.content,
      publishedAt: notes.publishedAt,
      updatedAt: notes.updatedAt,
    })
    .from(notes)
    .where(and(eq(notes.shareToken, shareToken), eq(notes.isPublic, true)))
    .limit(1);
  return note;
}

export type OwnedNoteRow = NoteRow;
