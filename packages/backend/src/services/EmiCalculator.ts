// EMI Calculator Service — Finsa AI

export interface AmortizationRow {
  month: number;
  emi: number;
  principal: number;
  interest: number;
  balance: number;
}

/**
 * Calculate monthly EMI using standard reducing-balance formula.
 * @param principal  Loan amount in INR
 * @param annualRate Annual interest rate (e.g. 12.5 for 12.5%)
 * @param months     Loan tenure in months
 */
export function calculateEMI(principal: number, annualRate: number, months: number): number {
  if (principal <= 0 || months <= 0) return 0;
  const r = annualRate / 12 / 100;
  if (r === 0) return Math.round(principal / months);
  const emi = (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
  return Math.round(emi);
}

/**
 * Generate full amortization schedule.
 */
export function generateAmortizationSchedule(
  principal: number,
  annualRate: number,
  months: number
): AmortizationRow[] {
  const emi = calculateEMI(principal, annualRate, months);
  const r = annualRate / 12 / 100;
  const schedule: AmortizationRow[] = [];
  let balance = principal;

  for (let month = 1; month <= months; month++) {
    const interestComponent = Math.round(balance * r);
    const principalComponent = emi - interestComponent;
    balance = Math.max(0, balance - principalComponent);

    schedule.push({
      month,
      emi,
      principal: principalComponent,
      interest: interestComponent,
      balance: Math.round(balance),
    });
  }

  return schedule;
}

/**
 * Calculate maximum loan eligibility using 50% FOIR rule.
 * @param monthlyIncome   Gross monthly income
 * @param existingEmis    Sum of existing monthly EMI obligations
 * @param rate            Annual interest rate for the new loan
 * @param tenure          Tenure in months for the new loan
 */
export function calculateMaxEligibility(
  monthlyIncome: number,
  existingEmis: number,
  rate: number,
  tenure: number
): number {
  const maxEmiAllowed = monthlyIncome * 0.5 - existingEmis; // 50% FOIR
  if (maxEmiAllowed <= 0) return 0;

  const r = rate / 12 / 100;
  if (r === 0) return Math.round(maxEmiAllowed * tenure);

  // Reverse EMI formula: P = EMI * [(1+r)^n - 1] / [r * (1+r)^n]
  const factor = (Math.pow(1 + r, tenure) - 1) / (r * Math.pow(1 + r, tenure));
  const maxPrincipal = maxEmiAllowed * factor;

  // Round down to nearest ₹10,000
  return Math.floor(maxPrincipal / 10000) * 10000;
}
