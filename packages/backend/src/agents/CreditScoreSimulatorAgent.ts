// Credit Score Simulator Agent — Poonawalla Fincorp LoanWizard OS
import { EventBus } from '../orchestrator/EventBus';
import { IAgent, AgentStatus } from './IAgent';
import { logger } from '../lib/logger';

export interface CreditScoreAction {
  action: string;
  description: string;
  projected_score_improvement: number;
  new_score: number;
  new_offer_amount: number;
  new_rate: number;
  timeline_months: number;
}

export interface CreditScoreSimulatorOutput {
  current_score: number;
  current_band: string;
  actions: CreditScoreAction[];
  best_action: CreditScoreAction;
}

function scoreBand(score: number): string {
  if (score >= 750) return 'Excellent';
  if (score >= 700) return 'Good';
  if (score >= 650) return 'Fair';
  if (score >= 600) return 'Poor';
  return 'Very Poor';
}

function estimateOfferForScore(
  score: number,
  monthlyIncome: number
): { amount: number; rate: number } {
  const baseAmount = monthlyIncome * 20; // rough 20x income
  let rate: number;
  let multiplier: number;

  if (score >= 750) { rate = 10.5; multiplier = 1.0; }
  else if (score >= 700) { rate = 12.5; multiplier = 0.85; }
  else if (score >= 650) { rate = 15.0; multiplier = 0.65; }
  else if (score >= 600) { rate = 18.0; multiplier = 0.45; }
  else { rate = 22.0; multiplier = 0.25; }

  return {
    amount: Math.floor((baseAmount * multiplier) / 10000) * 10000,
    rate,
  };
}

export function simulateCreditScoreActions(
  currentScore: number,
  monthlyIncome: number
): CreditScoreSimulatorOutput {
  const actions: CreditScoreAction[] = [
    {
      action: 'Pay all EMIs on time for 6 months',
      description: 'Consistent on-time payments are the single biggest factor in your credit score. Set up NACH auto-debit to never miss a payment.',
      projected_score_improvement: 35,
      new_score: Math.min(900, currentScore + 35),
      new_offer_amount: estimateOfferForScore(Math.min(900, currentScore + 35), monthlyIncome).amount,
      new_rate: estimateOfferForScore(Math.min(900, currentScore + 35), monthlyIncome).rate,
      timeline_months: 6,
    },
    {
      action: 'Reduce credit card utilisation below 30%',
      description: 'High credit utilisation signals financial stress. Pay down revolving balances to below 30% of your credit limit.',
      projected_score_improvement: 25,
      new_score: Math.min(900, currentScore + 25),
      new_offer_amount: estimateOfferForScore(Math.min(900, currentScore + 25), monthlyIncome).amount,
      new_rate: estimateOfferForScore(Math.min(900, currentScore + 25), monthlyIncome).rate,
      timeline_months: 3,
    },
    {
      action: 'Add a secured credit product to your mix',
      description: 'A healthy credit mix (secured + unsecured) improves your score. Consider a secured credit card or a small gold loan.',
      projected_score_improvement: 20,
      new_score: Math.min(900, currentScore + 20),
      new_offer_amount: estimateOfferForScore(Math.min(900, currentScore + 20), monthlyIncome).amount,
      new_rate: estimateOfferForScore(Math.min(900, currentScore + 20), monthlyIncome).rate,
      timeline_months: 4,
    },
  ];

  const best = actions.reduce((a, b) =>
    a.projected_score_improvement > b.projected_score_improvement ? a : b
  );

  return {
    current_score: currentScore,
    current_band: scoreBand(currentScore),
    actions,
    best_action: best,
  };
}

export class CreditScoreSimulatorAgent implements IAgent {
  agentId = 'credit_score_simulator';
  private status: AgentStatus = 'idle';
  private sessionId = '';

  constructor(private bus: EventBus) {}

  async init(sessionId: string): Promise<void> {
    this.sessionId = sessionId;
    this.status = 'initialising';
    logger.info({ event: 'agent_init', agent: this.agentId, session_id: sessionId });
  }

  async start(): Promise<void> {
    this.status = 'running';
    logger.info({ event: 'agent_start', agent: this.agentId, session_id: this.sessionId });

    // Listen for bureau risk output which contains credit score
    this.bus.subscribe(`session:${this.sessionId}:bureau_risk`, (data) => {
      const d = data as { credit_score?: number; profile?: { monthly_income?: number } };
      const score = d.credit_score ?? 650;
      const income = d.profile?.monthly_income ?? 50000;

      const output = simulateCreditScoreActions(score, income);
      this.bus.publish(`session:${this.sessionId}:credit_score_simulator`, output);
      this.status = 'completed';

      logger.info({
        event: 'agent_completed',
        agent: this.agentId,
        session_id: this.sessionId,
        current_score: score,
      });
    });
  }

  getStatus(): AgentStatus {
    return this.status;
  }

  async shutdown(): Promise<void> {
    this.status = 'idle';
  }
}
