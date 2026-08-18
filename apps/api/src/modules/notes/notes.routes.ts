import {
  createNoteSchema,
  noteIdSchema,
  shareTokenSchema,
  updateNoteSchema,
} from '@tinynotes/shared';
import { Router } from 'express';
import { requireSession } from '../../auth/middleware.js';
import * as service from './notes.service.js';

export const notesRouter = Router();

notesRouter.use(requireSession);

notesRouter.get('/', async (req, res) => {
  const notes = await service.listNotes(req.auth!.userId);
  res.json({ notes });
});

notesRouter.post('/', async (req, res) => {
  const input = createNoteSchema.parse(req.body);
  const note = await service.createNote(req.auth!.userId, input);
  res.status(201).json({ note });
});

notesRouter.get('/:noteId', async (req, res) => {
  const noteId = noteIdSchema.parse(req.params.noteId);
  const note = await service.getNote(noteId, req.auth!.userId);
  res.json({ note });
});

notesRouter.patch('/:noteId', async (req, res) => {
  const noteId = noteIdSchema.parse(req.params.noteId);
  const input = updateNoteSchema.parse(req.body);
  const note = await service.updateNote(noteId, req.auth!.userId, input);
  res.json({ note });
});

notesRouter.delete('/:noteId', async (req, res) => {
  const noteId = noteIdSchema.parse(req.params.noteId);
  await service.deleteNote(noteId, req.auth!.userId);
  res.status(204).end();
});

notesRouter.post('/:noteId/share', async (req, res) => {
  const noteId = noteIdSchema.parse(req.params.noteId);
  const share = await service.enableSharing(noteId, req.auth!.userId);
  res.json({ share });
});

notesRouter.delete('/:noteId/share', async (req, res) => {
  const noteId = noteIdSchema.parse(req.params.noteId);
  const share = await service.disableSharing(noteId, req.auth!.userId);
  res.json({ share });
});

export const publicNotesRouter = Router();

publicNotesRouter.get('/:shareToken', async (req, res) => {
  const shareToken = shareTokenSchema.parse(req.params.shareToken);
  const note = await service.getPublicNote(shareToken);
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  res.json({ note });
});
