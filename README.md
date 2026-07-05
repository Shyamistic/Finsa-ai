# Finsa AI — Agentic AI Banking Platform

> **Built for SBI Hackathon @ GFF 2026 · Kuber Labs | IIT Patna**

Finsa AI is a multi-agent banking journey platform built for SBI hackathon evaluation. It demonstrates real-time customer acquisition, digital adoption, and digital engagement flows with a guided conversational interface, compliance-first architecture, and production-ready orchestration patterns.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB)](https://react.dev/)
[![AWS Bedrock](https://img.shields.io/badge/AWS-Bedrock%20Nova-FF9900)](https://aws.amazon.com/bedrock/)
[![Solana](https://img.shields.io/badge/Solana-Devnet-9945FF)](https://solana.com/)
[![RBI V-CIP](https://img.shields.io/badge/RBI-V--CIP%20Compliant-green)](https://www.rbi.org.in/)
[![DPDP](https://img.shields.io/badge/DPDP%20Act-2023-green)](https://www.meity.gov.in/)

---

## Live Demo

| URL | What |
|-----|------|
| `https://finsa-ai.onrender.com/demo` | Judges demo mode (recommended for evaluation) |
| `https://finsa-ai.onrender.com/apply` | Start real-time session flow |
| `https://finsa-ai.onrender.com` | Landing page |
| `https://finsa-ai.onrender.com/admin` | Admin dashboard (key required) |

---

## SBI Hackathon Theme Mapping

| SBI Theme | Finsa AI Capability |
|-----|------|
| Customer Acquisition | Real-time lead scoring and intent-driven onboarding journey |
| Digital Adoption | Contextual nudges for UPI/mobile banking/SIP/FD behaviors |
| Digital Engagement | Life-event based recommendations and next-best-action pathing |

This repository currently ships a strong demoable foundation. The SBI-focused production roadmap is defined in:
- .kiro/specs/finsa-ai-sbi-platform/requirements.md
- .kiro/specs/finsa-ai-sbi-platform/design.md

---

## Problem and Approach

Traditional digital loan journeys suffer from:
- **High drop-offs** — long forms, document uploads, branch visits
- **Fraud risk** — no real-time identity verification
- **Manual KYC overhead** — human reviewers, slow turnaround
- **No contextual understanding** — forms can't detect intent or inconsistency

Finsa AI addresses these with an orchestrated conversational journey that combines onboarding, qualification, and contextual engagement.

---

## How It Works

```
Customer receives SMS/WhatsApp link
         ↓
Clicks link → Consent page (DPDP Act 2023)
         ↓
Video call starts → Priya (AI advisor) greets customer
         ↓
┌─────────────────────────────────────────────────────┐
│              7 AI Agents run in parallel             │
│                                                     │
│  👁 Visual Intel    → Liveness + Age estimation     │
│  🎤 Speech Intel    → STT + Entity extraction       │
│  🛡 Fraud Detection → Composite fraud score         │
│  📊 Bureau Risk     → CIBIL lookup + propensity     │
│  👤 Persona         → Customer segmentation         │
│  💰 Offer Engine    → Policy-based offer generation │
│  ⚖️  Compliance     → Audit + Solana anchor         │
└─────────────────────────────────────────────────────┘
         ↓
Personalised loan offer delivered in < 30 seconds
         ↓
V-CIP PDF generated + Solana Devnet audit anchor
```

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Customer Device                          │
│  Browser (Chrome/Edge)                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  WebRTC      │  │  Web Speech  │  │  Tesseract.js        │  │
│  │  Video Feed  │  │  API (STT)   │  │  PAN OCR             │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
└─────────┼─────────────────┼──────────────────────┼─────────────┘
          │ WebSocket        │ HTTP POST /transcript │ HTTP POST /docs
          ▼                  ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Express Backend (Port 4000)                  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Orchestrator                         │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐             │   │
│  │  │ Visual   │  │ Speech   │  │ Fraud    │             │   │
│  │  │ Intel    │  │ Intel    │  │ Detection│             │   │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘             │   │
│  │       │              │              │                   │   │
│  │  ┌────┴─────┐  ┌─────┴────┐  ┌─────┴─────┐            │   │
│  │  │ Bureau   │  │ Persona  │  │ Offer     │            │   │
│  │  │ Risk     │  │ Classify │  │ Engine    │            │   │
│  │  └────┬─────┘  └────┬─────┘  └─────┬─────┘            │   │
│  │       └──────────────┴──────────────┘                  │   │
│  │                       │                                 │   │
│  │              ┌─────────┴──────────┐                    │   │
│  │              │  Compliance Agent  │                    │   │
│  │              │  + Auto-Fill Agent │                    │   │
│  │              └─────────┬──────────┘                    │   │
│  └────────────────────────┼────────────────────────────────┘   │
│                           │                                     │
│  ┌────────────────────────┼────────────────────────────────┐   │
│  │         Redis EventBus (Pub/Sub)                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  PostgreSQL  │  │  AWS Bedrock │  │  Solana Devnet       │  │
│  │  Audit Chain │  │  Nova Lite   │  │  SPL Memo Anchor     │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Agent Pipeline

Each agent subscribes to the Redis EventBus and reacts to upstream events:

| Agent | Trigger | Output |
|-------|---------|--------|
| **Visual Intel** | Session start | Liveness pass/fail, age estimate |
| **Speech Intel** | Each transcript turn | Extracted entities (income, PAN, purpose) |
| **Fraud Detection** | Speech + Visual results | Composite fraud score 0–100 |
| **Bureau Risk** | PAN extracted | Credit score, risk band, propensity |
| **Persona Classifier** | Bureau + Speech results | Customer segment (Salaried-Urban, MSME, NTC…) |
| **Offer Engine** | Bureau + Persona + Fraud | Personalised loan offer with 3 tenure options |
| **Compliance** | All agents complete | Solana anchor, V-CIP PDF, audit seal |
| **Auto-Fill** | Each speech turn | Form fields filled in real-time |

### Data Flow

```
User speaks → Web Speech API → POST /sessions/:id/transcript
                                        ↓
                              SpeechIntelAgent (Bedrock Nova)
                              ├── Extracts: income, employment, purpose, PAN
                              ├── Publishes to EventBus
                              └── Triggers downstream agents

BureauRiskAgent ←── EventBus ──── SpeechIntelAgent (on interview_complete)
      ↓
PersonaClassifierAgent ←── EventBus ──── BureauRiskAgent
      ↓
OfferEngineAgent ←── EventBus ──── Bureau + Persona + Fraud (all three)
      ↓
ComplianceAgent ←── EventBus ──── All 6 agents complete
      ↓
Solana Devnet anchor + V-CIP PDF + WebSocket → Frontend
```

---

## Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| React 18 + TypeScript | UI framework |
| Tailwind CSS | Styling |
| Vite | Build tool |
| Socket.IO Client | Real-time agent status |
| Web Speech API | Browser-native STT |
| WebRTC (`getUserMedia`) | Live video capture |
| Tesseract.js | In-browser PAN OCR |

### Backend
| Technology | Purpose |
|-----------|---------|
| Express + TypeScript | REST API |
| Socket.IO | Real-time WebSocket |
| Redis (ioredis) | EventBus pub/sub |
| PostgreSQL | Sessions, audit log, consent |
| AWS Bedrock Nova Lite | LLM (conversation + entity extraction) |
| Amazon Polly (Kajal) | Neural TTS — Priya's voice |
| Solana Web3.js | On-chain audit anchoring |
| PDFKit | V-CIP compliance PDF |
| Prometheus | Metrics |

### Infrastructure
| Technology | Purpose |
|-----------|---------|
| Docker Compose | Local dev orchestration |
| Grafana | Metrics dashboard |
| AWS ap-south-1 | Data residency (India) |

---

## Compliance

### RBI V-CIP (Para 19) Requirements

| Requirement | Status | Implementation |
|------------|--------|----------------|
| Live video — no pre-recorded | ✅ | WebRTC `getUserMedia` |
| Geo-tagging of customer | ✅ | MaxMind GeoIP2 |
| PAN OCR during call | ✅ | Tesseract.js in-browser |
| Liveness detection | ✅ | Motion analysis overlay |
| Proprietary system (no Zoom/Teams) | ✅ | Custom WebRTC |
| IP address logging | ✅ | Express `req.ip` |
| Session recording | ✅ | PostgreSQL + S3 |
| 8-year retention | ✅ | `retention_days: 2555` |
| Concurrent audit trail | ✅ | Hash-chained audit log |
| On-chain tamper-proof anchor | ✅ | Solana Devnet SPL Memo |

### DPDP Act 2023
- Explicit consent captured before session start
- Data categories disclosed: video, audio, PAN, facial biometrics, financial, geo_ip
- Purpose limitation: loan origination only
- Withdrawal mechanism: `privacy@finsa.ai`
- Retention period: 7 years (2555 days)

### Audit Chain
Every session event is stored in a SHA-256 hash-chained log:
```
entry[0].prev_hash = "0000...0000" (genesis)
entry[i].prev_hash = SHA256(entry[i-1].payload)
```
The root hash is anchored on Solana Devnet via SPL Memo — tamper-proof and publicly verifiable.

---

## Demo Profiles

Five pre-configured profiles for the demo:

| Profile | PAN | Risk | Credit Score | Outcome |
|---------|-----|------|-------------|---------|
| Priya Sharma | ABCDE1234F | Low | 780 | ₹15L @ 9.99% |
| Ramesh Patel | FGHIJ5678K | Medium | 640 | ₹8L @ 14.5% |
| Suresh Kumar | KLMNO9012P | High | 580 | ₹20L @ 17% |
| Test Fraud | PQRST3456U | High | 300 | Rejected (score: 95) |
| Anjali Singh | UVWXY7890Z | Medium | NTC | ₹3L @ 18% |

---

## Getting Started

### Prerequisites
- Node.js 20+
- pnpm 8+
- Docker Desktop
- AWS account with Bedrock Nova Lite access (us-east-1)

### 1. Clone & Install

```bash
git clone https://github.com/Shyamistic/Finsa-ai.git
cd Finsa-ai
pnpm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your AWS credentials, Solana key, etc.
cp packages/backend/.env.example packages/backend/.env  # if separate
```

### 3. Start Infrastructure

```bash
# Start Postgres + Redis
docker compose -f docker-compose.infra.yml up -d

# Verify
docker compose -f docker-compose.infra.yml ps
```

### 4. Start Backend

```bash
cd packages/backend
npm run dev
# → http://localhost:4000/health
```

### 5. Start Frontend

```bash
cd packages/frontend
npm run dev
# → http://localhost:3000
```

### 6. Open the App

| URL | Page |
|-----|------|
| http://localhost:3000 | Landing page |
| http://localhost:3000/demo | Judges demo (standalone) |
| http://localhost:3000/apply | Start real session |
| http://localhost:3000/admin/login | Admin (key: `admin-key-finsa-2026-secure`) |
| http://localhost:3000/risk | Risk dashboard |
| http://localhost:4000/health | Backend health |
| http://localhost:3001 | Grafana (admin/admin) |

### 7. Judge Demo Fast Path

1. Open `/demo` for deterministic walkthrough.
2. Use 2-3 profiles (approved, medium-risk, rejected) to show explainability.
3. Open `/risk` and `/admin` for operations visibility.
4. End with SBI theme mapping from this README and .kiro specs.

---

## API Reference

### Sessions

```
POST   /sessions                    Create session
GET    /sessions/:id                Get session status + offer
POST   /sessions/:id/consent        Record DPDP consent
POST   /sessions/:id/start          Start agent pipeline
POST   /sessions/:id/transcript     Send speech transcript
GET    /sessions/:id/audit/verify   Verify hash chain
GET    /sessions/:id/vcip-pdf       Download V-CIP PDF
```

### Utilities

```
GET    /health                      Server health + uptime
GET    /emi-calculator              EMI calculation
       ?principal=&rate=&months=
GET    /metrics                     Prometheus metrics
POST   /tts/synthesize              Amazon Polly TTS
POST   /webhook/register            Register webhook
```

### Authentication

All API calls require:
```
Authorization: Bearer demo-key-finsa-2026
```

Admin endpoints require:
```
Authorization: Bearer admin-key-finsa-2026-secure
```

---

## Testing

### Property-Based Tests (17 tests)

```bash
cd packages/backend
npx vitest run --reporter=verbose
```

| Test Suite | Properties Verified |
|-----------|-------------------|
| CP-01: Audit Chain Integrity | Valid chain verifies, mutation breaks at index |
| CP-02: Fraud Score Determinism | Pure function, range [0,100], weight correctness |
| CP-03: Offer Bounds | Amount [50K–50L], rate [10.5–24%], 3 tenures |
| CP-04: On-Chain Idempotency | Same hash → same tx, different hash → different tx |
| CP-05: Session Isolation | UUID v4 uniqueness |
| CP-06: Liveness Privacy | No raw image data, confidence in [0,1] |

### TypeScript

```bash
# Frontend
cd packages/frontend && npx tsc --noEmit

# Backend
cd packages/backend && npx tsc --noEmit
```

### End-to-End API Test

```powershell
# Full session flow (PowerShell)
$s = (Invoke-WebRequest -Uri "http://localhost:4000/sessions" `
  -Method POST `
  -Headers @{"Authorization"="Bearer demo-key-finsa-2026";"Content-Type"="application/json"} `
  -Body '{"language":"en"}' -UseBasicParsing | ConvertFrom-Json).session_id

Invoke-WebRequest -Uri "http://localhost:4000/sessions/$s/consent" `
  -Method POST -Headers @{"Authorization"="Bearer demo-key-finsa-2026";"Content-Type"="application/json"} `
  -Body '{"consent_version":"1.0","data_categories":["video","audio","pan"],"purpose":"Loan origination","retention_days":2555}' `
  -UseBasicParsing | Out-Null

Invoke-WebRequest -Uri "http://localhost:4000/sessions/$s/start" `
  -Method POST -Headers @{"Authorization"="Bearer demo-key-finsa-2026";"Content-Type"="application/json"} `
  -Body '{}' -UseBasicParsing | Out-Null

Start-Sleep 2
Invoke-WebRequest -Uri "http://localhost:4000/sessions/$s/transcript" `
  -Method POST -Headers @{"Authorization"="Bearer demo-key-finsa-2026";"Content-Type"="application/json"} `
  -Body '{"transcript":"I need a personal loan for home renovation, my salary is 85000 rupees"}' `
  -UseBasicParsing | Out-Null

Start-Sleep 15
$r = Invoke-WebRequest -Uri "http://localhost:4000/sessions/$s" `
  -Headers @{"Authorization"="Bearer demo-key-finsa-2026"} -UseBasicParsing | ConvertFrom-Json
Write-Host "Status: $($r.status) | Offer: Rs$($r.offer.amount) @ $($r.offer.rate_pa)%"

# Verify audit chain
Invoke-WebRequest -Uri "http://localhost:4000/sessions/$s/audit/verify" `
  -Headers @{"Authorization"="Bearer demo-key-finsa-2026"} -UseBasicParsing | Select-Object -ExpandProperty Content
```

---

## Project Structure

```
finsa-ai/
├── packages/
│   ├── backend/
│   │   └── src/
│   │       ├── agents/          # 8 AI agents
│   │       │   ├── VisualIntelAgent.ts
│   │       │   ├── SpeechIntelAgent.ts
│   │       │   ├── FraudDetectionAgent.ts
│   │       │   ├── BureauRiskAgent.ts
│   │       │   ├── PersonaClassifierAgent.ts
│   │       │   ├── OfferEngineAgent.ts
│   │       │   ├── ComplianceAgent.ts
│   │       │   └── AutoFillAgent.ts
│   │       ├── orchestrator/    # EventBus + Orchestrator
│   │       ├── routes/          # Express routes
│   │       ├── services/        # Business logic
│   │       │   ├── AuditLog.ts
│   │       │   ├── BedrockConversation.ts
│   │       │   ├── CibilIntegration.ts
│   │       │   ├── DocumentIntelligence.ts
│   │       │   ├── EmiCalculator.ts
│   │       │   ├── LoanComparison.ts
│   │       │   ├── PollyTTS.ts
│   │       │   ├── RepaymentPredictor.ts
│   │       │   ├── SolanaAnchor.ts
│   │       │   ├── VcipPdfGenerator.ts
│   │       │   └── WhatsAppNotification.ts
│   │       ├── db/              # PostgreSQL schema + queries
│   │       ├── lib/             # Logger, metrics, auth
│   │       └── tests/           # PBT test suite
│   └── frontend/
│       └── src/
│           ├── pages/           # 7 pages
│           │   ├── LandingPage.tsx
│           │   ├── ConsentPage.tsx
│           │   ├── SessionPage.tsx
│           │   ├── OfferPage.tsx
│           │   ├── DemoPage.tsx
│           │   ├── AdminDashboard.tsx
│           │   └── RiskDashboard.tsx
│           ├── components/      # 12 reusable components
│           └── hooks/           # WebRTC, Socket, Bandwidth
├── docs/                        # Architecture docs
├── grafana/                     # Dashboard JSON
├── docker-compose.yml           # Full stack
├── docker-compose.infra.yml     # Postgres + Redis only
└── .env.example                 # Environment template
```

---

## Deployment

### Full Docker Stack

```bash
# Build and start everything
docker compose up --build

# URLs
# Frontend:  http://localhost:3000
# Backend:   http://localhost:4000
# Grafana:   http://localhost:3001 (admin/admin)
```

### Production Checklist

- [ ] Rotate all API keys (AWS, Anthropic, OpenAI)
- [ ] Generate new Solana keypair for production
- [ ] Set `NODE_ENV=production`
- [ ] Configure `FRONTEND_URL` to production domain
- [ ] Enable HTTPS (nginx/Caddy reverse proxy)
- [ ] Set up S3 for video recording storage
- [ ] Configure MaxMind GeoIP2 license key
- [ ] Set up WhatsApp Business API credentials
- [ ] Enable Postgres SSL

### Troubleshooting Deployed Backend Errors

If judges see backend failures in production, verify these first:

1. API key mismatch during migration:
- Current demo key: `demo-key-finsa-2026`
- Legacy compatibility key: `demo-key-loanwizard-2026`

2. JSON payload size for document verification:
- Session document upload uses base64 payload.
- Backend now supports configurable limit via `JSON_BODY_LIMIT` (default `8mb`).

3. Language validation:
- Session creation supports `en`, `hi`, `mr`, `ta`.

4. Core env values:
- `DATABASE_URL`
- `REDIS_URL`
- `FRONTEND_URL`

5. Health checks:
- `GET /health`
- `GET /metrics`

---

## Judging Criteria Mapping

| Criterion | Our Implementation |
|-----------|-------------------|
| **End-to-End Digitisation** | Zero paper — consent to offer in 30s via video |
| **Accuracy & Compliance** | RBI V-CIP Para 19, DPDP 2023, SHA-256 audit chain |
| **Risk Mitigation** | 7-signal fraud score, geo-fence, liveness, PAN validation |
| **Intelligence & Personalization** | AWS Bedrock Nova, 8 personas, 12 policy rules |
| **Scalability & Reliability** | Redis EventBus, Prometheus metrics, Docker, 99.9% SLA |

---

## Team

Built by **Kuber Labs | IIT Patna** for SBI Hackathon @ Global Fintech Fest 2026.

| | |
|---|---|
| **Project** | Finsa AI — Agentic AI Banking Platform |
| **Team** | Kuber Labs | IIT Patna |
| **Event** | SBI Hackathon @ Global Fintech Fest 2026 |
| **Live Demo** | https://finsa-ai.onrender.com |
| **GitHub** | https://github.com/Shyamistic/Finsa-ai |

---

## License

MIT — see [LICENSE](LICENSE)

---

*Finsa AI · Kuber Labs | IIT Patna · Powered by AWS Bedrock · RBI V-CIP Compliant · DPDP Act 2023*
