import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { logger } from '../lib/logger';
import { redactSensitiveRequestUrl } from '../lib/request-log-redaction';
import { AppError } from './app-error';

const clientBodyErrorTypes = new Set([
  'charset.unsupported',
  'encoding.unsupported',
  'entity.parse.failed',
  'entity.too.large',
  'request.aborted',
  'request.size.invalid',
]);

function isClientBodyError(error: unknown): error is Error & { status: number; type: string } {
  return (
    error instanceof Error &&
    'status' in error &&
    typeof error.status === 'number' &&
    error.status >= 400 &&
    error.status < 500 &&
    'type' in error &&
    typeof error.type === 'string' &&
    clientBodyErrorTypes.has(error.type)
  );
}

function zodFields(error: ZodError) {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'request';
    fields[key] ??= issue.message;
  }
  return fields;
}

export function errorHandler(error: unknown, req: Request, res: Response, _next: NextFunction) {
  void _next;
  if (error instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'The request could not be processed.',
        fields: zodFields(error),
      },
    });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.status).json({
      error: {
        code: error.code,
        message: error.message,
        ...(error.fields ? { fields: error.fields } : {}),
      },
    });
    return;
  }

  if (isClientBodyError(error)) {
    res.status(error.status).json({
      error: {
        code: 'VALIDATION_ERROR',
        message:
          error.status === 413
            ? 'The request body is too large.'
            : 'The request body could not be processed.',
      },
    });
    return;
  }

  logger.error(
    { err: error, method: req.method, path: redactSensitiveRequestUrl(req.path) },
    'Unhandled request error',
  );
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong.' },
  });
}
