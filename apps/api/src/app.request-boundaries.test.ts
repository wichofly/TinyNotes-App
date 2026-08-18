import type { Express } from 'express';
import request from 'supertest';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { configureTestEnvironment } from './test/test-env.js';

configureTestEnvironment();

let app: Express;
let exportedApp: Express;
let logger: (typeof import('./lib/logger.js'))['logger'];

beforeAll(async () => {
  ({ logger } = await import('./lib/logger.js'));
  const { createApp, default: defaultApp } = await import('./app.js');
  exportedApp = defaultApp;
  app = createApp();
});

describe('Vercel entrypoint', () => {
  it('exports the Express application as the default module value', () => {
    expect(typeof exportedApp).toBe('function');
  });
});

describe('request body boundaries', () => {
  it('rejects an oversized authentication body before Better Auth reads it', async () => {
    const response = await request(app)
      .post('/api/auth/sign-in/email')
      .send({ email: 'reader@example.com', password: 'x'.repeat(40 * 1024) });

    expect(response.status).toBe(413);
    expect(response.body).toEqual({
      error: { code: 'VALIDATION_ERROR', message: 'The request body is too large.' },
    });
  });

  it('returns a client error without logging malformed JSON content', async () => {
    const logError = vi.spyOn(logger, 'error');
    const privateBody = '{"title":"Private note","content":"private draft"';

    const response = await request(app)
      .post('/api/notes')
      .set('Content-Type', 'application/json')
      .send(privateBody);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'The request body could not be processed.',
      },
    });
    expect(logError).not.toHaveBeenCalled();
  });
});
