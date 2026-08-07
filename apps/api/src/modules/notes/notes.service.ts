import type { CreateNoteInput, UpdateNoteInput } from '@tinynotes/shared';
import { env } from '../../config/env';
import { createShareToken } from '../../lib/share-token';
import { AppError } from '../../middleware/app-error';
import { createShareUrl, toNoteListItem, toOwnedNote, toPublicNote } from './notes.mapper';
import * as repository from './notes.repository';

function notFound(): never {
  throw new AppError(404, 'NOT_FOUND', 'The requested note was not found.');
}

function isUniqueViolation(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';
}

export async function listNotes(userId: string) {
  const rows = await repository.listOwnedNotes(userId);
  return rows.map(toNoteListItem);
}

export async function getNote(noteId: string, userId: string) {
  const note = await repository.findOwnedNote(noteId, userId);
  if (!note) return notFound();
  return toOwnedNote(note, env.PUBLIC_APP_URL);
}

export async function createNote(userId: string, input: CreateNoteInput) {
  const note = await repository.insertNote(userId, input);
  if (!note) throw new Error('The database did not return the created note.');
  return toOwnedNote(note, env.PUBLIC_APP_URL);
}

export async function updateNote(noteId: string, userId: string, input: UpdateNoteInput) {
  const note = await repository.updateOwnedNote(noteId, userId, input);
  if (!note) return notFound();
  return toOwnedNote(note, env.PUBLIC_APP_URL);
}

export async function deleteNote(noteId: string, userId: string) {
  const deleted = await repository.deleteOwnedNote(noteId, userId);
  if (!deleted) return notFound();
}

export async function enableSharing(noteId: string, userId: string) {
  const existing = await repository.findOwnedNote(noteId, userId);
  if (!existing) return notFound();
  if (existing.isPublic && existing.shareToken) {
    return {
      isPublic: true as const,
      shareUrl: createShareUrl(existing.shareToken, env.PUBLIC_APP_URL)!,
    };
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const published = await repository.publishPrivateNote(noteId, userId, createShareToken());
      if (published?.shareToken) {
        return {
          isPublic: true as const,
          shareUrl: createShareUrl(published.shareToken, env.PUBLIC_APP_URL)!,
        };
      }

      // A concurrent request may have published the note first.
      const current = await repository.findOwnedNote(noteId, userId);
      if (!current) return notFound();
      if (current.isPublic && current.shareToken) {
        return {
          isPublic: true as const,
          shareUrl: createShareUrl(current.shareToken, env.PUBLIC_APP_URL)!,
        };
      }
    } catch (error) {
      if (!isUniqueViolation(error) || attempt === 2) throw error;
    }
  }

  throw new AppError(409, 'CONFLICT', 'Public sharing could not be enabled. Try again.');
}

export async function disableSharing(noteId: string, userId: string) {
  const note = await repository.unpublishOwnedNote(noteId, userId);
  if (!note) return notFound();
  return { isPublic: false as const, shareUrl: null };
}

export async function getPublicNote(shareToken: string) {
  const note = await repository.findPublicNote(shareToken);
  if (!note) return notFound();
  return toPublicNote(note);
}
