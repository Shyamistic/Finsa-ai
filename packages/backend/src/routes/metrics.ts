import { Router } from 'express';
import { register } from '../lib/metrics';

export const metricsRouter = Router();

metricsRouter.get('/', async (_req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
