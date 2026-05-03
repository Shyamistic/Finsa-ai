import { EventBus } from '../orchestrator/EventBus';
import { Server as SocketIOServer } from 'socket.io';
import { IAgent, AgentStatus } from './IAgent';
import { logger } from '../lib/logger';
import { agentProcessingTime } from '../lib/metrics';

export interface LivenessResult {
  passed: boolean;
  confidence: number;
  challenge: string;
  age_estimate: number | null;
}

export interface VisualIntelOutput {
  liveness: {
    passed: boolean;
    confidence: number;
    challenges: string[];
  };
  age_estimate: number | null;
  background_ok: boolean;
}

export class VisualIntelAgent implements IAgent {
  agentId = 'visual_intel';
  private status: AgentStatus = 'idle';
  private sessionId = '';
  private livenessResults: LivenessResult[] = [];
  private startTime = 0;

  constructor(private bus: EventBus, private io: SocketIOServer) {}

  async init(sessionId: string): Promise<void> {
    this.sessionId = sessionId;
    this.status = 'initialising';
    this.livenessResults = [];
    logger.info({ event: 'agent_init', agent: this.agentId, session_id: sessionId });
  }

  async start(): Promise<void> {
    this.status = 'running';
    this.startTime = Date.now();
    logger.info({ event: 'agent_start', agent: this.agentId, session_id: this.sessionId });

    // Listen for liveness results from browser Web Worker via Socket.IO
    this.io.on('connection', (socket) => {
      socket.on('liveness_result', (data: LivenessResult & { session_id: string }) => {
        if (data.session_id !== this.sessionId) return;
        this.handleLivenessResult(data);
      });
    });
  }

  handleLivenessResult(result: LivenessResult): void {
    this.livenessResults.push(result);
    logger.info({
      event: 'liveness_result_received',
      agent: this.agentId,
      session_id: this.sessionId,
      passed: result.passed,
      confidence: result.confidence,
      challenge: result.challenge,
    });

    // After 2 challenges, publish final result
    if (this.livenessResults.length >= 2) {
      this.publishResult();
    }
  }

  private publishResult(): void {
    const allPassed = this.livenessResults.every(r => r.passed);
    const avgConfidence = this.livenessResults.reduce((s, r) => s + r.confidence, 0) / this.livenessResults.length;
    const ageEstimate = this.livenessResults.find(r => r.age_estimate !== null)?.age_estimate ?? null;

    const output: VisualIntelOutput = {
      liveness: {
        passed: allPassed,
        confidence: avgConfidence,
        challenges: this.livenessResults.map(r => r.challenge),
      },
      age_estimate: ageEstimate,
      background_ok: true, // simplified for prototype
    };

    const duration = Date.now() - this.startTime;
    agentProcessingTime.observe({ agent_id: this.agentId }, duration);

    this.bus.publish(`session:${this.sessionId}:visual_intel`, output);
    this.status = 'completed';

    logger.info({
      event: 'agent_completed',
      agent: this.agentId,
      session_id: this.sessionId,
      duration_ms: duration,
      liveness_passed: allPassed,
      age_estimate: ageEstimate,
    });
  }

  // Called by demo mode to inject a simulated result
  injectLivenessResult(result: LivenessResult): void {
    this.handleLivenessResult(result);
  }

  getStatus(): AgentStatus { return this.status; }

  async shutdown(): Promise<void> {
    this.status = 'idle';
    this.livenessResults = [];
  }
}
