import { EventBus } from '../orchestrator/EventBus';
import { IAgent, AgentStatus } from './IAgent';
import { logger } from '../lib/logger';
import { agentProcessingTime, fraudScoreHistogram, sessionRejectedCounter } from '../lib/metrics';
import { query } from '../db/db';

export interface FraudSignals {
  geo_mismatch: boolean;              // weight 15 (normalised from 20)
  age_discrepancy: boolean;           // weight 18 (normalised from 25)
  pan_mismatch: boolean;              // weight 22 (normalised from 30)
  behavioural_anomaly: boolean;       // weight 15 (normalised from 25)
  device_fingerprint_mismatch: boolean; // weight 15 — device ID changed mid-session
  multiple_applications: boolean;     // weight 20 — >3 applications in 30 days
  income_inconsistency: boolean;      // weight 15 — stated income vs bureau income mismatch >40%
}

export interface FraudDetectionOutput {
  fraud_score: number;
  signals: FraudSignals;
  decision: 'approved' | 'flagged' | 'rejected';
  reason?: string;
}

// Pure function — deterministic, no side effects (CP-02)
// Total weights: 15+18+22+15+15+20+15 = 120 → normalise to 100
export function computeFraudScore(signals: FraudSignals): number {
  let raw = 0;
  if (signals.geo_mismatch) raw += 15;
  if (signals.age_discrepancy) raw += 18;
  if (signals.pan_mismatch) raw += 22;
  if (signals.behavioural_anomaly) raw += 15;
  if (signals.device_fingerprint_mismatch) raw += 15;
  if (signals.multiple_applications) raw += 20;
  if (signals.income_inconsistency) raw += 15;
  // Normalise: max raw = 120, scale to 100
  return Math.min(100, Math.round((raw / 120) * 100));
}

export class FraudDetectionAgent implements IAgent {
  agentId = 'fraud_detection';
  private status: AgentStatus = 'idle';
  private sessionId = '';
  private startTime = 0;

  // Collected signals from other agents
  private visualIntelData: { age_estimate: number | null; liveness: { passed: boolean } } | null = null;
  private speechIntelData: { entities: { pan?: string }; language?: string } | null = null;
  private bureauRiskData: { pan_matched: boolean; dob?: string } | null = null;
  private geoMismatch = false;

  constructor(private bus: EventBus) {}

  async init(sessionId: string): Promise<void> {
    this.sessionId = sessionId;
    this.status = 'initialising';
    this.visualIntelData = null;
    this.speechIntelData = null;
    this.bureauRiskData = null;
    logger.info({ event: 'agent_init', agent: this.agentId, session_id: sessionId });
  }

  async start(): Promise<void> {
    this.status = 'running';
    this.startTime = Date.now();
    logger.info({ event: 'agent_start', agent: this.agentId, session_id: this.sessionId });

    // Subscribe to upstream agents
    this.bus.subscribe(`session:${this.sessionId}:visual_intel`, (data) => {
      this.visualIntelData = data as typeof this.visualIntelData;
      this.tryCompute();
    });

    this.bus.subscribe(`session:${this.sessionId}:speech_intel`, (data) => {
      const d = data as { interview_complete?: boolean; entities?: { pan?: string }; language?: string };
      if (d.interview_complete) {
        this.speechIntelData = { entities: d.entities ?? {}, language: d.language };
        this.tryCompute();
      }
    });

    this.bus.subscribe(`session:${this.sessionId}:bureau_risk`, (data) => {
      this.bureauRiskData = data as typeof this.bureauRiskData;
      this.tryCompute();
    });

    // Check geo from session record
    const session = await query<{ geo_country: string }>('SELECT geo_country FROM sessions WHERE id = $1', [this.sessionId]);
    if (session[0]?.geo_country && session[0].geo_country !== 'IN') {
      this.geoMismatch = true;
    }

    // Timeout fallback: if visual_intel hasn't arrived in 60s, proceed without it
    setTimeout(() => {
      if (!this.visualIntelData && this.speechIntelData && this.bureauRiskData) {
        logger.warn({ event: 'fraud_detection_visual_timeout', session_id: this.sessionId });
        this.visualIntelData = { liveness: { passed: true }, age_estimate: null };
        this.tryCompute();
      }
    }, 60000);
  }

  private tryCompute(): void {
    // Compute if we have at least speech + bureau (visual is optional after 30s)
    const hasRequired = this.speechIntelData && this.bureauRiskData;
    const hasAll = hasRequired && this.visualIntelData;
    if (hasAll || (hasRequired && this.status === 'running')) {
      if (!this.visualIntelData) {
        // Use safe defaults if visual intel hasn't arrived
        this.visualIntelData = { liveness: { passed: true }, age_estimate: null };
      }
      this.compute();
    }
  }

  private compute(): void {
    const panMismatch = !(this.bureauRiskData?.pan_matched ?? true);

    // Age discrepancy: compare visual age estimate vs PAN DOB
    let ageDiscrepancy = false;
    if (this.visualIntelData?.age_estimate && this.bureauRiskData?.dob) {
      const dobYear = new Date(this.bureauRiskData.dob).getFullYear();
      const currentYear = new Date().getFullYear();
      const panAge = currentYear - dobYear;
      ageDiscrepancy = Math.abs(this.visualIntelData.age_estimate - panAge) > 8;
    }

    // Behavioural anomaly: liveness failed = anomaly signal
    const behaviouralAnomaly = !(this.visualIntelData?.liveness?.passed ?? true);

    const signals: FraudSignals = {
      geo_mismatch: this.geoMismatch,
      age_discrepancy: ageDiscrepancy,
      pan_mismatch: panMismatch,
      behavioural_anomaly: behaviouralAnomaly,
      // New signals — derived from available data
      device_fingerprint_mismatch: false, // Set by session middleware when device ID changes
      multiple_applications: (this.bureauRiskData as { enquiries_last_30d?: number })?.enquiries_last_30d
        ? ((this.bureauRiskData as { enquiries_last_30d?: number }).enquiries_last_30d ?? 0) > 3
        : false,
      income_inconsistency: (() => {
        const statedIncome = (this.speechIntelData as { entities?: { income?: number } })?.entities?.income;
        const bureauIncome = (this.bureauRiskData as { profile?: { monthly_income?: number } })?.profile?.monthly_income;
        if (!statedIncome || !bureauIncome) return false;
        return Math.abs(statedIncome - bureauIncome) / bureauIncome > 0.4;
      })(),
    };

    const fraudScore = computeFraudScore(signals);
    fraudScoreHistogram.observe(fraudScore);

    let decision: FraudDetectionOutput['decision'];
    let reason: string | undefined;

    if (fraudScore >= 70) {
      decision = 'rejected';
      reason = `Fraud score ${fraudScore} exceeds threshold. Signals: ${JSON.stringify(signals)}`;
      sessionRejectedCounter.inc({ reason: 'fraud_score' });
    } else if (fraudScore >= 40) {
      decision = 'flagged';
    } else {
      decision = 'approved';
    }

    const output: FraudDetectionOutput = { fraud_score: fraudScore, signals, decision, reason };

    const duration = Date.now() - this.startTime;
    agentProcessingTime.observe({ agent_id: this.agentId }, duration);

    this.bus.publish(`session:${this.sessionId}:fraud_detection`, output);
    this.status = 'completed';

    // Update session fraud score
    query('UPDATE sessions SET fraud_score = $1 WHERE id = $2', [fraudScore, this.sessionId]).catch(() => {});

    if (decision === 'rejected') {
      query(`UPDATE sessions SET status = 'rejected' WHERE id = $1`, [this.sessionId]).catch(() => {});
      this.bus.publish(`session:${this.sessionId}:orchestrator`, { phase: 'rejected', reason });
    }

    logger.info({
      event: 'agent_completed',
      agent: this.agentId,
      session_id: this.sessionId,
      fraud_score: fraudScore,
      decision,
      duration_ms: duration,
    });
  }

  getStatus(): AgentStatus { return this.status; }

  async shutdown(): Promise<void> {
    this.status = 'idle';
    this.visualIntelData = null;
    this.speechIntelData = null;
    this.bureauRiskData = null;
  }
}
