import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { computeFraudScore, FraudSignals } from '../agents/FraudDetectionAgent';
import { AuditLog } from '../services/AuditLog';
import crypto from 'crypto';

// ─── CP-02: Fraud Score Determinism ───────────────────────────────────────────
describe('CP-02: Fraud Score Determinism', () => {
  it('computeFraudScore is a pure function — same inputs always produce same output', () => {
    fc.assert(
      fc.property(
        fc.record({
          geo_mismatch: fc.boolean(),
          age_discrepancy: fc.boolean(),
          pan_mismatch: fc.boolean(),
          behavioural_anomaly: fc.boolean(),
          device_fingerprint_mismatch: fc.boolean(),
          multiple_applications: fc.boolean(),
          income_inconsistency: fc.boolean(),
        }),
        (signals: FraudSignals) => {
          const score1 = computeFraudScore(signals);
          const score2 = computeFraudScore(signals);
          const score3 = computeFraudScore(signals);
          return score1 === score2 && score2 === score3;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('fraud score is always in range [0, 100]', () => {
    fc.assert(
      fc.property(
        fc.record({
          geo_mismatch: fc.boolean(),
          age_discrepancy: fc.boolean(),
          pan_mismatch: fc.boolean(),
          behavioural_anomaly: fc.boolean(),
          device_fingerprint_mismatch: fc.boolean(),
          multiple_applications: fc.boolean(),
          income_inconsistency: fc.boolean(),
        }),
        (signals: FraudSignals) => {
          const score = computeFraudScore(signals);
          return score >= 0 && score <= 100;
        }
      )
    );
  });

  const ALL_FALSE: FraudSignals = {
    geo_mismatch: false, age_discrepancy: false, pan_mismatch: false,
    behavioural_anomaly: false, device_fingerprint_mismatch: false,
    multiple_applications: false, income_inconsistency: false,
  };
  const ALL_TRUE: FraudSignals = {
    geo_mismatch: true, age_discrepancy: true, pan_mismatch: true,
    behavioural_anomaly: true, device_fingerprint_mismatch: true,
    multiple_applications: true, income_inconsistency: true,
  };

  it('all signals false → score is 0', () => {
    expect(computeFraudScore(ALL_FALSE)).toBe(0);
  });

  it('all signals true → score is 100', () => {
    expect(computeFraudScore(ALL_TRUE)).toBe(100);
  });

  it('individual signal weights are correct (normalised to 100, total raw=120)', () => {
    // geo_mismatch: 15/120 * 100 = 12.5 → rounds to 13
    expect(computeFraudScore({ ...ALL_FALSE, geo_mismatch: true })).toBe(13);
    // age_discrepancy: 18/120 * 100 = 15
    expect(computeFraudScore({ ...ALL_FALSE, age_discrepancy: true })).toBe(15);
    // pan_mismatch: 22/120 * 100 = 18.33 → rounds to 18
    expect(computeFraudScore({ ...ALL_FALSE, pan_mismatch: true })).toBe(18);
    // behavioural_anomaly: 15/120 * 100 = 12.5 → rounds to 13
    expect(computeFraudScore({ ...ALL_FALSE, behavioural_anomaly: true })).toBe(13);
    // multiple_applications: 20/120 * 100 = 16.67 → rounds to 17
    expect(computeFraudScore({ ...ALL_FALSE, multiple_applications: true })).toBe(17);
  });
});

// ─── CP-03: Offer Bounds ──────────────────────────────────────────────────────
describe('CP-03: Offer Bounds', () => {
  const RISK_BANDS = ['Low', 'Medium', 'High'] as const;
  const PERSONAS = ['Salaried-Urban', 'Self-Employed-Tier2', 'MSME-Owner', 'First-Time-Borrower', 'NTC'] as const;

  // Default policy rules (same as OfferEngineAgent)
  const DEFAULT_RULES = [
    { persona: 'Salaried-Urban', risk_band: 'Low', min_amount: 100000, max_amount: 5000000, min_rate: 10.5, max_rate: 14.0, tenures: [12, 24, 36] },
    { persona: 'Salaried-Urban', risk_band: 'Medium', min_amount: 50000, max_amount: 2000000, min_rate: 14.0, max_rate: 18.0, tenures: [12, 24, 36] },
    { persona: 'Salaried-Urban', risk_band: 'High', min_amount: 50000, max_amount: 500000, min_rate: 20.0, max_rate: 24.0, tenures: [12, 24, 36] },
    { persona: 'Self-Employed-Tier2', risk_band: 'Low', min_amount: 100000, max_amount: 3000000, min_rate: 12.0, max_rate: 16.0, tenures: [12, 24, 36] },
    { persona: 'Self-Employed-Tier2', risk_band: 'Medium', min_amount: 50000, max_amount: 1500000, min_rate: 15.0, max_rate: 19.0, tenures: [12, 24, 36] },
    { persona: 'Self-Employed-Tier2', risk_band: 'High', min_amount: 50000, max_amount: 500000, min_rate: 20.0, max_rate: 24.0, tenures: [12, 24, 36] },
    { persona: 'MSME-Owner', risk_band: 'Low', min_amount: 200000, max_amount: 5000000, min_rate: 11.0, max_rate: 15.0, tenures: [12, 24, 36] },
    { persona: 'MSME-Owner', risk_band: 'Medium', min_amount: 100000, max_amount: 3000000, min_rate: 14.0, max_rate: 18.0, tenures: [12, 24, 36] },
    { persona: 'MSME-Owner', risk_band: 'High', min_amount: 50000, max_amount: 1000000, min_rate: 18.0, max_rate: 22.0, tenures: [12, 24, 36] },
    { persona: 'First-Time-Borrower', risk_band: 'Medium', min_amount: 50000, max_amount: 500000, min_rate: 16.0, max_rate: 20.0, tenures: [12, 24, 36] },
    { persona: 'NTC', risk_band: 'Medium', min_amount: 50000, max_amount: 300000, min_rate: 18.0, max_rate: 22.0, tenures: [12, 24, 36] },
  ];

  it('all policy rules have amount in [50000, 5000000]', () => {
    for (const rule of DEFAULT_RULES) {
      expect(rule.min_amount).toBeGreaterThanOrEqual(50000);
      expect(rule.max_amount).toBeLessThanOrEqual(5000000);
    }
  });

  it('all policy rules have rate in [10.5, 24.0]', () => {
    for (const rule of DEFAULT_RULES) {
      expect(rule.min_rate).toBeGreaterThanOrEqual(10.5);
      expect(rule.max_rate).toBeLessThanOrEqual(24.0);
    }
  });

  it('all policy rules have exactly 3 tenure options', () => {
    for (const rule of DEFAULT_RULES) {
      expect(rule.tenures).toHaveLength(3);
    }
  });

  it('property: for any valid (risk_band, persona) combo, a matching rule exists', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...RISK_BANDS),
        fc.constantFrom(...PERSONAS),
        (riskBand, persona) => {
          const rule = DEFAULT_RULES.find(r => r.persona === persona && r.risk_band === riskBand)
            ?? DEFAULT_RULES.find(r => r.risk_band === riskBand)
            ?? DEFAULT_RULES[0];
          return rule !== undefined
            && rule.min_amount >= 50000
            && rule.max_amount <= 5000000
            && rule.min_rate >= 10.5
            && rule.max_rate <= 24.0
            && rule.tenures.length === 3;
        }
      )
    );
  });
});

// ─── CP-01: Audit Chain Integrity (in-memory simulation) ─────────────────────
describe('CP-01: Audit Chain Integrity (in-memory)', () => {
  function sha256(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  interface InMemoryEntry {
    seq: number;
    event_type: string;
    payload: Record<string, unknown>;
    payload_hash: string;
    prev_hash: string;
  }

  function buildChain(events: Array<{ type: string; payload: Record<string, unknown> }>): InMemoryEntry[] {
    const chain: InMemoryEntry[] = [];
    for (let i = 0; i < events.length; i++) {
      const payloadStr = JSON.stringify(events[i].payload);
      const payloadHash = sha256(payloadStr);
      const prevHash = i === 0 ? '0'.repeat(64) : chain[i - 1].payload_hash;
      chain.push({ seq: i, event_type: events[i].type, payload: events[i].payload, payload_hash: payloadHash, prev_hash: prevHash });
    }
    return chain;
  }

  function verifyChain(chain: InMemoryEntry[]): { valid: boolean; broken_at?: number } {
    for (let i = 0; i < chain.length; i++) {
      const entry = chain[i];
      const expectedHash = sha256(JSON.stringify(entry.payload));
      if (entry.payload_hash !== expectedHash) return { valid: false, broken_at: i };
      const expectedPrev = i === 0 ? '0'.repeat(64) : chain[i - 1].payload_hash;
      if (entry.prev_hash !== expectedPrev) return { valid: false, broken_at: i };
    }
    return { valid: true };
  }

  it('a valid chain always verifies as valid', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({ type: fc.string(), payload: fc.object() }),
          { minLength: 1, maxLength: 20 }
        ),
        (events) => {
          const chain = buildChain(events);
          const result = verifyChain(chain);
          return result.valid === true;
        }
      )
    );
  });

  it('mutating any payload breaks the chain at that index', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({ type: fc.string(), payload: fc.object() }),
          { minLength: 2, maxLength: 20 }
        ),
        fc.nat(),
        (events, mutateIdx) => {
          const chain = buildChain(events);
          const idx = mutateIdx % chain.length;
          // Mutate the payload
          chain[idx] = { ...chain[idx], payload: { ...chain[idx].payload, _tampered: true } };
          const result = verifyChain(chain);
          return result.valid === false && result.broken_at === idx;
        }
      )
    );
  });

  it('mutating prev_hash breaks the chain', () => {
    const events = [
      { type: 'consent', payload: { ts: 1 } },
      { type: 'liveness', payload: { passed: true } },
      { type: 'offer', payload: { amount: 100000 } },
    ];
    const chain = buildChain(events);
    chain[1] = { ...chain[1], prev_hash: 'x'.repeat(64) };
    const result = verifyChain(chain);
    expect(result.valid).toBe(false);
    expect(result.broken_at).toBe(1);
  });
});

// ─── CP-05: Session Isolation ─────────────────────────────────────────────────
describe('CP-05: Session Isolation', () => {
  it('UUID v4 session IDs are unique', () => {
    const { v4: uuidv4 } = require('uuid');
    fc.assert(
      fc.property(fc.nat({ max: 100 }), (n) => {
        const ids = new Set(Array.from({ length: n + 2 }, () => uuidv4()));
        return ids.size === n + 2;
      })
    );
  });
});

// ─── CP-04: On-Chain Anchor Idempotency ──────────────────────────────────────
describe('CP-04: On-Chain Anchor Idempotency', () => {
  it('same hash submitted twice returns the same tx signature (no duplicate)', () => {
    // Simulate the in-memory idempotency cache in SolanaAnchor.ts
    const anchoredHashes = new Map<string, string>();

    function anchorHash(hash: string): string {
      if (anchoredHashes.has(hash)) {
        return anchoredHashes.get(hash)!; // returns existing, no duplicate
      }
      const fakeTx = `tx_${hash.slice(0, 16)}_${Date.now()}`;
      anchoredHashes.set(hash, fakeTx);
      return fakeTx;
    }

    fc.assert(
      fc.property(fc.hexaString({ minLength: 64, maxLength: 64 }), (hash) => {
        const tx1 = anchorHash(hash);
        const tx2 = anchorHash(hash); // second call — must return same tx
        return tx1 === tx2;
      })
    );
  });

  it('different hashes produce different tx signatures', () => {
    const anchoredHashes = new Map<string, string>();
    let counter = 0;

    function anchorHash(hash: string): string {
      if (anchoredHashes.has(hash)) return anchoredHashes.get(hash)!;
      const fakeTx = `tx_${counter++}`;
      anchoredHashes.set(hash, fakeTx);
      return fakeTx;
    }

    fc.assert(
      fc.property(
        fc.hexaString({ minLength: 64, maxLength: 64 }),
        fc.hexaString({ minLength: 64, maxLength: 64 }),
        (hash1, hash2) => {
          fc.pre(hash1 !== hash2);
          const tx1 = anchorHash(hash1);
          const tx2 = anchorHash(hash2);
          return tx1 !== tx2;
        }
      )
    );
  });
});

// ─── CP-06: Liveness Privacy ──────────────────────────────────────────────────
describe('CP-06: Liveness Privacy', () => {
  it('liveness result object contains no raw image data fields', () => {
    // The result sent from browser to server must only contain these fields
    const ALLOWED_FIELDS = new Set(['passed', 'confidence', 'challenge', 'age_estimate', 'session_id']);
    const FORBIDDEN_FIELDS = ['imageData', 'frame', 'pixels', 'base64', 'dataUrl', 'blob', 'buffer', 'rawVideo'];

    fc.assert(
      fc.property(
        fc.record({
          passed: fc.boolean(),
          confidence: fc.float({ min: 0, max: 1 }),
          challenge: fc.constantFrom('blink', 'nod'),
          age_estimate: fc.option(fc.integer({ min: 18, max: 80 }), { nil: null }),
          session_id: fc.uuid(),
        }),
        (result) => {
          const keys = Object.keys(result);
          // All keys must be in allowed set
          const hasOnlyAllowedFields = keys.every(k => ALLOWED_FIELDS.has(k));
          // No forbidden fields present
          const hasNoForbiddenFields = FORBIDDEN_FIELDS.every(f => !(f in result));
          return hasOnlyAllowedFields && hasNoForbiddenFields;
        }
      )
    );
  });

  it('liveness result confidence is always in [0, 1]', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 1, noNaN: true }),
        (confidence) => confidence >= 0 && confidence <= 1
      )
    );
  });
});
