import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { query, queryOne } from '../db/db';
import { requireApiKey } from '../lib/auth';
import { logger } from '../lib/logger';

export const sessionsRouter = Router();

let orchestratorInstance: import('../orchestrator/Orchestrator').Orchestrator | null = null;
export function setOrchestrator(o: import('../orchestrator/Orchestrator').Orchestrator) {
  orchestratorInstance = o;
}

const CreateSessionSchema = z.object({
  white_label_config: z.object({
    logo: z.string().url().optional(),
    primaryColor: z.string().optional(),
    institutionName: z.string().optional(),
  }).optional(),
  language: z.enum(['en', 'hi', 'mr', 'ta']).default('en'),
});

// POST /sessions — create session
sessionsRouter.post('/', requireApiKey('api'), async (req: Request, res: Response): Promise<void> => {
  try {
    const body = CreateSessionSchema.parse(req.body);
    const sessionId = uuidv4();
    const resumeToken = uuidv4();

    await query(
      `INSERT INTO sessions (id, status, language, resume_token, white_label_config)
       VALUES ($1, 'initiated', $2, $3, $4)`,
      [sessionId, body.language, resumeToken, body.white_label_config ? JSON.stringify(body.white_label_config) : null]
    );

    logger.info({ event: 'session_created', session_id: sessionId });

    res.status(201).json({
      session_id: sessionId,
      join_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/session/${sessionId}`,
      resume_token: resumeToken,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request', details: err.errors });
      return;
    }
    logger.error({ event: 'session_create_error', err: err instanceof Error ? err.message : String(err) });
    res.status(500).json({ error: 'Internal server error', detail: err instanceof Error ? err.message : 'unknown' });
  }
});

// GET /sessions/:id — get session
sessionsRouter.get('/:id', requireApiKey('api'), async (req: Request, res: Response): Promise<void> => {
  try {
    const session = await queryOne('SELECT * FROM sessions WHERE id = $1', [req.params.id]);
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }
    res.json(session);
  } catch (err) {
    logger.error({ event: 'session_get_error', err });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /sessions/:id/audit/verify — verify audit chain
sessionsRouter.get('/:id/audit/verify', requireApiKey('api'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { AuditLog } = await import('../services/AuditLog');
    const result = await AuditLog.verify(req.params.id);
    res.json(result);
  } catch (err) {
    logger.error({ event: 'audit_verify_error', err });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /sessions/:id/vcip-pdf — download V-CIP PDF (no auth — direct browser download)
// Always generates on-demand — does NOT require vcip_pdf_url to be set
sessionsRouter.get('/:id/vcip-pdf', async (req: Request, res: Response): Promise<void> => {
  try {
    const session = await queryOne<{ id: string }>('SELECT id FROM sessions WHERE id = $1', [req.params.id]);
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }
    const { VcipPdfGenerator } = await import('../services/VcipPdfGenerator');
    const pdfBuffer = await VcipPdfGenerator.generate(req.params.id);
    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', `attachment; filename="vcip-${req.params.id}.pdf"`);
    res.set('Cache-Control', 'no-store');
    res.send(pdfBuffer);
  } catch (err) {
    logger.error({ event: 'vcip_pdf_error', err });
    res.status(500).json({ error: 'Internal server error', detail: err instanceof Error ? err.message : 'unknown' });
  }
});

// POST /sessions/:id/start — start session (called after consent)
sessionsRouter.post('/:id/start', requireApiKey('api'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!orchestratorInstance) {
      res.status(503).json({ error: 'Orchestrator not ready' });
      return;
    }
    // Check current status — don't restart if already in progress
    const session = await queryOne<{ status: string }>('SELECT status FROM sessions WHERE id = $1', [req.params.id]);
    if (!session) { res.status(404).json({ error: 'Session not found' }); return; }

    if (session.status !== 'initiated' && session.status !== 'consent_captured') {
      // Already started — just return success so frontend doesn't error
      res.json({ started: true, already_running: true });
      return;
    }

    await query(`UPDATE sessions SET status = 'in_progress' WHERE id = $1`, [req.params.id]);
    await orchestratorInstance.startSession(req.params.id);
    res.json({ started: true });
  } catch (err) {
    logger.error({ event: 'session_start_error', err });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /sessions/:id/consent — record DPDP consent
sessionsRouter.post('/:id/consent', requireApiKey('api'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { consent_version, data_categories, purpose, retention_days } = req.body as {
      consent_version: string;
      data_categories: string[];
      purpose: string;
      retention_days: number;
    };
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.socket.remoteAddress ?? null;
    await query(
      `INSERT INTO dpdp_consent_trail (session_id, customer_ip, consent_version, data_categories, purpose, retention_days)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.params.id, ip, consent_version || '1.0', data_categories || [], purpose || 'Loan origination', retention_days || 2555]
    );
    // Also append to audit log
    const { AuditLog } = await import('../services/AuditLog');
    await AuditLog.append(req.params.id, 'consent_captured', {
      consent_version, ip_hash: ip ? require('crypto').createHash('sha256').update(ip).digest('hex') : null
    });
    res.json({ recorded: true });
  } catch (err) {
    logger.error({ event: 'consent_record_error', err });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /sessions/:id/transcript — receive speech transcript from frontend
sessionsRouter.post('/:id/transcript', requireApiKey('api'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { transcript } = req.body as { transcript: string };
    if (!transcript?.trim()) { res.status(400).json({ error: 'transcript required' }); return; }
    if (orchestratorInstance) {
      await orchestratorInstance.processTranscript(req.params.id, transcript.trim());
    }
    res.json({ received: true });
  } catch (err) {
    logger.error({ event: 'transcript_error', err });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /sessions/:id/handoff — assign case to SBI human reviewer (HITL)
sessionsRouter.post('/:id/handoff', requireApiKey('api'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { notes } = req.body as { notes?: string };
    const ticketId = `SBI-HITL-${Date.now().toString().slice(-8)}`;

    const updated = await queryOne<{ id: string }>(
      `UPDATE sessions
       SET handoff_status = 'assigned',
           handoff_ticket_id = $2,
           handoff_notes = $3,
           handoff_assigned_at = NOW()
       WHERE id = $1
       RETURNING id`,
      [req.params.id, ticketId, notes ?? null]
    );

    if (!updated) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    const { AuditLog } = await import('../services/AuditLog');
    await AuditLog.append(req.params.id, 'hitl_assigned', {
      ticket_id: ticketId,
      notes: notes ?? null,
    });

    res.json({ assigned: true, ticket_id: ticketId });
  } catch (err) {
    logger.error({ event: 'session_handoff_error', err });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /sessions/:id/resume — resume dropped session
sessionsRouter.post('/:id/resume', async (req: Request, res: Response): Promise<void> => {
  try {
    const { resume_token } = req.body as { resume_token: string };
    const session = await queryOne<{ id: string; status: string; resume_token: string }>(
      'SELECT id, status, resume_token FROM sessions WHERE id = $1',
      [req.params.id]
    );
    if (!session || session.resume_token !== resume_token) {
      res.status(403).json({ error: 'Invalid resume token' });
      return;
    }
    const state = orchestratorInstance
      ? await orchestratorInstance.restoreSessionState(resume_token)
      : null;
    res.json({ resumed: true, state });
  } catch (err) {
    logger.error({ event: 'session_resume_error', err });
    res.status(500).json({ error: 'Internal server error' });
  }
});
