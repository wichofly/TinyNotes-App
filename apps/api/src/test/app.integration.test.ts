import { emptyRichTextDocument } from '@tinynotes/shared';
import type { Express } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { configureTestEnvironment } from './test-env';

configureTestEnvironment();

type TestAgent = ReturnType<typeof request.agent>;

let app: Express;
let closeDatabase: (typeof import('../db/client'))['closeDatabase'];
let resetTestDatabase: (typeof import('./database'))['resetTestDatabase'];

beforeAll(async () => {
  const database = await import('./database');
  await database.prepareTestDatabase();
  resetTestDatabase = database.resetTestDatabase;
  ({ closeDatabase } = await import('../db/client'));
  const { createApp } = await import('../app');
  app = createApp();
});

beforeEach(async () => resetTestDatabase());
afterAll(async () => closeDatabase());

async function register(email: string): Promise<TestAgent> {
  const agent = request.agent(app);
  const response = await agent.post('/api/auth/sign-up/email').send({
    name: email.split('@')[0],
    email,
    password: 'learning-project-password',
  });
  expect(response.status).toBe(200);
  return agent;
}

async function createNote(agent: TestAgent, title = 'Integration note') {
  const response = await agent.post('/api/notes').send({
    title,
    content: emptyRichTextDocument,
  });
  expect(response.status).toBe(201);
  return response.body.note as { id: string; title: string };
}

describe('notes API', () => {
  it('requires authentication for private endpoints', async () => {
    const response = await request(app).get('/api/notes');
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('creates, lists, retrieves, and updates an owned note', async () => {
    const owner = await register('owner@example.com');
    const note = await createNote(owner);

    const list = await owner.get('/api/notes');
    expect(list.status).toBe(200);
    expect(list.body.notes).toHaveLength(1);
    expect(list.body.notes[0]).not.toHaveProperty('content');

    const retrieved = await owner.get(`/api/notes/${note.id}`);
    expect(retrieved.status).toBe(200);
    expect(retrieved.body.note.title).toBe('Integration note');

    const updated = await owner.patch(`/api/notes/${note.id}`).send({ title: 'Updated note' });
    expect(updated.status).toBe(200);
    expect(updated.body.note.title).toBe('Updated note');
  });

  it('hides an owned note from another user for reads, updates, and deletes', async () => {
    const owner = await register('owner@example.com');
    const other = await register('other@example.com');
    const note = await createNote(owner);

    expect((await other.get(`/api/notes/${note.id}`)).status).toBe(404);
    expect((await other.patch(`/api/notes/${note.id}`).send({ title: 'Stolen' })).status).toBe(404);
    expect((await other.delete(`/api/notes/${note.id}`)).status).toBe(404);

    const unchanged = await owner.get(`/api/notes/${note.id}`);
    expect(unchanged.status).toBe(200);
    expect(unchanged.body.note.title).toBe('Integration note');
  });

  it('rejects malformed and oversized rich-text documents', async () => {
    const owner = await register('owner@example.com');

    const malformed = await owner.post('/api/notes').send({
      title: 'Unsafe',
      content: { type: 'doc', content: [{ type: 'image' }] },
    });
    expect(malformed.status).toBe(400);
    expect(malformed.body.error.code).toBe('VALIDATION_ERROR');

    const oversized = await owner.post('/api/notes').send({
      title: 'Too large',
      content: { type: 'doc', content: [], padding: 'x'.repeat(204_800) },
    });
    expect(oversized.status).toBe(400);
    expect(oversized.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rotates public links when sharing is disabled and invalidates them on delete', async () => {
    const owner = await register('owner@example.com');
    const note = await createNote(owner, 'Shared note');

    const enabled = await owner.post(`/api/notes/${note.id}/share`);
    expect(enabled.status).toBe(200);
    const firstUrl = new URL(enabled.body.share.shareUrl as string);
    const firstToken = firstUrl.pathname.split('/').at(-1)!;

    const idempotent = await owner.post(`/api/notes/${note.id}/share`);
    expect(idempotent.body.share.shareUrl).toBe(enabled.body.share.shareUrl);
    expect((await request(app).get(`/api/public/notes/${firstToken}`)).status).toBe(200);

    expect((await owner.delete(`/api/notes/${note.id}/share`)).status).toBe(200);
    expect((await owner.delete(`/api/notes/${note.id}/share`)).status).toBe(200);
    expect((await request(app).get(`/api/public/notes/${firstToken}`)).status).toBe(404);

    const reenabled = await owner.post(`/api/notes/${note.id}/share`);
    const secondToken = new URL(reenabled.body.share.shareUrl as string).pathname
      .split('/')
      .at(-1)!;
    expect(secondToken).not.toBe(firstToken);

    expect((await owner.delete(`/api/notes/${note.id}`)).status).toBe(204);
    expect((await request(app).get(`/api/public/notes/${secondToken}`)).status).toBe(404);
  });
});
