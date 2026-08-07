import { fromNodeHeaders } from 'better-auth/node';
import type { NextFunction, Request, Response } from 'express';
import { auth } from './auth';

export async function requireSession(req: Request, res: Response, next: NextFunction) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      res.status(401).json({
        error: { code: 'UNAUTHENTICATED', message: 'Sign in to continue.' },
      });
      return;
    }

    req.auth = {
      userId: session.user.id,
      userName: session.user.name,
      userEmail: session.user.email,
    };
    next();
  } catch (error) {
    next(error);
  }
}
