// eslint-disable-next-line @typescript-eslint/no-require-imports
const geoip = require('geoip-lite') as { lookup: (ip: string) => { country: string } | null };
import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';
import { query } from '../db/db';

export function geoFenceMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Skip geo-fencing in dev mode or when explicitly disabled
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.GEOIP_SKIP_IN_DEV === 'true'
  ) {
    next();
    return;
  }

  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
    ?? req.socket.remoteAddress
    ?? '127.0.0.1';

  // Allow localhost always
  if (ip === '127.0.0.1' || ip === '::1') {
    next();
    return;
  }

  const geo = geoip.lookup(ip);
  const country = geo?.country ?? 'UNKNOWN';

  if (country !== 'IN') {
    logger.warn({ event: 'geo_fence_blocked', ip, country });
    res.status(403).json({
      error: 'Service not available in your region',
      code: 'GEO_BLOCKED',
    });
    return;
  }

  next();
}

export async function recordGeoOnSession(sessionId: string, ip: string): Promise<string> {
  const cleanIp = ip === '::1' ? '127.0.0.1' : ip;
  const geo = geoip.lookup(cleanIp);
  const country = geo?.country ?? 'IN';

  await query('UPDATE sessions SET geo_country = $1 WHERE id = $2', [country, sessionId]);
  return country;
}
