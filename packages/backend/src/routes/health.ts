import { Router } from 'express';
import { calculateEMI, generateAmortizationSchedule, calculateMaxEligibility } from '../services/EmiCalculator';
import Redis from 'ioredis';
import { pool } from '../db/db';

export const healthRouter = Router();

const startTime = Date.now();

healthRouter.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    agents: 7,
    uptime_s: Math.floor((Date.now() - startTime) / 1000),
  });
});

healthRouter.get('/dependencies', async (_req, res) => {
  const result = {
    status: 'ok' as 'ok' | 'degraded',
    db: { ok: false, detail: '' },
    redis: { ok: false, detail: '' },
    aws: {
      ok: false,
      region: process.env.AWS_REGION || 'us-east-1',
      using_profile: Boolean(process.env.AWS_PROFILE),
      using_static_keys: Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
    },
    uptime_s: Math.floor((Date.now() - startTime) / 1000),
  };

  try {
    await pool.query('SELECT 1');
    result.db.ok = true;
    result.db.detail = 'postgres reachable';
  } catch (err) {
    result.status = 'degraded';
    result.db.detail = err instanceof Error ? err.message : 'postgres check failed';
  }

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const redis = new Redis(redisUrl, { lazyConnect: true, maxRetriesPerRequest: 1 });
  try {
    await redis.connect();
    await redis.ping();
    result.redis.ok = true;
    result.redis.detail = 'redis reachable';
  } catch (err) {
    result.status = 'degraded';
    result.redis.detail = err instanceof Error ? err.message : 'redis check failed';
  } finally {
    redis.disconnect();
  }

  result.aws.ok = result.aws.using_profile || result.aws.using_static_keys;
  if (!result.aws.ok) {
    result.status = 'degraded';
  }

  res.status(result.status === 'ok' ? 200 : 503).json(result);
});

healthRouter.get('/emi-calculator', (req, res) => {
  const principal = Number(req.query.principal);
  const rate = Number(req.query.rate);
  const months = Number(req.query.months);
  const monthlyIncome = Number(req.query.monthly_income ?? 0);
  const existingEmis = Number(req.query.existing_emis ?? 0);

  if (!principal || !rate || !months) {
    res.status(400).json({ error: 'principal, rate, and months are required query parameters' });
    return;
  }
  if (principal <= 0 || rate <= 0 || months <= 0) {
    res.status(400).json({ error: 'All values must be positive' });
    return;
  }

  const emi = calculateEMI(principal, rate, months);
  const schedule = generateAmortizationSchedule(principal, rate, months);
  const totalPayment = emi * months;
  const totalInterest = totalPayment - principal;
  const maxEligibility = monthlyIncome > 0
    ? calculateMaxEligibility(monthlyIncome, existingEmis, rate, months)
    : null;

  res.json({
    emi,
    total_payment: totalPayment,
    total_interest: totalInterest,
    effective_rate: rate,
    schedule,
    max_eligibility: maxEligibility,
  });
});
