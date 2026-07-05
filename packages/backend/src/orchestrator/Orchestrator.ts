import { Server as SocketIOServer } from 'socket.io';
import { EventBus, AgentId } from './EventBus';
import { IAgent, AgentStatus } from '../agents/IAgent';
import { VisualIntelAgent } from '../agents/VisualIntelAgent';
import { SpeechIntelAgent } from '../agents/SpeechIntelAgent';import { FraudDetectionAgent } from '../agents/FraudDetectionAgent';
import { BureauRiskAgent } from '../agents/BureauRiskAgent';
import { PersonaClassifierAgent } from '../agents/PersonaClassifierAgent';
import { OfferEngineAgent } from '../agents/OfferEngineAgent';
import { ComplianceAgent } from '../agents/ComplianceAgent';
import { AutoFillAgent } from '../agents/AutoFillAgent';
import { logger } from '../lib/logger';
import { activeSessionsGauge } from '../lib/metrics';
import Redis from 'ioredis';

export interface AgentStatusMap {
  [agentId: string]: AgentStatus;
}

export class Orchestrator {
  private bus: EventBus;
  private io: SocketIOServer;
  private redis: Redis;
  private activeSessions: Map<string, Map<AgentId, IAgent>> = new Map();
  private speechAgents: Map<string, SpeechIntelAgent> = new Map();
  // Dedup: track last transcript per session to prevent duplicate processing
  private lastTranscript: Map<string, { text: string; ts: number }> = new Map();
  private readonly DEDUP_WINDOW_MS = 2000; // ignore identical transcript within 2s

  constructor(io: SocketIOServer, redisUrl: string) {
    this.io = io;
    this.redis = new Redis(redisUrl);
    this.bus = new EventBus(redisUrl);

    // NOTE: transcript via socket is handled in startSession per-socket.
    // The HTTP POST /sessions/:id/transcript path is the primary path.
    // Socket transcript is a secondary path — handled in startSession.
  }

  async startSession(sessionId: string): Promise<void> {
    // Guard: don't restart an already-active session
    if (this.activeSessions.has(sessionId)) {
      logger.info({ event: 'session_already_active', session_id: sessionId });
      this.io.to(`session:${sessionId}`).emit('session_phase', { phase: 'started' });
      return;
    }

    logger.info({ event: 'session_start', session_id: sessionId });

    const agents = new Map<AgentId, IAgent>([
      ['visual_intel', new VisualIntelAgent(this.bus, this.io)],
      ['speech_intel', new SpeechIntelAgent(this.bus)],
      ['fraud_detection', new FraudDetectionAgent(this.bus)],
      ['bureau_risk', new BureauRiskAgent(this.bus)],
      ['persona', new PersonaClassifierAgent(this.bus)],
      ['offer', new OfferEngineAgent(this.bus)],
      ['compliance', new ComplianceAgent(this.bus)],
      ['auto_fill', new AutoFillAgent(this.bus)],
    ]);

    // Register in activeSessions BEFORE subscribing to prevent race conditions
    this.activeSessions.set(sessionId, agents);
    activeSessionsGauge.inc();

    // Subscribe to all agent channels to relay status to frontend
    // Each channel gets exactly ONE handler per session — no duplicates
    const agentIds: AgentId[] = [
      'visual_intel', 'speech_intel', 'fraud_detection',
      'bureau_risk', 'persona', 'offer', 'compliance', 'auto_fill',
    ];
    for (const agentId of agentIds) {
      this.bus.subscribe(`session:${sessionId}:${agentId}`, (data) => {
        this.io.to(`session:${sessionId}`).emit('agent_status', { agentId, data });
      });
    }

    // Store speech agent reference for transcript routing
    const speechAgent = agents.get('speech_intel') as SpeechIntelAgent;
    this.speechAgents.set(sessionId, speechAgent);

    // Initialise ALL agents simultaneously
    await Promise.all([...agents.values()].map(a => a.init(sessionId)));

    // Start ALL agents simultaneously
    await Promise.all([...agents.values()].map(a => a.start()));

    this.bus.publish(`session:${sessionId}:orchestrator`, { phase: 'started', agent_count: 8 });
    this.io.to(`session:${sessionId}`).emit('session_phase', { phase: 'started' });
  }

  async endSession(sessionId: string): Promise<void> {
    const agents = this.activeSessions.get(sessionId);
    if (!agents) return;

    await Promise.all([...agents.values()].map(a => a.shutdown()));
    this.bus.unsubscribeAll(sessionId);
    this.activeSessions.delete(sessionId);
    this.speechAgents.delete(sessionId);
    this.lastTranscript.delete(sessionId);
    activeSessionsGauge.dec();

    logger.info({ event: 'session_end', session_id: sessionId });
  }

  getAgentStatuses(sessionId: string): AgentStatusMap {
    const agents = this.activeSessions.get(sessionId);
    if (!agents) return {};
    const result: AgentStatusMap = {};
    for (const [id, agent] of agents) {
      result[id] = agent.getStatus();
    }
    return result;
  }

  async processTranscript(sessionId: string, transcript: string): Promise<void> {
    const agent = this.speechAgents.get(sessionId);
    if (!agent) {
      logger.warn({ event: 'transcript_no_agent_http', session_id: sessionId });
      return;
    }
    // Dedup check for HTTP path too
    const last = this.lastTranscript.get(sessionId);
    const now = Date.now();
    if (last && last.text === transcript && now - last.ts < this.DEDUP_WINDOW_MS) {
      logger.debug({ event: 'transcript_deduped_http', session_id: sessionId });
      return;
    }
    this.lastTranscript.set(sessionId, { text: transcript, ts: now });
    await agent.processTranscript(transcript);
  }

  async processLivenessResult(sessionId: string, result: any): Promise<void> {
    const agents = this.activeSessions.get(sessionId);
    if (!agents) return;
    const visualAgent = agents.get('visual_intel');
    if (visualAgent && 'injectLivenessResult' in visualAgent) {
      (visualAgent as any).injectLivenessResult(result);
    }
  }

  async persistSessionState(sessionId: string, state: unknown): Promise<void> {    await this.redis.setex(`resume:${sessionId}`, 600, JSON.stringify(state));
  }

  async restoreSessionState(resumeToken: string): Promise<unknown | null> {
    const data = await this.redis.get(`resume:${resumeToken}`);
    return data ? JSON.parse(data) : null;
  }
}
