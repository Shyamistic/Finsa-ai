import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query } from '../db/db';
import { requireApiKey } from '../lib/auth';
import { logger } from '../lib/logger';
import bcrypt from 'bcrypt';
import axios from 'axios';

export const webhookRouter = Router();

const RegisterSchema = z.object({
  url: z.string().url(),
  events: z.array(z.string()).min(1),
  api_key: z.string().min(16),
});

webhookRouter.post('/register', requireApiKey('api'), async (req: Request, res: Response): Promise<void> => {
  try {
    const body = RegisterSchema.parse(req.body);
    const keyHash = await bcrypt.hash(body.api_key, 10);
    await query(
      'INSERT INTO webhook_registrations (url, api_key_hash, events) VALUES ($1, $2, $3)',
      [body.url, keyHash, body.events]
    );
    logger.info({ event: 'webhook_registered', url: body.url });
    res.status(201).json({ registered: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request', details: err.errors });
      return;
    }
    logger.error({ event: 'webhook_register_error', err });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /webhook/list — list all registered webhooks
webhookRouter.get('/list', requireApiKey('api'), async (_req: Request, res: Response): Promise<void> => {
  try {
    const hooks = await query<{ id: number; url: string; events: string[]; created_at: string }>(
      'SELECT id, url, events, created_at FROM webhook_registrations ORDER BY created_at DESC'
    );
    res.json({ webhooks: hooks, count: hooks.length });
  } catch (err) {
    logger.error({ event: 'webhook_list_error', err });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /webhook/:id — delete a webhook
webhookRouter.delete('/:id', requireApiKey('api'), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid webhook ID' });
      return;
    }
    const result = await query<{ id: number }>(
      'DELETE FROM webhook_registrations WHERE id = $1 RETURNING id',
      [id]
    );
    if (result.length === 0) {
      res.status(404).json({ error: 'Webhook not found' });
      return;
    }
    logger.info({ event: 'webhook_deleted', id });
    res.json({ deleted: true, id });
  } catch (err) {
    logger.error({ event: 'webhook_delete_error', err });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /webhook/test — test a registered webhook with sample payload
webhookRouter.post('/test', requireApiKey('api'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { webhook_id, event_type } = req.body as { webhook_id?: number; event_type?: string };
    if (!webhook_id) {
      res.status(400).json({ error: 'webhook_id is required' });
      return;
    }

    const hooks = await query<{ id: number; url: string; events: string[] }>(
      'SELECT id, url, events FROM webhook_registrations WHERE id = $1',
      [webhook_id]
    );
    if (hooks.length === 0) {
      res.status(404).json({ error: 'Webhook not found' });
      return;
    }

    const hook = hooks[0];
    const testPayload = {
      event: event_type ?? 'test',
      payload: {
        session_id: 'test-session-' + Date.now(),
        timestamp: new Date().toISOString(),
        message: 'This is a test webhook delivery from LoanWizard OS',
      },
    };

    const result = await dispatchWithRetry(hook.url, testPayload, 3);
    res.json({ success: result.success, attempts: result.attempts, response_status: result.status });
  } catch (err) {
    logger.error({ event: 'webhook_test_error', err });
    res.status(500).json({ error: 'Internal server error' });
  }
});

interface DispatchResult {
  success: boolean;
  attempts: number;
  status?: number;
  error?: string;
}

/**
 * Dispatch a webhook with exponential backoff retry.
 * Retries: 1s, 2s, 4s delays.
 */
async function dispatchWithRetry(
  url: string,
  payload: unknown,
  maxRetries: number
): Promise<DispatchResult> {
  let lastError: string | undefined;
  let lastStatus: number | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.post(url, payload, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
          'X-LoanWizard-Event': (payload as { event?: string }).event ?? 'unknown',
          'X-LoanWizard-Attempt': String(attempt),
        },
      });
      return { success: true, attempts: attempt, status: response.status };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      lastStatus = axios.isAxiosError(err) ? err.response?.status : undefined;
      logger.warn({ event: 'webhook_retry', url, attempt, error: lastError });

      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
      }
    }
  }

  return { success: false, attempts: maxRetries, status: lastStatus, error: lastError };
}

export async function dispatchWebhook(eventType: string, payload: unknown): Promise<void> {
  try {
    const hooks = await query<{ url: string; events: string[] }>(
      'SELECT url, events FROM webhook_registrations WHERE $1 = ANY(events)',
      [eventType]
    );
    await Promise.allSettled(
      hooks.map(h => dispatchWithRetry(h.url, { event: eventType, payload }, 3))
    );
  } catch (err) {
    logger.error({ event: 'webhook_dispatch_error', err });
  }
}
