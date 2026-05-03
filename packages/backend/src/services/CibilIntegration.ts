// CIBIL Score Integration Mock — Poonawalla Fincorp LoanWizard OS
// Production: replace with TransUnion CIBIL API v3

export interface CibilAccount {
  account_type: string;
  bank: string;
  sanctioned_amount: number;
  current_balance: number;
  dpd: number; // Days Past Due
  status: 'Active' | 'Closed' | 'Written Off';
  opened_date: string;
}

export interface CibilReport {
  score: number;
  report_date: string;
  pan: string;
  name: string;
  accounts: CibilAccount[];
  enquiries: number;
  enquiries_last_6m: number;
  dpd_history: number[]; // last 12 months DPD
  total_credit_limit: number;
  total_outstanding: number;
  utilisation_pct: number;
}

export interface ScoreInterpretation {
  band: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Very Poor';
  description: string;
  loan_eligibility: string;
  max_rate: number;
  min_rate: number;
}

// Mock data for 5 demo PANs
const MOCK_REPORTS: Record<string, CibilReport> = {
  ABCDE1234F: {
    score: 780,
    report_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    pan: 'ABCDE1234F',
    name: 'PRIYA SHARMA',
    accounts: [
      { account_type: 'Personal Loan', bank: 'HDFC Bank', sanctioned_amount: 500000, current_balance: 120000, dpd: 0, status: 'Active', opened_date: '2022-03-15' },
      { account_type: 'Credit Card', bank: 'ICICI Bank', sanctioned_amount: 200000, current_balance: 35000, dpd: 0, status: 'Active', opened_date: '2020-07-01' },
    ],
    enquiries: 3,
    enquiries_last_6m: 1,
    dpd_history: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    total_credit_limit: 700000,
    total_outstanding: 155000,
    utilisation_pct: 22.1,
  },
  FGHIJ5678K: {
    score: 640,
    report_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    pan: 'FGHIJ5678K',
    name: 'RAMESH PATEL',
    accounts: [
      { account_type: 'Business Loan', bank: 'Axis Bank', sanctioned_amount: 1000000, current_balance: 650000, dpd: 30, status: 'Active', opened_date: '2021-01-10' },
      { account_type: 'Credit Card', bank: 'SBI', sanctioned_amount: 100000, current_balance: 72000, dpd: 0, status: 'Active', opened_date: '2019-05-20' },
    ],
    enquiries: 7,
    enquiries_last_6m: 3,
    dpd_history: [0, 0, 30, 0, 0, 0, 30, 0, 0, 0, 0, 0],
    total_credit_limit: 1100000,
    total_outstanding: 722000,
    utilisation_pct: 65.6,
  },
  KLMNO9012P: {
    score: 580,
    report_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    pan: 'KLMNO9012P',
    name: 'SURESH KUMAR',
    accounts: [
      { account_type: 'MSME Loan', bank: 'Canara Bank', sanctioned_amount: 3000000, current_balance: 2100000, dpd: 60, status: 'Active', opened_date: '2020-06-01' },
      { account_type: 'OD Account', bank: 'Punjab National Bank', sanctioned_amount: 500000, current_balance: 480000, dpd: 0, status: 'Active', opened_date: '2021-09-15' },
    ],
    enquiries: 12,
    enquiries_last_6m: 5,
    dpd_history: [0, 60, 30, 0, 0, 60, 0, 0, 30, 0, 0, 0],
    total_credit_limit: 3500000,
    total_outstanding: 2580000,
    utilisation_pct: 73.7,
  },
  PQRST3456U: {
    score: 300,
    report_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    pan: 'PQRST3456U',
    name: 'TEST FRAUD',
    accounts: [
      { account_type: 'Personal Loan', bank: 'Unknown NBFC', sanctioned_amount: 200000, current_balance: 200000, dpd: 180, status: 'Written Off', opened_date: '2022-01-01' },
    ],
    enquiries: 28,
    enquiries_last_6m: 15,
    dpd_history: [180, 180, 90, 90, 60, 60, 30, 30, 0, 0, 0, 0],
    total_credit_limit: 200000,
    total_outstanding: 200000,
    utilisation_pct: 100,
  },
  UVWXY7890Z: {
    score: 0, // NTC — No credit history
    report_date: new Date().toISOString().split('T')[0],
    pan: 'UVWXY7890Z',
    name: 'ANJALI SINGH',
    accounts: [],
    enquiries: 0,
    enquiries_last_6m: 0,
    dpd_history: [],
    total_credit_limit: 0,
    total_outstanding: 0,
    utilisation_pct: 0,
  },
};

export class CibilIntegration {
  /**
   * Fetch CIBIL score and report for a given PAN.
   * Returns mock data for demo PANs; generates synthetic data for others.
   */
  static async fetchScore(pan: string): Promise<CibilReport> {
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 120));

    const normalised = pan.toUpperCase().trim();
    if (MOCK_REPORTS[normalised]) {
      return MOCK_REPORTS[normalised];
    }

    // Synthetic report for unknown PANs
    const syntheticScore = 600 + Math.floor(Math.random() * 150);
    return {
      score: syntheticScore,
      report_date: new Date().toISOString().split('T')[0],
      pan: normalised,
      name: 'CUSTOMER',
      accounts: [
        {
          account_type: 'Personal Loan',
          bank: 'Generic Bank',
          sanctioned_amount: 300000,
          current_balance: 100000,
          dpd: 0,
          status: 'Active',
          opened_date: '2023-01-01',
        },
      ],
      enquiries: 2,
      enquiries_last_6m: 1,
      dpd_history: new Array(12).fill(0),
      total_credit_limit: 300000,
      total_outstanding: 100000,
      utilisation_pct: 33.3,
    };
  }

  /**
   * Interpret a CIBIL score into a human-readable band and eligibility.
   */
  static interpretScore(score: number): ScoreInterpretation {
    if (score === 0) {
      return {
        band: 'Fair',
        description: 'No credit history (NTC). You are new to credit.',
        loan_eligibility: 'Eligible for Poonawalla Fincorp Instant Loan up to ₹3 Lakh',
        min_rate: 16.0,
        max_rate: 22.0,
      };
    }
    if (score >= 750) {
      return {
        band: 'Excellent',
        description: 'Excellent credit profile. You qualify for the best rates and highest loan amounts.',
        loan_eligibility: 'Eligible for up to ₹50 Lakh at rates starting 9.99% p.a.',
        min_rate: 9.99,
        max_rate: 13.0,
      };
    }
    if (score >= 700) {
      return {
        band: 'Good',
        description: 'Good credit profile. You qualify for competitive rates.',
        loan_eligibility: 'Eligible for up to ₹20 Lakh at rates starting 12% p.a.',
        min_rate: 12.0,
        max_rate: 16.0,
      };
    }
    if (score >= 650) {
      return {
        band: 'Fair',
        description: 'Fair credit profile. Some improvement areas exist.',
        loan_eligibility: 'Eligible for up to ₹10 Lakh at rates starting 15% p.a.',
        min_rate: 15.0,
        max_rate: 19.0,
      };
    }
    if (score >= 600) {
      return {
        band: 'Poor',
        description: 'Poor credit profile. Limited loan options available.',
        loan_eligibility: 'Eligible for up to ₹3 Lakh at rates starting 18% p.a.',
        min_rate: 18.0,
        max_rate: 24.0,
      };
    }
    return {
      band: 'Very Poor',
      description: 'Very poor credit profile. Significant improvement needed before loan eligibility.',
      loan_eligibility: 'Not currently eligible. Please improve your credit score.',
      min_rate: 24.0,
      max_rate: 36.0,
    };
  }
}
