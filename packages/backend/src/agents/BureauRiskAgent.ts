import { EventBus } from '../orchestrator/EventBus';
import { IAgent, AgentStatus } from './IAgent';
import { logger } from '../lib/logger';
import { agentProcessingTime } from '../lib/metrics';
import { MOCK_BUREAU, BureauProfile } from '../demo/demoProfiles';

export interface BureauRiskOutput {
  risk_band: 'Low' | 'Medium' | 'High';
  credit_score: number | null;
  propensity: number; // 0–1 likelihood of repayment
  pan_matched: boolean;
  dob: string | null;
  profile: BureauProfile | null;
  ntc: boolean;
}

function computePropensity(profile: BureauProfile): number {
  if (profile.fraud_flag) return 0.05;
  if (profile.ntc) return 0.55;

  const score = profile.credit_score ?? 500;
  const dtiRatio = profile.existing_emis / Math.max(profile.monthly_income, 1);

  // Gradient-boosted mock weights
  let propensity = 0.5;
  propensity += (score - 500) / 1000; // credit score contribution
  propensity -= dtiRatio * 0.5;       // DTI penalty
  propensity += profile.city_tier === 1 ? 0.1 : profile.city_tier === 2 ? 0.05 : 0;

  return Math.max(0.05, Math.min(0.99, propensity));
}

export class BureauRiskAgent implements IAgent {
  agentId = 'bureau_risk';
  private status: AgentStatus = 'idle';
  private sessionId = '';
  private startTime = 0;

  constructor(private bus: EventBus) {}

  async init(sessionId: string): Promise<void> {
    this.sessionId = sessionId;
    this.status = 'initialising';
    logger.info({ event: 'agent_init', agent: this.agentId, session_id: sessionId });
  }

  async start(): Promise<void> {
    this.status = 'running';
    this.startTime = Date.now();
    logger.info({ event: 'agent_start', agent: this.agentId, session_id: this.sessionId });

    // Wait for PAN from speech intel
    this.bus.subscribe(`session:${this.sessionId}:speech_intel`, (data) => {
      const d = data as { interview_complete?: boolean; entities?: { pan?: string; income?: number; employment_type?: string } };
      if (d.interview_complete && d.entities?.pan) {
        this.lookupBureau(d.entities.pan, d.entities);
      }
    });
  }

  private lookupBureau(pan: string, extractedEntities?: { income?: number; employment_type?: string }): void {
    const profile = MOCK_BUREAU[pan.toUpperCase()] ?? null;
    const panMatched = profile !== null;

    let output: BureauRiskOutput;

    if (!profile) {
      // Unknown PAN — build a synthetic profile from LLM-extracted entities
      // This makes the pipeline work for real users, not just demo profiles
      const income = extractedEntities?.income ?? 50000;
      const employment = extractedEntities?.employment_type ?? 'Salaried';
      const isSalaried = /salaried|employed|job|salary/i.test(employment);
      const syntheticProfile: BureauProfile = {
        name: 'Customer',
        dob: '1990-01-01',
        credit_score: null, // NTC — no bureau match
        monthly_income: income,
        employment: isSalaried ? 'Salaried' : 'Self-Employed',
        city_tier: 2,
        existing_emis: 0,
        risk_band: 'Medium',
        ntc: true,
      };
      output = {
        risk_band: 'Medium',
        credit_score: null,
        propensity: computePropensity(syntheticProfile),
        pan_matched: false,
        dob: null,
        profile: syntheticProfile,
        ntc: true,
      };
    } else {
      output = {
        risk_band: profile.risk_band,
        credit_score: profile.credit_score,
        propensity: computePropensity(profile),
        pan_matched: panMatched,
        dob: profile.dob,
        profile,
        ntc: profile.ntc ?? false,
      };
    }

    const duration = Date.now() - this.startTime;
    agentProcessingTime.observe({ agent_id: this.agentId }, duration);

    this.bus.publish(`session:${this.sessionId}:bureau_risk`, output);
    this.status = 'completed';

    logger.info({
      event: 'agent_completed',
      agent: this.agentId,
      session_id: this.sessionId,
      risk_band: output.risk_band,
      pan_matched: panMatched,
      duration_ms: duration,
    });
  }

  getStatus(): AgentStatus { return this.status; }

  async shutdown(): Promise<void> {
    this.status = 'idle';
  }
}
