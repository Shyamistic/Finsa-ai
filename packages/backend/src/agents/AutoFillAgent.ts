/**
 * AutoFillAgent — Nova Act-powered form auto-fill
 *
 * This is the "Auto-Fill & Alternate Data Generation" node from the
 * Poonawalla Fincorp architecture diagram. It:
 *
 * 1. Listens to speech_intel events as entities are extracted turn-by-turn
 * 2. Validates each field in real-time (format, range, consistency checks)
 * 3. Generates alternate/derived data (FOIR, eligibility, propensity signals)
 * 4. Publishes a live form state that the frontend renders as an auto-filling form
 * 5. Flags errors and inconsistencies for the fraud agent
 *
 * In production this would use Amazon Nova Act to actually drive a browser form.
 * Here we implement the intelligence layer that Nova Act would consume.
 */

import { EventBus } from '../orchestrator/EventBus';
import { IAgent, AgentStatus } from './IAgent';
import { logger } from '../lib/logger';
import { agentProcessingTime } from '../lib/metrics';
import { ExtractedEntities } from './SpeechIntelAgent';
import { BedrockConversation } from '../services/BedrockConversation';

export interface FormField {
  id: string;
  label: string;
  value: string | number | null;
  status: 'empty' | 'filling' | 'valid' | 'error' | 'derived';
  error?: string;
  source: 'speech' | 'bureau' | 'derived' | 'ocr';
  confidence: number; // 0-1
  filled_at?: number;
}

export interface LoanApplicationForm {
  // Section 1: Personal Details
  full_name: FormField;
  pan_number: FormField;
  date_of_birth: FormField;
  age: FormField;

  // Section 2: Employment & Income
  employment_type: FormField;
  monthly_income: FormField;
  employer_name: FormField;

  // Section 3: Loan Details
  loan_purpose: FormField;
  loan_amount_requested: FormField;
  preferred_tenure_months: FormField;

  // Section 4: Existing Obligations
  existing_emis: FormField;
  foir: FormField; // Fixed Obligation to Income Ratio — derived

  // Section 5: Derived / Alternate Data
  max_eligible_amount: FormField;
  recommended_tenure: FormField;
  risk_indicator: FormField;
}

export interface AutoFillOutput {
  form: LoanApplicationForm;
  completion_pct: number;
  errors: string[];
  warnings: string[];
  alternate_data: {
    foir: number;
    max_eligible_emi: number;
    max_eligible_amount: number;
    income_stability_score: number;
    recommended_tenure_months: number;
  };
  nova_act_actions: NovaActAction[]; // What Nova Act would do in a real browser
}

export interface NovaActAction {
  action: 'fill' | 'click' | 'validate' | 'scroll' | 'screenshot';
  field_id?: string;
  value?: string;
  description: string;
  timestamp: number;
}

function makeField(
  id: string,
  label: string,
  value: string | number | null = null,
  status: FormField['status'] = 'empty',
  source: FormField['source'] = 'speech',
  confidence = 0,
  error?: string
): FormField {
  return { id, label, value, status, source, confidence, error, filled_at: value ? Date.now() : undefined };
}

function validatePAN(pan: string): { valid: boolean; error?: string } {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (!panRegex.test(pan.toUpperCase())) {
    return { valid: false, error: 'PAN format invalid. Expected: ABCDE1234F' };
  }
  return { valid: true };
}

function validateIncome(income: number): { valid: boolean; error?: string } {
  if (income < 15000) return { valid: false, error: 'Minimum income for eligibility is ₹15,000/month' };
  if (income > 10000000) return { valid: false, error: 'Income value seems unusually high — please verify' };
  return { valid: true };
}

function validateTenure(months: number): { valid: boolean; error?: string } {
  if (months < 12) return { valid: false, error: 'Minimum tenure is 12 months' };
  if (months > 84) return { valid: false, error: 'Maximum tenure is 84 months' };
  return { valid: true };
}

function computeFOIR(monthlyIncome: number, existingEmis: number): number {
  if (monthlyIncome <= 0) return 0;
  return Math.round((existingEmis / monthlyIncome) * 100);
}

function computeMaxEligibleAmount(
  monthlyIncome: number,
  existingEmis: number,
  tenureMonths: number,
  annualRate = 12.0
): number {
  // 50% FOIR rule: available EMI = 50% of income - existing EMIs
  const availableEmi = monthlyIncome * 0.5 - existingEmis;
  if (availableEmi <= 0) return 0;

  // Reverse EMI formula to get principal
  const r = annualRate / 12 / 100;
  if (r === 0) return availableEmi * tenureMonths;
  const principal = availableEmi * (Math.pow(1 + r, tenureMonths) - 1) / (r * Math.pow(1 + r, tenureMonths));
  return Math.round(principal / 10000) * 10000; // Round to nearest 10K
}

function buildNovaActActions(entities: ExtractedEntities, form: LoanApplicationForm): NovaActAction[] {
  const actions: NovaActAction[] = [];
  const now = Date.now();

  // Nova Act would perform these browser actions in sequence
  if (entities.loan_purpose) {
    actions.push({
      action: 'fill',
      field_id: 'loan_purpose',
      value: entities.loan_purpose,
      description: `Auto-fill loan purpose: "${entities.loan_purpose}" (extracted from speech)`,
      timestamp: now,
    });
  }

  if (entities.employment_type) {
    actions.push({
      action: 'fill',
      field_id: 'employment_type',
      value: entities.employment_type,
      description: `Auto-fill employment type: "${entities.employment_type}"`,
      timestamp: now + 100,
    });
  }

  if (entities.income) {
    actions.push({
      action: 'fill',
      field_id: 'monthly_income',
      value: String(entities.income),
      description: `Auto-fill monthly income: ₹${entities.income.toLocaleString('en-IN')}`,
      timestamp: now + 200,
    });
  }

  if (entities.existing_emis !== undefined) {
    actions.push({
      action: 'fill',
      field_id: 'existing_emis',
      value: String(entities.existing_emis),
      description: `Auto-fill existing EMIs: ₹${entities.existing_emis.toLocaleString('en-IN')}`,
      timestamp: now + 300,
    });
  }

  if (entities.preferred_tenure_months) {
    actions.push({
      action: 'fill',
      field_id: 'preferred_tenure',
      value: String(entities.preferred_tenure_months),
      description: `Auto-fill preferred tenure: ${entities.preferred_tenure_months} months`,
      timestamp: now + 400,
    });
  }

  if (entities.pan) {
    actions.push({
      action: 'fill',
      field_id: 'pan_number',
      value: entities.pan.toUpperCase(),
      description: `Auto-fill PAN: ${entities.pan.toUpperCase()} (captured via speech/OCR)`,
      timestamp: now + 500,
    });
    actions.push({
      action: 'validate',
      field_id: 'pan_number',
      description: 'Validate PAN format and cross-check with bureau',
      timestamp: now + 600,
    });
  }

  // Derived fields
  if (form.max_eligible_amount.value) {
    actions.push({
      action: 'fill',
      field_id: 'loan_amount_requested',
      value: String(form.max_eligible_amount.value),
      description: `Auto-suggest loan amount: ₹${Number(form.max_eligible_amount.value).toLocaleString('en-IN')} (based on FOIR)`,
      timestamp: now + 700,
    });
  }

  actions.push({
    action: 'screenshot',
    description: 'Capture form state for audit trail',
    timestamp: now + 800,
  });

  return actions;
}

export class AutoFillAgent implements IAgent {
  agentId = 'auto_fill';
  private status: AgentStatus = 'idle';
  private sessionId = '';
  private startTime = 0;
  private currentForm: LoanApplicationForm | null = null;
  private bureauData: { name?: string; dob?: string } | null = null;

  constructor(private bus: EventBus) {}

  async init(sessionId: string): Promise<void> {
    this.sessionId = sessionId;
    this.status = 'initialising';
    this.currentForm = null;
    this.bureauData = null;
    logger.info({ event: 'agent_init', agent: this.agentId, session_id: sessionId });
  }

  async start(): Promise<void> {
    this.status = 'running';
    this.startTime = Date.now();
    logger.info({ event: 'agent_start', agent: this.agentId, session_id: this.sessionId });

    // Initialize empty form
    this.currentForm = this.buildEmptyForm();
    this.bus.publish(`session:${this.sessionId}:auto_fill`, {
      form: this.currentForm,
      completion_pct: 0,
      errors: [],
      warnings: [],
      alternate_data: { foir: 0, max_eligible_emi: 0, max_eligible_amount: 0, income_stability_score: 0, recommended_tenure_months: 36 },
      nova_act_actions: [],
    } as AutoFillOutput);

    // Subscribe to speech intel — update form on every turn
    this.bus.subscribe(`session:${this.sessionId}:speech_intel`, (data) => {
      const d = data as { entities?: ExtractedEntities; interview_complete?: boolean };
      if (d.entities) {
        this.updateForm(d.entities, d.interview_complete ?? false);
      }
    });

    // Subscribe to bureau risk — fill name, DOB from bureau
    this.bus.subscribe(`session:${this.sessionId}:bureau_risk`, (data) => {
      const d = data as { profile?: { name?: string; dob?: string } };
      if (d.profile) {
        this.bureauData = { name: d.profile.name, dob: d.profile.dob };
        if (this.currentForm) {
          this.updateFormFromBureau();
        }
      }
    });

    // Subscribe to visual intel — fill age from video
    this.bus.subscribe(`session:${this.sessionId}:visual_intel`, (data) => {
      const d = data as { age_estimate?: number };
      if (d.age_estimate && this.currentForm) {
        this.currentForm.age = makeField('age', 'Age (from video)', d.age_estimate, 'derived', 'derived', 0.85);
        this.publishForm();
      }
    });
  }

  private buildEmptyForm(): LoanApplicationForm {
    return {
      full_name: makeField('full_name', 'Full Name'),
      pan_number: makeField('pan_number', 'PAN Number'),
      date_of_birth: makeField('date_of_birth', 'Date of Birth'),
      age: makeField('age', 'Age (from video)'),
      employment_type: makeField('employment_type', 'Employment Type'),
      monthly_income: makeField('monthly_income', 'Monthly Income (₹)'),
      employer_name: makeField('employer_name', 'Employer / Business Name'),
      loan_purpose: makeField('loan_purpose', 'Loan Purpose'),
      loan_amount_requested: makeField('loan_amount_requested', 'Loan Amount Requested (₹)'),
      preferred_tenure_months: makeField('preferred_tenure_months', 'Preferred Tenure (months)'),
      existing_emis: makeField('existing_emis', 'Existing EMIs (₹/month)'),
      foir: makeField('foir', 'FOIR % (derived)', null, 'empty', 'derived'),
      max_eligible_amount: makeField('max_eligible_amount', 'Max Eligible Amount (₹)', null, 'empty', 'derived'),
      recommended_tenure: makeField('recommended_tenure', 'Recommended Tenure', null, 'empty', 'derived'),
      risk_indicator: makeField('risk_indicator', 'Risk Indicator', null, 'empty', 'derived'),
    };
  }

  private updateForm(entities: ExtractedEntities, interviewComplete: boolean): void {
    if (!this.currentForm) return;
    const form = this.currentForm;
    const errors: string[] = [];
    const warnings: string[] = [];

    // Fill fields from speech entities
    if (entities.loan_purpose) {
      form.loan_purpose = makeField('loan_purpose', 'Loan Purpose', entities.loan_purpose, 'valid', 'speech', 0.92);
    }

    if (entities.employment_type) {
      form.employment_type = makeField('employment_type', 'Employment Type', entities.employment_type, 'valid', 'speech', 0.90);
    }

    if (entities.income) {
      const validation = validateIncome(entities.income);
      form.monthly_income = makeField(
        'monthly_income', 'Monthly Income (₹)', entities.income,
        validation.valid ? 'valid' : 'error', 'speech', 0.88,
        validation.error
      );
      if (!validation.valid) errors.push(validation.error!);
    }

    if (entities.existing_emis !== undefined) {
      form.existing_emis = makeField('existing_emis', 'Existing EMIs (₹/month)', entities.existing_emis, 'valid', 'speech', 0.85);
    }

    if (entities.preferred_tenure_months) {
      const validation = validateTenure(entities.preferred_tenure_months);
      form.preferred_tenure_months = makeField(
        'preferred_tenure_months', 'Preferred Tenure (months)', entities.preferred_tenure_months,
        validation.valid ? 'valid' : 'error', 'speech', 0.87,
        validation.error
      );
      if (!validation.valid) errors.push(validation.error!);
    }

    if (entities.pan) {
      const panUpper = entities.pan.toUpperCase();
      const validation = validatePAN(panUpper);
      form.pan_number = makeField(
        'pan_number', 'PAN Number', panUpper,
        validation.valid ? 'valid' : 'error', 'speech', 0.95,
        validation.error
      );
      if (!validation.valid) errors.push(validation.error!);
    }

    // Compute derived fields
    const income = typeof form.monthly_income.value === 'number' ? form.monthly_income.value : 0;
    const emis = typeof form.existing_emis.value === 'number' ? form.existing_emis.value : 0;
    const tenure = typeof form.preferred_tenure_months.value === 'number' ? form.preferred_tenure_months.value : 36;

    if (income > 0) {
      const foir = computeFOIR(income, emis);
      form.foir = makeField('foir', 'FOIR %', foir, 'derived', 'derived', 1.0);

      if (foir > 60) {
        warnings.push(`FOIR is ${foir}% — above 60% threshold. Loan eligibility may be reduced.`);
      }

      const maxAmount = computeMaxEligibleAmount(income, emis, tenure);
      form.max_eligible_amount = makeField('max_eligible_amount', 'Max Eligible Amount (₹)', maxAmount, 'derived', 'derived', 0.9);

      // Auto-suggest loan amount if not set
      if (!form.loan_amount_requested.value) {
        form.loan_amount_requested = makeField('loan_amount_requested', 'Loan Amount Requested (₹)', maxAmount, 'derived', 'derived', 0.8);
      }

      // Income stability score (mock ML signal)
      const stabilityScore = Math.min(100, Math.round(
        (form.employment_type.value === 'Salaried' ? 80 : 60) +
        (income > 50000 ? 10 : 0) +
        (foir < 40 ? 10 : 0)
      ));
      form.risk_indicator = makeField('risk_indicator', 'Risk Indicator', stabilityScore > 70 ? 'Low' : stabilityScore > 50 ? 'Medium' : 'High', 'derived', 'derived', 0.85);
    }

    // Recommended tenure based on income and amount
    const recTenure = income > 80000 ? 36 : income > 50000 ? 48 : 60;
    form.recommended_tenure = makeField('recommended_tenure', 'Recommended Tenure', recTenure + ' months', 'derived', 'derived', 0.8);

    this.currentForm = form;

    // Build Nova Act actions
    const novaActions = buildNovaActActions(entities, form);

    // Compute completion
    const fields = Object.values(form);
    const filled = fields.filter(f => f.value !== null && f.status !== 'empty').length;
    const completionPct = Math.round((filled / fields.length) * 100);

    const output: AutoFillOutput = {
      form,
      completion_pct: completionPct,
      errors,
      warnings,
      alternate_data: {
        foir: typeof form.foir.value === 'number' ? form.foir.value : 0,
        max_eligible_emi: income > 0 ? Math.round(income * 0.5 - emis) : 0,
        max_eligible_amount: typeof form.max_eligible_amount.value === 'number' ? form.max_eligible_amount.value : 0,
        income_stability_score: typeof form.risk_indicator.value === 'string' ? (form.risk_indicator.value === 'Low' ? 85 : form.risk_indicator.value === 'Medium' ? 60 : 35) : 50,
        recommended_tenure_months: recTenure,
      },
      nova_act_actions: novaActions,
    };

    this.bus.publish(`session:${this.sessionId}:auto_fill`, output);

    if (interviewComplete) {
      this.status = 'completed';
      const duration = Date.now() - this.startTime;
      agentProcessingTime.observe({ agent_id: this.agentId }, duration);
      logger.info({
        event: 'agent_completed',
        agent: this.agentId,
        session_id: this.sessionId,
        completion_pct: completionPct,
        errors: errors.length,
        duration_ms: duration,
      });
    }
  }

  private updateFormFromBureau(): void {
    if (!this.currentForm || !this.bureauData) return;
    if (this.bureauData.name) {
      this.currentForm.full_name = makeField('full_name', 'Full Name', this.bureauData.name, 'valid', 'bureau', 0.99);
    }
    if (this.bureauData.dob) {
      this.currentForm.date_of_birth = makeField('date_of_birth', 'Date of Birth', this.bureauData.dob, 'valid', 'bureau', 0.99);
      const age = new Date().getFullYear() - new Date(this.bureauData.dob).getFullYear();
      this.currentForm.age = makeField('age', 'Age', age, 'valid', 'bureau', 0.99);
    }
    this.publishForm();
  }

  private publishForm(): void {
    if (!this.currentForm) return;
    const fields = Object.values(this.currentForm);
    const filled = fields.filter(f => f.value !== null && f.status !== 'empty').length;
    this.bus.publish(`session:${this.sessionId}:auto_fill`, {
      form: this.currentForm,
      completion_pct: Math.round((filled / fields.length) * 100),
      errors: [],
      warnings: [],
      alternate_data: { foir: 0, max_eligible_emi: 0, max_eligible_amount: 0, income_stability_score: 0, recommended_tenure_months: 36 },
      nova_act_actions: [],
    } as AutoFillOutput);
  }

  getStatus(): AgentStatus { return this.status; }

  async shutdown(): Promise<void> {
    this.status = 'idle';
    this.currentForm = null;
    this.bureauData = null;
  }
}
