import { query } from '../db/db';
import { logger } from '../lib/logger';

export interface PolicyRule {
  id: string;
  persona: string;
  risk_band: 'Low' | 'Medium' | 'High';
  min_amount: number;
  max_amount: number;
  min_rate: number;
  max_rate: number;
  tenures: number[];
}

const DEFAULT_RULES: PolicyRule[] = [
  { id: 'r001', persona: 'Salaried-Urban', risk_band: 'Low', min_amount: 100000, max_amount: 5000000, min_rate: 10.5, max_rate: 14.0, tenures: [12, 24, 36] },
  { id: 'r002', persona: 'Salaried-Urban', risk_band: 'Medium', min_amount: 50000, max_amount: 2000000, min_rate: 14.0, max_rate: 18.0, tenures: [12, 24, 36] },
  { id: 'r003', persona: 'Salaried-Urban', risk_band: 'High', min_amount: 50000, max_amount: 500000, min_rate: 20.0, max_rate: 24.0, tenures: [12, 24, 36] },
  { id: 'r004', persona: 'Self-Employed-Tier2', risk_band: 'Low', min_amount: 100000, max_amount: 3000000, min_rate: 12.0, max_rate: 16.0, tenures: [12, 24, 36] },
  { id: 'r005', persona: 'Self-Employed-Tier2', risk_band: 'Medium', min_amount: 50000, max_amount: 1500000, min_rate: 15.0, max_rate: 19.0, tenures: [12, 24, 36] },
  { id: 'r006', persona: 'Self-Employed-Tier2', risk_band: 'High', min_amount: 50000, max_amount: 500000, min_rate: 20.0, max_rate: 24.0, tenures: [12, 24, 36] },
  { id: 'r007', persona: 'MSME-Owner', risk_band: 'Low', min_amount: 200000, max_amount: 5000000, min_rate: 11.0, max_rate: 15.0, tenures: [12, 24, 36] },
  { id: 'r008', persona: 'MSME-Owner', risk_band: 'Medium', min_amount: 100000, max_amount: 3000000, min_rate: 14.0, max_rate: 18.0, tenures: [12, 24, 36] },
  { id: 'r009', persona: 'MSME-Owner', risk_band: 'High', min_amount: 50000, max_amount: 1000000, min_rate: 18.0, max_rate: 22.0, tenures: [12, 24, 36] },
  { id: 'r010', persona: 'First-Time-Borrower', risk_band: 'Medium', min_amount: 50000, max_amount: 500000, min_rate: 16.0, max_rate: 20.0, tenures: [12, 24, 36] },
  { id: 'r011', persona: 'NTC', risk_band: 'Medium', min_amount: 50000, max_amount: 300000, min_rate: 18.0, max_rate: 22.0, tenures: [12, 24, 36] },
];

export const PolicyEngine = {
  async getRules(): Promise<PolicyRule[]> {
    try {
      const rows = await query<{ rules: { rules: PolicyRule[] } }>('SELECT rules FROM policy_rules WHERE id = 1');
      return rows[0]?.rules?.rules ?? DEFAULT_RULES;
    } catch {
      return DEFAULT_RULES;
    }
  },

  async findRule(persona: string, riskBand: string): Promise<PolicyRule | null> {
    const rules = await this.getRules();
    return rules.find(r => r.persona === persona && r.risk_band === riskBand)
      ?? rules.find(r => r.risk_band === riskBand)
      ?? rules[0]
      ?? null;
  },

  async updateRules(rules: PolicyRule[]): Promise<void> {
    await query(
      `INSERT INTO policy_rules (id, rules, updated_at) VALUES (1, $1, NOW())
       ON CONFLICT (id) DO UPDATE SET rules = $1, updated_at = NOW()`,
      [JSON.stringify({ rules })]
    );
    logger.info({ event: 'policy_rules_updated', rule_count: rules.length });
  },
};
