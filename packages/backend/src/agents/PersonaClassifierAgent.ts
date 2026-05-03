import { EventBus } from '../orchestrator/EventBus';
import { IAgent, AgentStatus } from './IAgent';
import { logger } from '../lib/logger';
import { agentProcessingTime } from '../lib/metrics';
import { BureauRiskOutput } from './BureauRiskAgent';
import { ExtractedEntities } from './SpeechIntelAgent';

export type Persona =
  | 'Salaried-Urban'
  | 'Self-Employed-Tier2'
  | 'MSME-Owner'
  | 'First-Time-Borrower'
  | 'NTC';

export interface PersonaOutput {
  persona: Persona;
  confidence: number;
  rationale: string;
}

function classifyPersona(entities: ExtractedEntities, bureau: BureauRiskOutput): PersonaOutput {
  // NTC — no credit history
  if (bureau.ntc || bureau.credit_score === null) {
    return {
      persona: 'NTC',
      confidence: 0.9,
      rationale: 'No credit history found in bureau records.',
    };
  }

  // MSME-Owner
  if (
    entities.employment_type === 'MSME-Owner' ||
    bureau.profile?.employment === 'MSME-Owner'
  ) {
    return {
      persona: 'MSME-Owner',
      confidence: 0.92,
      rationale: 'MSME business owner with established operations.',
    };
  }

  // Self-Employed Tier 2
  if (
    (entities.employment_type === 'Self-Employed' || bureau.profile?.employment === 'Self-Employed') &&
    (bureau.profile?.city_tier ?? 1) >= 2
  ) {
    return {
      persona: 'Self-Employed-Tier2',
      confidence: 0.88,
      rationale: 'Self-employed professional in Tier 2/3 city.',
    };
  }

  // First-Time Borrower (low credit score, young)
  if (bureau.credit_score && bureau.credit_score < 600) {
    return {
      persona: 'First-Time-Borrower',
      confidence: 0.82,
      rationale: 'Limited credit history suggests first-time borrower.',
    };
  }

  // Default: Salaried-Urban
  return {
    persona: 'Salaried-Urban',
    confidence: 0.9,
    rationale: 'Salaried professional with established credit history in urban area.',
  };
}

export class PersonaClassifierAgent implements IAgent {
  agentId = 'persona';
  private status: AgentStatus = 'idle';
  private sessionId = '';
  private startTime = 0;
  private speechData: { entities: ExtractedEntities; interview_complete?: boolean } | null = null;
  private bureauData: BureauRiskOutput | null = null;

  constructor(private bus: EventBus) {}

  async init(sessionId: string): Promise<void> {
    this.sessionId = sessionId;
    this.status = 'initialising';
    this.speechData = null;
    this.bureauData = null;
    logger.info({ event: 'agent_init', agent: this.agentId, session_id: sessionId });
  }

  async start(): Promise<void> {
    this.status = 'running';
    this.startTime = Date.now();
    logger.info({ event: 'agent_start', agent: this.agentId, session_id: this.sessionId });

    this.bus.subscribe(`session:${this.sessionId}:speech_intel`, (data) => {
      const d = data as { interview_complete?: boolean; entities?: ExtractedEntities };
      if (d.interview_complete) {
        this.speechData = { entities: d.entities ?? {}, interview_complete: true };
        this.tryClassify();
      }
    });

    this.bus.subscribe(`session:${this.sessionId}:bureau_risk`, (data) => {
      this.bureauData = data as BureauRiskOutput;
      this.tryClassify();
    });
  }

  private tryClassify(): void {
    if (!this.speechData?.interview_complete || !this.bureauData) return;

    const output = classifyPersona(this.speechData.entities, this.bureauData);

    const duration = Date.now() - this.startTime;
    agentProcessingTime.observe({ agent_id: this.agentId }, duration);

    this.bus.publish(`session:${this.sessionId}:persona`, output);
    this.status = 'completed';

    logger.info({
      event: 'agent_completed',
      agent: this.agentId,
      session_id: this.sessionId,
      persona: output.persona,
      confidence: output.confidence,
      duration_ms: duration,
    });
  }

  getStatus(): AgentStatus { return this.status; }

  async shutdown(): Promise<void> {
    this.status = 'idle';
    this.speechData = null;
    this.bureauData = null;
  }
}
