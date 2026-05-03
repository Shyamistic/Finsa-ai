import { EventBus } from '../orchestrator/EventBus';
import { BedrockConversation } from '../services/BedrockConversation';
import { IAgent, AgentStatus } from './IAgent';
import { logger } from '../lib/logger';
import { agentProcessingTime, offerGeneratedCounter } from '../lib/metrics';
import { BureauRiskOutput } from './BureauRiskAgent';
import { PersonaOutput, Persona } from './PersonaClassifierAgent';
import { FraudDetectionOutput } from './FraudDetectionAgent';
import { query } from '../db/db';

export interface TenureOption {
  months: number;
  emi: number;
  total_interest: number;
}

export interface LoanOffer {
  amount: number;
  rate_pa: number;
  tenure_options: TenureOption[];
  recommended_tenure_months: number;
  emi: number;
  explanation_en: string;
  explanation_hi: string;
  top_factors: string[];
}

interface PolicyRule {
  id: string;
  persona: string;
  risk_band: string;
  min_amount: number;
  max_amount: number;
  min_rate: number;
  max_rate: number;
  tenures: number[];
}

function calculateEMI(principal: number, annualRate: number, months: number): number {
  const r = annualRate / 12 / 100;
  if (r === 0) return Math.round(principal / months);
  const emi = (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
  return Math.round(emi);
}

async function loadPolicyRules(): Promise<PolicyRule[]> {
  try {
    const rows = await query<{ rules: { rules: PolicyRule[] } }>('SELECT rules FROM policy_rules WHERE id = 1');
    return rows[0]?.rules?.rules ?? getDefaultRules();
  } catch {
    return getDefaultRules();
  }
}

function getDefaultRules(): PolicyRule[] {
  // Poonawalla Fincorp actual rate bands (2025)
  return [
    // Personal Loan — Salaried Urban (best profile)
    { id: 'r001', persona: 'Salaried-Urban', risk_band: 'Low', min_amount: 100000, max_amount: 5000000, min_rate: 9.99, max_rate: 13.0, tenures: [12, 24, 36, 60, 84] },
    { id: 'r002', persona: 'Salaried-Urban', risk_band: 'Medium', min_amount: 50000, max_amount: 2000000, min_rate: 13.0, max_rate: 16.0, tenures: [12, 24, 36] },
    { id: 'r003', persona: 'Salaried-Urban', risk_band: 'High', min_amount: 50000, max_amount: 500000, min_rate: 16.0, max_rate: 20.0, tenures: [12, 24, 36] },
    // Professional Loan (Doctors, CAs, Lawyers)
    { id: 'r004', persona: 'Professional', risk_band: 'Low', min_amount: 200000, max_amount: 7500000, min_rate: 11.0, max_rate: 14.0, tenures: [12, 24, 36, 48, 60] },
    { id: 'r005', persona: 'Professional', risk_band: 'Medium', min_amount: 100000, max_amount: 3000000, min_rate: 14.0, max_rate: 17.0, tenures: [12, 24, 36] },
    // MSME / Business Loan
    { id: 'r006', persona: 'MSME-Owner', risk_band: 'Low', min_amount: 200000, max_amount: 7500000, min_rate: 15.0, max_rate: 18.0, tenures: [12, 24, 36, 48, 60] },
    { id: 'r007', persona: 'MSME-Owner', risk_band: 'Medium', min_amount: 100000, max_amount: 3000000, min_rate: 18.0, max_rate: 21.0, tenures: [12, 24, 36] },
    { id: 'r008', persona: 'MSME-Owner', risk_band: 'High', min_amount: 50000, max_amount: 1000000, min_rate: 21.0, max_rate: 24.0, tenures: [12, 24, 36] },
    // Self-Employed
    { id: 'r009', persona: 'Self-Employed-Tier2', risk_band: 'Low', min_amount: 100000, max_amount: 3000000, min_rate: 12.0, max_rate: 16.0, tenures: [12, 24, 36] },
    { id: 'r010', persona: 'Self-Employed-Tier2', risk_band: 'Medium', min_amount: 50000, max_amount: 1500000, min_rate: 16.0, max_rate: 20.0, tenures: [12, 24, 36] },
    // First-Time Borrower / NTC — Instant Loan product
    { id: 'r011', persona: 'First-Time-Borrower', risk_band: 'Medium', min_amount: 50000, max_amount: 500000, min_rate: 16.0, max_rate: 20.0, tenures: [12, 24, 36] },
    { id: 'r012', persona: 'NTC', risk_band: 'Medium', min_amount: 50000, max_amount: 300000, min_rate: 16.0, max_rate: 22.0, tenures: [12, 24, 36] },
  ];
}

export class OfferEngineAgent implements IAgent {
  agentId = 'offer';
  private status: AgentStatus = 'idle';
  private sessionId = '';
  private startTime = 0;
  private bureauData: BureauRiskOutput | null = null;
  private personaData: PersonaOutput | null = null;
  private fraudData: FraudDetectionOutput | null = null;

  constructor(private bus: EventBus) {}

  async init(sessionId: string): Promise<void> {
    this.sessionId = sessionId;
    this.status = 'initialising';
    this.bureauData = null;
    this.personaData = null;
    this.fraudData = null;
    logger.info({ event: 'agent_init', agent: this.agentId, session_id: sessionId });
  }

  async start(): Promise<void> {
    this.status = 'running';
    this.startTime = Date.now();
    logger.info({ event: 'agent_start', agent: this.agentId, session_id: this.sessionId });

    this.bus.subscribe(`session:${this.sessionId}:bureau_risk`, (data) => {
      this.bureauData = data as BureauRiskOutput;
      this.tryGenerate();
    });

    this.bus.subscribe(`session:${this.sessionId}:persona`, (data) => {
      this.personaData = data as PersonaOutput;
      this.tryGenerate();
    });

    this.bus.subscribe(`session:${this.sessionId}:fraud_detection`, (data) => {
      this.fraudData = data as FraudDetectionOutput;
      this.tryGenerate();
    });
  }

  private tryGenerate(): void {
    if (!this.bureauData || !this.personaData || !this.fraudData) return;
    // Guard: only generate once
    if (this.status === 'completed') return;
    if (this.fraudData.decision === 'rejected') {
      this.status = 'completed';
      return; // No offer for rejected sessions
    }
    this.status = 'completed'; // Set before async to prevent re-entry
    this.generateOffer();
  }

  private async generateOffer(): Promise<void> {
    const bureau = this.bureauData!;
    const persona = this.personaData!;

    const rules = await loadPolicyRules();
    const rule = rules.find(r => r.persona === persona.persona && r.risk_band === bureau.risk_band)
      ?? rules.find(r => r.risk_band === bureau.risk_band)
      ?? rules[0];

    // Compute offer amount based on income and DTI
    const income = bureau.profile?.monthly_income ?? 50000;
    const existingEmis = bureau.profile?.existing_emis ?? 0;
    const availableEmi = income * 0.5 - existingEmis; // 50% FOIR
    const maxAffordableAmount = availableEmi * 36 / (1 + 0.15); // rough 15% rate estimate

    const amount = Math.max(
      rule.min_amount,
      Math.min(rule.max_amount, Math.round(maxAffordableAmount / 10000) * 10000)
    );

    // Rate: interpolate based on credit score
    const creditScore = bureau.credit_score ?? 600;
    const scoreRatio = Math.max(0, Math.min(1, (creditScore - 500) / 350));
    const rate = Math.round((rule.max_rate - (rule.max_rate - rule.min_rate) * scoreRatio) * 10) / 10;

    // 3 tenure options
    const tenureOptions: TenureOption[] = rule.tenures.map(months => {
      const emi = calculateEMI(amount, rate, months);
      const totalInterest = emi * months - amount;
      return { months, emi, total_interest: Math.round(totalInterest) };
    });

    const recommendedTenure = rule.tenures[1]; // middle option
    const recommendedEmi = tenureOptions.find(t => t.months === recommendedTenure)?.emi ?? tenureOptions[0].emi;

    // Generate bilingual explanation via Claude
    const topFactors = this.buildTopFactors(bureau, persona);
    const explanations = await this.generateExplanations(amount, rate, topFactors, persona.persona);

    const offer: LoanOffer = {
      amount,
      rate_pa: rate,
      tenure_options: tenureOptions,
      recommended_tenure_months: recommendedTenure,
      emi: recommendedEmi,
      explanation_en: explanations.en,
      explanation_hi: explanations.hi,
      top_factors: topFactors,
    };

    const duration = Date.now() - this.startTime;
    agentProcessingTime.observe({ agent_id: this.agentId }, duration);
    offerGeneratedCounter.inc();

    // Persist offer to session
    await query('UPDATE sessions SET offer = $1, status = $2 WHERE id = $3', [
      JSON.stringify(offer),
      'offer_delivered',
      this.sessionId,
    ]);

    this.bus.publish(`session:${this.sessionId}:offer`, offer);
    this.status = 'completed';

    logger.info({
      event: 'agent_completed',
      agent: this.agentId,
      session_id: this.sessionId,
      amount,
      rate_pa: rate,
      duration_ms: duration,
    });
  }

  private buildTopFactors(bureau: BureauRiskOutput, persona: PersonaOutput): string[] {
    const factors: string[] = [];
    if (bureau.credit_score && bureau.credit_score >= 700) {
      factors.push(`Strong credit score of ${bureau.credit_score}`);
    } else if (bureau.credit_score) {
      factors.push(`Credit score of ${bureau.credit_score}`);
    }
    if (bureau.profile?.monthly_income) {
      factors.push(`Monthly income of ₹${bureau.profile.monthly_income.toLocaleString('en-IN')}`);
    }
    factors.push(`${persona.persona} profile — ${persona.rationale}`);
    return factors.slice(0, 3);
  }

  private async generateExplanations(
    amount: number,
    rate: number,
    factors: string[],
    persona: Persona
  ): Promise<{ en: string; hi: string }> {
    try {
      const prompt = `Generate a 1-2 sentence friendly loan offer explanation for a ${persona} customer.
Loan: ₹${amount.toLocaleString('en-IN')} at ${rate}% p.a.
Key factors: ${factors.slice(0, 2).join(', ')}
Output JSON only: {"en": "...", "hi": "..."}
Hindi should be natural conversational Hinglish.`;

      const result = await BedrockConversation.chat('', [
        { role: 'user', content: [{ text: prompt }] }
      ], 0.3, 150);

      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return { en: parsed.en ?? '', hi: parsed.hi ?? '' };
      }
    } catch (err) {
      logger.error({ event: 'explanation_generation_error', err });
    }

    // Fallback
    return {
      en: `Based on your ${persona} profile, you qualify for ₹${amount.toLocaleString('en-IN')} at ${rate}% p.a. Your ${factors[0] ?? 'strong profile'} helped secure this offer.`,
      hi: `Aapki profile ke hisaab se, aapko ₹${amount.toLocaleString('en-IN')} ${rate}% per annum par mil sakta hai!`,
    };
  }

  getStatus(): AgentStatus { return this.status; }

  async shutdown(): Promise<void> {
    this.status = 'idle';
    this.bureauData = null;
    this.personaData = null;
    this.fraudData = null;
  }
}
