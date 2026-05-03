import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query } from '../db/db';
import { requireApiKey } from '../lib/auth';
import { logger } from '../lib/logger';

export const policyRouter = Router();

const PolicyRuleSchema = z.object({
  rules: z.array(z.object({
    id: z.string(),
    persona: z.string(),
    risk_band: z.enum(['Low', 'Medium', 'High']),
    min_amount: z.number().min(50000),
    max_amount: z.number().max(5000000),
    min_rate: z.number().min(10.5),
    max_rate: z.number().max(24.0),
    tenures: z.array(z.number()).length(3),
  }))
});

policyRouter.get('/', requireApiKey('api'), async (_req: Request, res: Response): Promise<void> => {
  try {
    const rows = await query<{ rules: unknown }>('SELECT rules FROM policy_rules WHERE id = 1');
    res.json(rows[0]?.rules ?? { rules: [] });
  } catch (err) {
    logger.error({ event: 'policy_get_error', err });
    res.status(500).json({ error: 'Internal server error' });
  }
});

policyRouter.put('/', requireApiKey('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const body = PolicyRuleSchema.parse(req.body);
    await query(
      `INSERT INTO policy_rules (id, rules, updated_at) VALUES (1, $1, NOW())
       ON CONFLICT (id) DO UPDATE SET rules = $1, updated_at = NOW()`,
      [JSON.stringify(body)]
    );
    logger.info({ event: 'policy_updated', rule_count: body.rules.length });
    res.json({ updated: true, rule_count: body.rules.length });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid policy rules', details: err.errors });
      return;
    }
    logger.error({ event: 'policy_update_error', err });
    res.status(500).json({ error: 'Internal server error' });
  }
});
