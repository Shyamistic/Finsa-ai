import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

// Demo keys — work without DB. Replace with DB-backed keys in production.
const DEMO_API_KEY = process.env.API_KEY || 'demo-key-loanwizard-2026';
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'admin-key-loanwizard-2026-secure';

export function requireApiKey(role: 'api' | 'admin' = 'api') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing Authorization header' });
      return;
    }

    const key = authHeader.slice(7);

    if (role === 'admin') {
      if (key === ADMIN_API_KEY) { next(); return; }
      res.status(403).json({ error: 'Invalid admin key' });
      return;
    }

    // 'api' role — accept both demo key and admin key
    if (key === DEMO_API_KEY || key === ADMIN_API_KEY) {
      next();
      return;
    }

    logger.warn({ event: 'auth_failed', role, ip: req.ip });
    res.status(403).json({ error: 'Invalid API key' });
  };
}
