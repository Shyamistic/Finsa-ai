# Finsa — Detailed Architecture

## 1. Agent Pipeline Deep Dive

### EventBus (Redis Pub/Sub)

All inter-agent communication flows through a Redis pub/sub EventBus. Each channel is namespaced per session:

```
session:{sessionId}:visual_intel
session:{sessionId}:speech_intel
session:{sessionId}:fraud_detection
session:{sessionId}:bureau_risk
session:{sessionId}:persona
session:{sessionId}:offer
session:{sessionId}:compliance
session:{sessionId}:auto_fill
```

Agents subscribe to upstream channels and publish to their own. The Orchestrator subscribes to all channels and relays events to the frontend via Socket.IO.

### Agent Dependency Graph

```
                    ┌─────────────────┐
                    │  Session Start  │
                    └────────┬────────┘
                             │ (all agents init simultaneously)
          ┌──────────────────┼──────────────────┐
          ▼                  ▼                  ▼
   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
   │ Visual Intel│   │ Speech Intel│   │   Others    │
   │ (liveness)  │   │ (STT + NLP) │   │  (waiting)  │
   └──────┬──────┘   └──────┬──────┘   └─────────────┘
          │                 │
          │          ┌──────┴──────────────────────┐
          │          │  On each transcript turn:    │
          │          │  - Extract entities          │
          │          │  - Publish to EventBus       │
          │          └──────┬──────────────────────┘
          │                 │
          │    ┌────────────┼────────────┐
          ▼    ▼            ▼            ▼
   ┌──────────────┐  ┌──────────┐  ┌──────────────┐
   │ Fraud        │  │ Bureau   │  │  Auto-Fill   │
   │ Detection    │  │ Risk     │  │  Agent       │
   │ (7 signals)  │  │ (CIBIL)  │  │  (form fill) │
   └──────┬───────┘  └────┬─────┘  └──────────────┘
          │               │
          │          ┌────┴──────────┐
          │          │ Persona       │
          │          │ Classifier    │
          │          └────┬──────────┘
          │               │
          └───────┬────────┘
                  ▼
          ┌───────────────┐
          │ Offer Engine  │
          │ (policy rules)│
          └───────┬───────┘
                  │
                  ▼
          ┌───────────────┐
          │  Compliance   │
          │  Agent        │
          │  (Solana +    │
          │   V-CIP PDF)  │
          └───────────────┘
```

### Fraud Detection — 7 Signals

```typescript
interface FraudSignals {
  geo_mismatch: boolean;              // weight: 15 — IP country ≠ IN
  age_discrepancy: boolean;           // weight: 18 — estimated age vs declared
  pan_mismatch: boolean;              // weight: 22 — PAN format/bureau mismatch
  behavioural_anomaly: boolean;       // weight: 15 — speech pattern anomaly
  device_fingerprint_mismatch: boolean; // weight: 15 — device inconsistency
  multiple_applications: boolean;     // weight: 20 — duplicate session detection
  income_inconsistency: boolean;      // weight: 15 — income vs employment mismatch
}
// Total raw weight: 120 → normalised to 100
// Score ≥ 70: REJECTED
```

### Offer Engine — Policy Rules

12 policy rules covering all customer segments:

| Persona | Risk Band | Amount Range | Rate Range | Tenures |
|---------|-----------|-------------|------------|---------|
| Salaried-Urban | Low | ₹1L–₹50L | 9.99–13% | 12–84m |
| Salaried-Urban | Medium | ₹50K–₹20L | 13–16% | 12–36m |
| Professional | Low | ₹2L–₹75L | 11–14% | 12–60m |
| MSME-Owner | Low | ₹2L–₹75L | 15–18% | 12–60m |
| MSME-Owner | High | ₹50K–₹10L | 21–24% | 12–36m |
| NTC | Medium | ₹50K–₹3L | 16–22% | 12–36m |

Offer amount uses 50% FOIR rule:
```
available_emi = monthly_income × 0.5 − existing_emis
max_amount = available_emi × tenure / (1 + rate_estimate)
```

---

## 2. Audit Chain Architecture

### Hash Chain Structure

```
Entry 0:
  seq: 0
  event_type: "consent_captured"
  payload_hash: SHA256(JSON.stringify(payload))
  prev_hash: "0000...0000" (64 zeros — genesis)

Entry 1:
  seq: 1
  event_type: "liveness_result"
  payload_hash: SHA256(JSON.stringify(payload))
  prev_hash: entry[0].payload_hash  ← chain link

Entry N:
  prev_hash: entry[N-1].payload_hash
```

Tampering with any entry breaks the chain at that index. The `verify` endpoint checks every chain link.

### Solana Anchor

The root hash (Merkle-style combination of all payload hashes) is anchored on Solana Devnet via SPL Memo:

```typescript
const memo = JSON.stringify({
  app: 'finsa',
  session: sessionId.slice(0, 8),
  hash: rootHash,
  ts: Date.now(),
});
// Sent as SPL Memo instruction — publicly verifiable on Solana Explorer
```

Verify at: `https://explorer.solana.com/tx/{tx}?cluster=devnet`

---

## 3. Real-Time Communication

### WebSocket Events (Socket.IO)

```
Client → Server:
  join_session    { session_id }
  transcript      { session_id, transcript }

Server → Client:
  agent_status    { agentId, data }
  session_phase   { phase: 'started' | 'completed' }
```

### Agent Status Data Shape

```typescript
// speech_intel
{ transcript, entities, turn_count, interview_complete, language, agent_message }

// bureau_risk
{ risk_band, credit_score, propensity, pan_matched, ntc }

// fraud_detection
{ fraud_score, signals, decision: 'approved' | 'rejected' }

// offer
{ amount, rate_pa, tenure_options, emi, explanation_en, explanation_hi }

// compliance
{ vcip_ok, audit_sealed, solana_tx, root_hash }
```

---

## 4. LLM Integration

### AWS Bedrock Nova Lite

Used for two tasks:

**1. Conversation (Priya's responses)**
```
Temperature: 0.3
Max tokens: 80 (keep responses short)
System prompt: Priya personality + Finsa AI context
```

**2. Entity Extraction**
```
Temperature: 0 (deterministic)
Max tokens: 200
Output: strict JSON schema
Validation: Zod + PAN regex /^[A-Z]{5}[0-9]{4}[A-Z]$/
```

### Hallucination Prevention

1. Entity extraction uses temperature=0
2. PAN is validated with strict regex — hallucinated PANs are rejected
3. All financial figures (rates, amounts) come from PolicyEngine, never from LLM
4. Minimum 3 turns required before interview can complete
5. LLM output is validated against Zod schema before use

---

## 5. Database Schema

```sql
-- Core session record
sessions (
  id UUID PRIMARY KEY,
  status VARCHAR(32),        -- initiated → consent_captured → in_progress → offer_delivered
  pan_masked VARCHAR(16),
  persona VARCHAR(32),
  risk_band VARCHAR(8),
  fraud_score SMALLINT,
  offer JSONB,
  language CHAR(2),
  geo_country CHAR(2),
  solana_tx_signature VARCHAR(128),
  created_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
)

-- Hash-chained audit log
audit_log_entries (
  session_id UUID REFERENCES sessions(id),
  seq INTEGER,
  event_type VARCHAR(64),
  timestamp_ms BIGINT,
  payload_hash CHAR(64),     -- SHA256 of canonical JSON payload
  prev_hash CHAR(64),        -- chain link
  payload JSONB,
  UNIQUE(session_id, seq)
)

-- DPDP consent trail
dpdp_consent_trail (
  session_id UUID,
  customer_ip INET,
  consent_version VARCHAR(16),
  consented_at TIMESTAMPTZ,
  data_categories TEXT[],
  purpose TEXT,
  retention_days INTEGER
)
```

---

## 6. Security Architecture

### API Authentication
- Bearer token authentication on all endpoints
- Two roles: `api` (sessions) and `admin` (dashboard)
- Rate limiting: 100 req/min on session creation, 300 req/min on reads

### Data Privacy
- Facial biometrics processed in-browser only — no raw frames sent to server
- PAN OCR runs client-side (Tesseract.js)
- IP addresses hashed before storage
- All data stored in AWS ap-south-1 (India data residency)

### Transport Security
- HTTPS enforced in production
- CORS restricted to configured `FRONTEND_URL`
- Helmet.js security headers

---

## 7. Observability

### Prometheus Metrics

```
active_sessions_total          Gauge   Currently active sessions
agent_processing_time_ms       Histogram  Per-agent latency
fraud_score_histogram          Histogram  Distribution of fraud scores
offer_generated_total          Counter    Successful offers
session_rejected_total         Counter    Rejected sessions
solana_anchor_success_total    Counter    Successful on-chain anchors
bandwidth_tier_total           Counter    Sessions by bandwidth tier
```

### Grafana Dashboard

Pre-built dashboard at `grafana/dashboard.json` — import into Grafana at `http://localhost:3001`.

Panels:
- Active sessions (real-time)
- Agent processing latency (p50/p95/p99)
- Fraud score distribution
- Offer acceptance rate
- Solana anchor success rate
