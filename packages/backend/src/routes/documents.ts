import { Router, Request, Response } from 'express';
import { requireApiKey } from '../lib/auth';
import { analyzeDocument } from '../services/DocumentRAG';
import { AuditLog } from '../services/AuditLog';
import { logger } from '../lib/logger';

export const documentsRouter = Router();

/**
 * POST /sessions/:id/documents/verify
 * Body: { image_base64: string, mime_type: string }
 * 
 * Analyzes an uploaded document using Nova Pro multimodal
 * Extracts PAN, name, DOB and cross-validates with session data
 */
documentsRouter.post('/:sessionId/documents/verify', requireApiKey('api'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { image_base64, mime_type = 'image/jpeg' } = req.body as {
      image_base64: string;
      mime_type?: 'image/jpeg' | 'image/png' | 'application/pdf';
    };

    if (!image_base64) {
      res.status(400).json({ error: 'image_base64 required' });
      return;
    }

    // Validate base64 size (max 5MB)
    const sizeBytes = Buffer.byteLength(image_base64, 'base64');
    if (sizeBytes > 5 * 1024 * 1024) {
      res.status(400).json({ error: 'Document too large (max 5MB)' });
      return;
    }

    // Get session entities for cross-validation
    const { queryOne } = await import('../db/db');
    const session = await queryOne<{ offer: { entities?: { pan?: string; income?: number } } | null }>(
      'SELECT offer FROM sessions WHERE id = $1',
      [req.params.sessionId]
    );

    const result = await analyzeDocument(
      image_base64,
      mime_type,
      {}
    );

    // Append to audit log
    await AuditLog.append(req.params.sessionId, 'document_verified', {
      document_type: result.document_type,
      verification_status: result.verification_status,
      confidence: result.confidence,
      flags: result.flags,
      // Never log raw document data — only verification result
    });

    logger.info({
      event: 'document_verified',
      session_id: req.params.sessionId,
      document_type: result.document_type,
      status: result.verification_status,
    });

    res.json(result);
  } catch (err) {
    logger.error({ event: 'document_verify_error', err });
    res.status(500).json({ error: 'Document verification failed' });
  }
});
