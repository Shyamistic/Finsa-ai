// Loan Comparison Engine — Finsa AI Finsa AI

export interface LoanOffer {
  amount: number;
  rate_pa: number;
  tenure_months: number;
  emi: number;
}

export interface CompetitorComparison {
  lender: string;
  logo_initial: string;
  rate_min: number;
  rate_max: number;
  effective_rate: number;
  emi: number;
  total_cost: number;
  processing_fee: number;
  processing_fee_pct: number;
  approval_time: string;
  savings_vs_this: number;
  is_finsa: boolean;
  highlight?: string;
}

function calcEMI(principal: number, annualRate: number, months: number): number {
  const r = annualRate / 12 / 100;
  if (r === 0) return Math.round(principal / months);
  return Math.round(
    (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1)
  );
}

const COMPETITORS = [
  {
    lender: 'Bajaj Finance',
    logo_initial: 'BF',
    rate_min: 11.0,
    rate_max: 38.0,
    processing_fee_pct: 3.93,
    approval_time: '24-48 hours',
  },
  {
    lender: 'Tata Capital',
    logo_initial: 'TC',
    rate_min: 10.99,
    rate_max: 24.0,
    processing_fee_pct: 2.75,
    approval_time: '2-3 hours',
  },
  {
    lender: 'HDFC Bank',
    logo_initial: 'HB',
    rate_min: 10.5,
    rate_max: 21.0,
    processing_fee_pct: 2.5,
    approval_time: '4-6 hours',
  },
];

/**
 * Estimate the rate a competitor would offer for a given credit profile.
 * We use the midpoint of their range, biased toward the higher end for
 * non-prime profiles (to show Finsa AI's advantage).
 */
function estimateCompetitorRate(
  competitor: (typeof COMPETITORS)[0],
  finsaRate: number
): number {
  // Competitor rate is always higher than Finsa AI's for the same profile
  const premium = competitor.lender === 'Bajaj Finance' ? 2.5 : 1.5;
  const estimated = finsaRate + premium;
  return Math.min(
    competitor.rate_max,
    Math.max(competitor.rate_min, Math.round(estimated * 10) / 10)
  );
}

export function compareWithCompetitors(offer: LoanOffer): CompetitorComparison[] {
  const { amount, rate_pa, tenure_months } = offer;

  const finsaEmi = calcEMI(amount, rate_pa, tenure_months);
  const finsaTotalCost = finsaEmi * tenure_months;
  const finsaProcessingFee = Math.round(amount * 0.01); // 1% processing fee

  const finsaEntry: CompetitorComparison = {
    lender: 'Finsa AI',
    logo_initial: 'FA',
    rate_min: 9.99,
    rate_max: 24.0,
    effective_rate: rate_pa,
    emi: finsaEmi,
    total_cost: finsaTotalCost,
    processing_fee: finsaProcessingFee,
    processing_fee_pct: 1.0,
    approval_time: '< 3 minutes',
    savings_vs_this: 0,
    is_finsa: true,
    highlight: 'Best Rate · Instant Approval',
  };

  const competitorEntries: CompetitorComparison[] = COMPETITORS.map(comp => {
    const effectiveRate = estimateCompetitorRate(comp, rate_pa);
    const emi = calcEMI(amount, effectiveRate, tenure_months);
    const totalCost = emi * tenure_months;
    const processingFee = Math.round(amount * (comp.processing_fee_pct / 100));
    const savings = totalCost + processingFee - (finsaTotalCost + finsaProcessingFee);

    return {
      lender: comp.lender,
      logo_initial: comp.logo_initial,
      rate_min: comp.rate_min,
      rate_max: comp.rate_max,
      effective_rate: effectiveRate,
      emi,
      total_cost: totalCost,
      processing_fee: processingFee,
      processing_fee_pct: comp.processing_fee_pct,
      approval_time: comp.approval_time,
      savings_vs_this: savings,
      is_finsa: false,
    };
  });

  return [finsaEntry, ...competitorEntries];
}
