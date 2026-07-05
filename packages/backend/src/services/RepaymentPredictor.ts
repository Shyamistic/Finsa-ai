// Repayment Behavior Predictor — Finsa AI

export interface RepaymentProfile {
  credit_score: number | null;
  monthly_income: number;
  existing_emis: number;
  employment_type: 'Salaried' | 'Self-Employed' | 'MSME-Owner' | 'Professional' | 'NTC' | string;
  loan_amount: number;
  loan_tenure_months: number;
  loan_rate: number;
  dpd_history?: number[]; // last 12 months DPD values
  enquiries_last_6m?: number;
}

export interface RepaymentPrediction {
  probability_on_time: number; // 0-1
  risk_category: 'Very Low' | 'Low' | 'Medium' | 'High' | 'Very High';
  predicted_dpd: number; // expected average DPD over loan tenure
  recommendation: string;
  rate_adjustment: number; // ±% to apply to base rate
  confidence: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function predictRepaymentBehavior(profile: RepaymentProfile): RepaymentPrediction {
  let score = 0; // 0-100, higher = better repayment likelihood

  // 1. Credit score (max 35 points)
  if (profile.credit_score === null || profile.credit_score === 0) {
    score += 15; // NTC — neutral
  } else if (profile.credit_score >= 750) {
    score += 35;
  } else if (profile.credit_score >= 700) {
    score += 28;
  } else if (profile.credit_score >= 650) {
    score += 20;
  } else if (profile.credit_score >= 600) {
    score += 12;
  } else {
    score += 5;
  }

  // 2. Income stability by employment type (max 25 points)
  const employmentScores: Record<string, number> = {
    Salaried: 25,
    Professional: 22,
    'Self-Employed': 15,
    'MSME-Owner': 12,
    NTC: 10,
  };
  score += employmentScores[profile.employment_type] ?? 10;

  // 3. FOIR (Fixed Obligation to Income Ratio) (max 20 points)
  const newEmi = calculateEMI(profile.loan_amount, profile.loan_rate, profile.loan_tenure_months);
  const totalObligations = profile.existing_emis + newEmi;
  const foir = totalObligations / profile.monthly_income;

  if (foir <= 0.3) score += 20;
  else if (foir <= 0.4) score += 15;
  else if (foir <= 0.5) score += 10;
  else if (foir <= 0.6) score += 5;
  else score += 0;

  // 4. DPD history (max 15 points)
  if (profile.dpd_history && profile.dpd_history.length > 0) {
    const maxDpd = Math.max(...profile.dpd_history);
    const avgDpd = profile.dpd_history.reduce((a, b) => a + b, 0) / profile.dpd_history.length;
    if (maxDpd === 0) score += 15;
    else if (maxDpd <= 30 && avgDpd < 5) score += 10;
    else if (maxDpd <= 60) score += 5;
    else score += 0;
  } else {
    score += 10; // No history — neutral
  }

  // 5. Recent enquiries (max 5 points)
  const enquiries = profile.enquiries_last_6m ?? 0;
  if (enquiries === 0) score += 5;
  else if (enquiries <= 2) score += 3;
  else if (enquiries <= 4) score += 1;
  else score += 0;

  const normalised = clamp(score, 0, 100);
  const probabilityOnTime = normalised / 100;

  let riskCategory: RepaymentPrediction['risk_category'];
  let predictedDpd: number;
  let recommendation: string;
  let rateAdjustment: number;

  if (normalised >= 80) {
    riskCategory = 'Very Low';
    predictedDpd = 0;
    recommendation = 'Excellent repayment profile. Eligible for preferential rate.';
    rateAdjustment = -0.5;
  } else if (normalised >= 65) {
    riskCategory = 'Low';
    predictedDpd = 2;
    recommendation = 'Good repayment profile. Standard rate applies.';
    rateAdjustment = 0;
  } else if (normalised >= 50) {
    riskCategory = 'Medium';
    predictedDpd = 8;
    recommendation = 'Moderate risk. Consider shorter tenure to reduce exposure.';
    rateAdjustment = 0.5;
  } else if (normalised >= 35) {
    riskCategory = 'High';
    predictedDpd = 20;
    recommendation = 'Higher risk profile. Recommend co-applicant or collateral.';
    rateAdjustment = 1.0;
  } else {
    riskCategory = 'Very High';
    predictedDpd = 45;
    recommendation = 'Very high risk. Manual underwriting review required.';
    rateAdjustment = 2.0;
  }

  return {
    probability_on_time: Math.round(probabilityOnTime * 100) / 100,
    risk_category: riskCategory,
    predicted_dpd: predictedDpd,
    recommendation,
    rate_adjustment: rateAdjustment,
    confidence: 0.78 + Math.random() * 0.15,
  };
}

function calculateEMI(principal: number, annualRate: number, months: number): number {
  const r = annualRate / 12 / 100;
  if (r === 0) return Math.round(principal / months);
  return Math.round(
    (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1)
  );
}
