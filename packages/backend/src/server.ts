import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { logger } from './lib/logger';
import { register as metricsRegister } from './lib/metrics';
import { sessionsRouter, setOrchestrator } from './routes/sessions';
import { policyRouter } from './routes/policy';
import { healthRouter } from './routes/health';
import { metricsRouter } from './routes/metrics';
import { webhookRouter } from './routes/webhook';
import { ttsRouter } from './routes/tts';
import { documentsRouter } from './routes/documents';
import { visionRouter } from './routes/vision';
import { Orchestrator } from './orchestrator/Orchestrator';

const app = express();
app.set('trust proxy', 1); // Fixes express-rate-limit behind Render proxy
const httpServer = createServer(app);

export const io = new SocketIOServer(httpServer, {
  cors: {
    origin: true,
    methods: ['GET', 'POST'],
    credentials: true,
  }
});

const orchestrator = new Orchestrator(io, process.env.REDIS_URL || 'redis://localhost:6379');
setOrchestrator(orchestrator);

const corsOptions: cors.CorsOptions = {
  origin: true,
  credentials: true,
};

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors(corsOptions));
// Judge/demo document verification sends base64 payloads; 1mb can cause 413 in production.
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '8mb' }));

// Rate limiting — relaxed for dev/demo (increase for production)
const sessionLimiter = rateLimit({ windowMs: 60_000, max: 100, standardHeaders: true });
const readLimiter = rateLimit({ windowMs: 60_000, max: 300, standardHeaders: true });

app.use('/sessions', sessionLimiter, sessionsRouter);
app.use('/policy', policyRouter);
app.use('/health', healthRouter);
app.use('/metrics', metricsRouter);
app.use('/webhook', webhookRouter);
app.use('/tts', ttsRouter);
app.use('/sessions', documentsRouter);
app.use('/vision', visionRouter);

// Top-level EMI calculator alias (delegates to health router handler)
import { calculateEMI, generateAmortizationSchedule, calculateMaxEligibility } from './services/EmiCalculator';
app.get('/emi-calculator', readLimiter, (req, res) => {
  const principal = Number(req.query.principal);
  const rate = Number(req.query.rate);
  const months = Number(req.query.months);
  const monthlyIncome = Number(req.query.monthly_income ?? 0);
  const existingEmis = Number(req.query.existing_emis ?? 0);
  if (!principal || !rate || !months || principal <= 0 || rate <= 0 || months <= 0) {
    res.status(400).json({ error: 'principal, rate, and months are required positive query parameters' });
    return;
  }
  const emi = calculateEMI(principal, rate, months);
  const schedule = generateAmortizationSchedule(principal, rate, months);
  const totalPayment = emi * months;
  const totalInterest = totalPayment - principal;
  const maxEligibility = monthlyIncome > 0
    ? calculateMaxEligibility(monthlyIncome, existingEmis, rate, months)
    : null;
  res.json({ emi, total_payment: totalPayment, total_interest: totalInterest, effective_rate: rate, schedule, max_eligibility: maxEligibility });
});

// Bandwidth probe asset (100 KB)
const probeBuffer = Buffer.alloc(100 * 1024, 'x');
app.get('/probe-100kb', readLimiter, (_req, res) => {
  res.set('Content-Type', 'application/octet-stream');
  res.set('Cache-Control', 'no-store');
  res.send(probeBuffer);
});

io.on('connection', (socket) => {
  logger.info({ event: 'socket_connected', socketId: socket.id });

  socket.on('join_session', (sessionId: string) => {
    socket.join(`session:${sessionId}`);
    logger.info({ event: 'socket_joined_session', socketId: socket.id, session_id: sessionId });
  });

  socket.on('transcript', async (data: { session_id: string; transcript: string }) => {
    if (!data.session_id || !data.transcript) return;
    try {
      await orchestrator.processTranscript(data.session_id, data.transcript);
    } catch (e) {
      logger.error({ event: 'socket_transcript_error', err: e });
    }
  });

  socket.on('liveness_result', async (data: any) => {
    if (!data.session_id) return;
    try {
      const { session_id, ...result } = data;
      await orchestrator.processLivenessResult(session_id, result);
    } catch (e) {
      logger.error({ event: 'socket_liveness_error', err: e });
    }
  });

  socket.on('disconnect', () => {
    logger.info({ event: 'socket_disconnected', socketId: socket.id });
  });
});

// Run database migrations before starting the server
import { runMigrations } from './db/migrate';

const PORT = parseInt(process.env.PORT || '4000', 10);

(async () => {
  try {
    await runMigrations();
  } catch (err: any) {
    logger.error({ event: 'startup_migration_failed', err: err.message });
    // Continue starting — the app will handle individual query failures
  }
  httpServer.listen(PORT, () => {
    logger.info({ event: 'server_started', port: PORT });
  });
})();

export { app, httpServer };
