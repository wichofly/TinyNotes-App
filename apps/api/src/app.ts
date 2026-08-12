import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { toNodeHandler } from 'better-auth/node';
import cors from 'cors';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import pinoHttp, { type StdSerializedResults } from 'pino-http';
import { auth } from './auth/auth';
import { env } from './config/env';
import { logger } from './lib/logger';
import { redactSensitiveRequestUrl } from './lib/request-log-redaction';
import { errorHandler } from './middleware/error-handler';
import { apiNotFound } from './middleware/not-found';
import { notesRouter, publicNotesRouter } from './modules/notes/notes.routes';

const rateLimitResponse = {
  error: { code: 'RATE_LIMITED', message: 'Too many requests. Try again later.' },
};

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1_000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse,
});

const publicLimiter = rateLimit({
  windowMs: 60 * 1_000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse,
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1_000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse,
});

export function createApp() {
  const app = express();

  if (env.TRUST_PROXY) app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(
    cors({
      origin: env.WEB_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type'],
    }),
  );
  app.use(
    pinoHttp({
      logger,
      serializers: {
        req(request: StdSerializedResults['req']) {
          return { ...request, url: redactSensitiveRequestUrl(request.url) };
        },
      },
    }),
  );

  if (env.NODE_ENV === 'production') {
    app.use(['/api/auth/sign-in/email', '/api/auth/sign-up/email'], authLimiter);
  }
  app.all('/api/auth/*splat', toNodeHandler(auth));

  app.use('/api', apiLimiter);
  app.use(express.json({ limit: '210kb', strict: true }));
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api/notes', notesRouter);
  app.use('/api/public/notes', publicLimiter, publicNotesRouter);
  app.use('/api', apiNotFound);

  if (env.NODE_ENV === 'production') {
    const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
    const webDist = path.resolve(currentDirectory, '../../web/dist');
    app.use(express.static(webDist, { index: false }));
    const sendSpa = (req: express.Request, res: express.Response) => {
      if (req.path.startsWith('/s/')) {
        res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
      }
      res.sendFile(path.join(webDist, 'index.html'));
    };
    app.get('/', sendSpa);
    app.get('/*splat', sendSpa);
  }

  app.use(errorHandler);
  return app;
}
