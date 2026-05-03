/**
 * Vision routes — computer vision analysis endpoints
 * POST /vision/analyse-frame  — age estimation + face quality from video frame
 * POST /vision/geo-check      — geo-location fraud signal
 */
import { Router, Request, Response } from 'express';
import { analyseVideoFrame } from '../services/RekognitionService';
import { logger } from '../lib/logger';
import { query } from '../db/db';

export const visionRouter = Router();

/**
 * POST /vision/analyse-frame
 * Body: { session_id: string, frame: string (base64 JPEG) }
 * Returns: FaceAnalysisResult + age validation against policy (min age 21)
 */
visionRouter.post('/analyse-frame', async (req: Request, res: Response): Promise<void> => {
  try {
    const { session_id, frame } = req.body as { session_id: string; frame: string };

    if (!frame) {
      res.status(400).json({ error: 'frame is required' });
      return;
    }

    const result = await analyseVideoFrame(frame);

    // Policy: minimum age 21 for loan eligibility
    const MIN_AGE = 21;
    const MAX_AGE = 65;
    let ageValidation: 'pass' | 'fail' | 'uncertain' = 'uncertain';

    if (result.ageEstimate !== null) {
      if (result.ageEstimate < MIN_AGE) {
        ageValidation = 'fail';
      } else if (result.ageEstimate > MAX_AGE) {
        ageValidation = 'fail';
      } else {
        ageValidation = 'pass';
      }
    }

    // Persist age estimate to session if we have one
    if (session_id && result.ageEstimate !== null) {
      await query(
        `UPDATE sessions SET bandwidth_tier = COALESCE(bandwidth_tier, 'unknown') WHERE id = $1`,
        [session_id]
      ).catch(() => {}); // non-blocking
    }

    logger.info({
      event: 'frame_analysed',
      session_id,
      age_estimate: result.ageEstimate,
      age_validation: ageValidation,
      face_detected: result.faceDetected,
    });

    res.json({
      ...result,
      age_validation: ageValidation,
      policy_min_age: MIN_AGE,
      policy_max_age: MAX_AGE,
    });
  } catch (err) {
    logger.error({ event: 'vision_analyse_error', err });
    res.status(500).json({ error: 'Vision analysis failed' });
  }
});

/**
 * POST /vision/geo-check
 * Body: { session_id: string, latitude: number, longitude: number, accuracy: number }
 * Records GPS coordinates and checks against India bounding box
 */
visionRouter.post('/geo-check', async (req: Request, res: Response): Promise<void> => {
  try {
    const { session_id, latitude, longitude, accuracy } = req.body as {
      session_id: string;
      latitude: number;
      longitude: number;
      accuracy: number;
    };

    // India bounding box (approximate)
    const INDIA_BOUNDS = {
      latMin: 6.5, latMax: 37.1,
      lonMin: 68.1, lonMax: 97.4,
    };

    const inIndia = latitude >= INDIA_BOUNDS.latMin &&
                    latitude <= INDIA_BOUNDS.latMax &&
                    longitude >= INDIA_BOUNDS.lonMin &&
                    longitude <= INDIA_BOUNDS.lonMax;

    const geoSignal = {
      latitude,
      longitude,
      accuracy_meters: accuracy,
      in_india: inIndia,
      fraud_signal: !inIndia,
    };

    logger.info({
      event: 'geo_check',
      session_id,
      in_india: inIndia,
      lat: latitude.toFixed(2),
      lon: longitude.toFixed(2),
    });

    res.json(geoSignal);
  } catch (err) {
    logger.error({ event: 'geo_check_error', err });
    res.status(500).json({ error: 'Geo check failed' });
  }
});
