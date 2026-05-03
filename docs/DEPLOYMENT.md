# Finsa — Deployment Guide

## Local Development (Recommended for Demo)

### Prerequisites

```bash
# Check versions
node --version   # 20+
pnpm --version   # 8+
docker --version # 24+
```

### Step-by-Step

```bash
# 1. Clone
git clone https://github.com/Shyamistic/Finsa-ai.git
cd Finsa-ai/loanwizard-os

# 2. Install dependencies
pnpm install

# 3. Configure environment
cp .env.example .env
# Edit .env — fill in AWS credentials, Solana key

# 4. Start Postgres + Redis
docker compose -f docker-compose.infra.yml up -d

# 5. Start backend (Terminal 1)
cd packages/backend && npm run dev

# 6. Start frontend (Terminal 2)
cd packages/frontend && npm run dev
```

### Verify Everything Works

```powershell
# Health check
Invoke-WebRequest -Uri "http://localhost:4000/health" -UseBasicParsing | Select-Object -ExpandProperty Content
# Expected: {"status":"ok","agents":7,"uptime_s":...}

# EMI calculator
Invoke-WebRequest -Uri "http://localhost:4000/emi-calculator?principal=1500000&rate=9.99&months=36" -UseBasicParsing | Select-Object -ExpandProperty Content

# Run PBT tests
cd packages/backend && npx vitest run
# Expected: Tests 17 passed (17)
```

---

## Full Docker Stack

```bash
# Build and start everything (Postgres + Redis + Backend + Frontend)
docker compose up --build

# Check status
docker compose ps

# View logs
docker compose logs -f backend
docker compose logs -f frontend
```

---

## Production Deployment (AWS)

### Architecture

```
Internet → CloudFront CDN
              ├── /api/* → ALB → ECS (Backend containers)
              └── /*     → S3 (Frontend static build)

ECS Backend → RDS PostgreSQL (ap-south-1)
           → ElastiCache Redis
           → Bedrock Nova Lite
           → Polly TTS
           → S3 (video recordings)
```

### Environment Variables for Production

```bash
NODE_ENV=production
FRONTEND_URL=https://finsa.poonawallafincorp.com
DATABASE_URL=postgresql://user:pass@rds-endpoint:5432/finsa
REDIS_URL=redis://elasticache-endpoint:6379
AWS_REGION=ap-south-1
LOG_LEVEL=warn
```

### Build Frontend

```bash
cd packages/frontend
npm run build
# Output: dist/ — deploy to S3 + CloudFront
```

### Build Backend Docker Image

```bash
cd packages/backend
docker build -t finsa-backend:latest .
# Push to ECR and deploy to ECS
```

---

## Demo Recording Guide

### For the Hackathon Video

The demo video should show the complete flow:

1. **Start screen** — Show the WhatsApp/SMS message with the campaign link
2. **Click the link** — Opens `https://finsa.poonawallafincorp.com/apply`
3. **Consent page** — Check the consent box, click "Start Video Session"
4. **Video call starts** — Camera activates, Priya greets you
5. **Speak naturally** — Answer Priya's questions with real details
6. **Show the Auto-Fill tab** — Form filling in real-time as you speak
7. **Offer page** — Show the personalised offer, tenure selector, EMI calculator
8. **Audit chain** — Show the Solana Devnet verification link
9. **V-CIP PDF** — Download and show the compliance record

### Recording Tips

- Use Chrome or Edge (Web Speech API support)
- Ensure microphone permissions are granted
- Speak clearly — the STT works best with clear audio
- Use a real PAN card for the demo (the system handles unknown PANs gracefully)
- Record at 1080p for maximum impact

### WhatsApp Message Template

```
🏦 *Poonawalla Fincorp*

Hi [Name]! You're pre-approved for a personal loan up to ₹50 Lakhs.

✅ 3-minute video process
✅ No branch visit required
✅ Instant offer

Start your application:
https://finsa.poonawallafincorp.com/apply?ref=wa&utm_source=whatsapp&utm_campaign=preapproved2026

_This is a secure link. Valid for 24 hours._
_Poonawalla Fincorp Limited | RBI Reg. No. N-13.02268_
```

---

## Troubleshooting

### Backend won't start

```bash
# Check if Postgres is running
docker compose -f docker-compose.infra.yml ps

# Check backend logs
cd packages/backend && npm run dev 2>&1 | head -50

# Common issue: DATABASE_URL wrong
# Fix: ensure postgres container is healthy before starting backend
```

### "Failed to start session" on consent page

```bash
# Backend not running — start it first
cd packages/backend && npm run dev

# Or use Demo Mode (no backend needed)
# Navigate to http://localhost:3000/demo
```

### Speech recognition not working

- Use Chrome or Edge (Firefox doesn't support Web Speech API)
- Check microphone permissions in browser settings
- Ensure HTTPS in production (Web Speech API requires secure context)

### Agents firing multiple times

This was a known bug — fixed in the current version. If you see it:
```bash
# Restart the backend
Ctrl+C
npm run dev
```

### Audit chain shows broken_at:0

This was a race condition in concurrent audit appends — fixed with `pg_advisory_xact_lock`. Restart the backend and create a fresh session.
