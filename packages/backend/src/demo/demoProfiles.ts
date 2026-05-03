export interface BureauProfile {
  name: string;
  dob: string;
  credit_score: number | null;
  monthly_income: number;
  employment: string;
  city_tier: number;
  existing_emis: number;
  risk_band: 'Low' | 'Medium' | 'High';
  fraud_flag?: boolean;
  ntc?: boolean;
}

export const MOCK_BUREAU: Record<string, BureauProfile> = {
  'ABCDE1234F': {
    name: 'Priya Sharma',
    dob: '1990-03-15',
    credit_score: 780,
    monthly_income: 85000,
    employment: 'Salaried',
    city_tier: 1,
    existing_emis: 8000,
    risk_band: 'Low',
  },
  'FGHIJ5678K': {
    name: 'Ramesh Patel',
    dob: '1985-07-22',
    credit_score: 640,
    monthly_income: 55000,
    employment: 'Self-Employed',
    city_tier: 2,
    existing_emis: 15000,
    risk_band: 'Medium',
  },
  'KLMNO9012P': {
    name: 'Suresh Kumar',
    dob: '1978-11-08',
    credit_score: 580,
    monthly_income: 120000,
    employment: 'MSME-Owner',
    city_tier: 3,
    existing_emis: 35000,
    risk_band: 'High',
  },
  'PQRST3456U': {
    name: 'Test Fraud',
    dob: '1995-01-01',
    credit_score: 300,
    monthly_income: 0,
    employment: 'Unknown',
    city_tier: 2,
    existing_emis: 0,
    risk_band: 'High',
    fraud_flag: true,
  },
  'UVWXY7890Z': {
    name: 'Anjali Singh',
    dob: '2000-06-30',
    credit_score: null,
    monthly_income: 30000,
    employment: 'Salaried',
    city_tier: 2,
    existing_emis: 0,
    risk_band: 'Medium',
    ntc: true,
  },
};
