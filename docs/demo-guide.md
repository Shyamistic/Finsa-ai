# LoanWizard OS — Demo Guide
## TenzorX 2026 | Poonawalla Fincorp

---

## Quick Start

```bash
# 1. Clone and setup
git clone <repo-url>
cd loanwizard-os
cp .env.example .env
# Fill in ANTHROPIC_API_KEY and OPENAI_API_KEY in .env

# 2. Start everything
docker compose up

# 3. Open in browser
open http://localhost:3000/demo
```

---

## Demo Mode (Recommended for Judges)

Navigate to **http://localhost:3000/demo**

The demo page requires **zero configuration** — it works immediately after `docker compose up`.

### Controls
- **Start Demo (90s)** — Runs a complete session simulation in 90 seconds
- **Switch Profile** — Replay with any of the 5 pre-seeded PAN profiles
- **Verify Audit on Solana** — Opens Solana Explorer for the on-chain anchor

### What You'll See
- T+0s: All 7 agents initialise simultaneously
- T+15s: Liveness verification completes (PASS)
- T+25s: Bureau lookup returns risk band
- T+35s: Persona classified
- T+40s: Interview complete (4 turns)
- T+45s: Fraud score computed
- T+70s: Personalised offer generated
- T+85s: Audit log sealed + anchored to Solana Devnet

---

## The 5 Pre-Seeded PAN Profiles

| # | PAN | Profile | Risk Band | Credit Score | Expected Outcome |
|---|-----|---------|-----------|--------------|-----------------|
| 1 | ABCDE1234F | Priya Sharma — Salaried Urban | Low | 780 | Offer: ₹25L @ 11.5% |
| 2 | FGHIJ5678K | Ramesh Patel — Self-Employed Tier 2 | Medium | 640 | Offer: ₹10L @ 15.5% |
| 3 | KLMNO9012P | Suresh Kumar — MSME Owner | High | 580 | Offer: ₹5L @ 20% |
| 4 | PQRST3456U | Test Fraud — Fraud Flagged | High | 300 | **REJECTED** (fraud score 85) |
| 5 | UVWXY7890Z | Anjali Singh — Thin File NTC | Medium | None | Offer: ₹3L @ 20% |

---

## Live Session (Full Flow)

1. Open **http://localhost:3000**
2. Read and accept the DPDP consent
3. Allow camera and microphone access
4. Complete the 2 liveness challenges (blink, nod)
5. Have a conversation with the AI agent (Priya)
6. When asked for PAN, say one of the 5 PANs above
7. Receive your personalised offer within 3 minutes

---

## API Endpoints

```bash
# Health check
curl http://localhost:4000/health

# Create session
curl -X POST http://localhost:4000/sessions \
  -H "Authorization: Bearer demo-key" \
  -H "Content-Type: application/json" \
  -d '{"language": "en"}'

# Verify audit chain
curl http://localhost:4000/sessions/{id}/audit/verify \
  -H "Authorization: Bearer demo-key"

# Update policy rules (hot-reload)
curl -X PUT http://localhost:4000/policy \
  -H "Authorization: Bearer admin-key" \
  -H "Content-Type: application/json" \
  -d @policy-rules.json
```

---

## Admin Dashboard

Navigate to **http://localhost:3000/admin**

Shows:
- Session history with status, persona, risk band, fraud score
- Hash-chained audit log with chain integrity indicator
- Solana Explorer links for on-chain anchors
- V-CIP PDF download

---

## Observability

- **Grafana**: http://localhost:3001 (admin/admin)
- **Prometheus metrics**: http://localhost:4000/metrics
- **Structured logs**: `docker compose logs backend`

---

## SDK Integration

```html
<div id="loan-widget"></div>
<script src="http://localhost:3000/sdk/loanwizard-sdk.js"></script>
<script>
  const wizard = new LoanWizard({
    baseUrl: 'http://localhost:3000',
    apiKey: 'demo-key',
    institutionName: 'Poonawalla Fincorp',
    primaryColor: '#1a56db',
    language: 'en',
    onComplete: (result) => console.log('Offer:', result),
    onError: (error) => console.error('Error:', error),
  });
  wizard.mount('loan-widget');
</script>
```

---

## Architecture Highlights for Judges

### Why 7 Parallel Agents?
Traditional video KYC is sequential: capture → verify → score → offer (48 hours).
LoanWizard OS runs all 7 agents simultaneously from session start. The Orchestrator uses
Redis pub/sub so each agent publishes results as soon as it's done — no waiting.

### Why Solana On-Chain Anchor?
The SHA-256 hash of the complete audit log is anchored to Solana Devnet via the Solana
Attestation Service. This means:
- Any third party can verify the session happened without accessing PII
- The audit log cannot be tampered with retroactively
- Poonawalla Fincorp gets an independently verifiable compliance proof

### Why In-Browser Liveness?
face-api.js runs in a Web Worker inside the browser. Raw video frames never leave the device.
Only the result object `{ passed, confidence, challenge }` is sent to the server.
This satisfies RBI V-CIP requirements and DPDP Act data minimisation principles.

### Low-Bandwidth Resilience
A 3-second bandwidth probe runs before the session starts. The system automatically
adjusts video quality (720p → 480p → 360p → audio-only) and can resume a dropped
session within 10 minutes using a resume token.

---

*Problem Statement 3 | TenzorX 2026 National AI Hackathon | Poonawalla Fincorp*
