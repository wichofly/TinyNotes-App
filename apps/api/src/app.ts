import { getRequest, setResponse } from 'better-call/node';
import cors from 'cors';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import * as helmetModule from 'helmet';
import { pinoHttp, type StdSerializedResults } from 'pino-http';
import { auth } from './auth/auth.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { redactSensitiveRequestUrl } from './lib/request-log-redaction.js';
import { errorHandler } from './middleware/error-handler.js';
import { apiNotFound } from './middleware/not-found.js';
import { notesRouter, publicNotesRouter } from './modules/notes/notes.routes.js';

const rateLimitResponse = {
  error: { code: 'RATE_LIMITED', message: 'Too many requests. Try again later.' },
};
const authBodyLimitBytes = 32 * 1024;

type HelmetFactory = () => express.RequestHandler;

function isHelmetFactory(value: unknown): value is HelmetFactory {
  return typeof value === 'function';
}

function resolveHelmetFactory(moduleValue: unknown): HelmetFactory {
  if (isHelmetFactory(moduleValue)) return moduleValue;

  if (
    typeof moduleValue === 'object' &&
    moduleValue !== null &&
    'default' in moduleValue &&
    isHelmetFactory(moduleValue.default)
  ) {
    return moduleValue.default;
  }

  throw new TypeError('Helmet did not provide a callable middleware factory.');
}

const helmet = resolveHelmetFactory(helmetModule);

async function handleAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const contentLength = Number(req.headers['content-length']);
  if (Number.isFinite(contentLength) && contentLength > authBodyLimitBytes) {
    res.status(413).json({
      error: { code: 'VALIDATION_ERROR', message: 'The request body is too large.' },
    });
    return;
  }

  try {
    const request = getRequest({
      base: env.BETTER_AUTH_URL,
      request: req,
      bodySizeLimit: authBodyLimitBytes,
    });
    await setResponse(res, await auth.handler(request));
  } catch (error) {
    next(error);
  }
}

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
  app.all('/api/auth/*splat', handleAuth);

  app.use('/api', apiLimiter);
  app.use(express.json({ limit: '210kb', strict: true }));
  app.get('/', (_req, res) => res.redirect(302, env.PUBLIC_APP_URL));
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api/notes', notesRouter);
  app.use('/api/public/notes', publicLimiter, publicNotesRouter);
  app.use('/api', apiNotFound);

  app.use(errorHandler);
  return app;
}

const app = createApp();

export default app;
