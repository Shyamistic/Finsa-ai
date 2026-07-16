import { Router, Request, Response } from 'express';
import { synthesizeSpeech } from '../services/PollyTTS';
import { logger } from '../lib/logger';
import { rateLimit } from 'express-rate-limit';

export const ttsRouter = Router();

const ttsLimiter = rateLimit({ windowMs: 60_000, max: 30, standardHeaders: true });

/**
 * POST /tts/synthesize
 * Body: { text: string, language: 'en' | 'hi' }
 * Returns: MP3 audio stream
 * 
 * Used by frontend to get natural Polly neural voice instead of browser TTS
 */
ttsRouter.post('/synthesize', ttsLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, language = 'en' } = req.body as { text: string; language?: 'en' | 'hi' };

    if (!text?.trim()) {
      res.status(400).json({ error: 'text is required' });
      return;
    }

    if (text.length > 1000) {
      res.status(400).json({ error: 'text too long (max 1000 chars)' });
      return;
    }

    logger.info({ event: 'tts_request', language, text_preview: text.trim().slice(0, 60) });

    const audioBuffer = await synthesizeSpeech(text.trim(), language);

    res.set('Content-Type', 'audio/mpeg');
    res.set('Content-Length', String(audioBuffer.length));
    res.set('Cache-Control', 'no-store');
    res.send(audioBuffer);

  } catch (err) {
    logger.error({ event: 'tts_route_error', err });
    const e = err as { name?: string; message?: string };
    // Return 503 so frontend can fall back to browser TTS
    res.status(503).json({
      error: 'TTS service unavailable',
      code: e?.name || 'UnknownError',
      reason: e?.message || 'Unknown Polly failure',
    });
  }
});
