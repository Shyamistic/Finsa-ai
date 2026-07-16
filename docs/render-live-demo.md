# Render Live Demo Deployment (SBI GFF)

This guide deploys Finsa AI quickly for a live demo using:
- Render Web Service for backend
- Render Static Site for frontend
- Render PostgreSQL
- Render Redis

## 1) Create backend service

In Render dashboard, create a new **Web Service** from this repository.

Use:
- Name: `finsa-backend`
- Root directory: `packages/backend`
- Environment: `Node`
- Build command: `npm ci && npm run build`
- Start command: `npm run start`
- Health check path: `/health`

## 2) Create managed PostgreSQL and Redis

Create:
- PostgreSQL instance (starter plan is fine for demo)
- Redis instance (starter plan is fine for demo)

Copy connection strings for both.

## 3) Backend environment variables (Render)

Set these in backend service:

Required core:
- `NODE_ENV=production`
- `DATABASE_URL=<render postgres internal connection string>`
- `REDIS_URL=<render redis internal connection string>`
- `PORT=10000`

AWS required for this project:
- `AWS_REGION=us-east-1`
- `BEDROCK_MODEL_ID=amazon.nova-lite-v1:0`
- `AWS_ACCESS_KEY_ID=<new account key>`
- `AWS_SECRET_ACCESS_KEY=<new account secret>`

Demo-safe defaults:
- `API_KEY=demo-key-finsa-2026`
- `ADMIN_API_KEY=<new strong random value>`
- `JSON_BODY_LIMIT=8mb`
- `LOG_LEVEL=info`
- `DEMO_MODE=true`
- `GEOIP_SKIP_IN_DEV=true`

Optional integrations (only if you use them in demo):
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `SOLANA_PRIVATE_KEY`
- `SOLANA_PUBLIC_KEY`
- `SOLANA_NETWORK=devnet`

## 4) Create frontend service

Create a **Static Site** from same repository:
- Name: `finsa-frontend`
- Root directory: `packages/frontend`
- Build command: `npm ci && npm run build`
- Publish directory: `dist`

Set frontend env vars before first build:
- `VITE_API_URL=https://<your-backend-service>.onrender.com`
- `VITE_WS_URL=https://<your-backend-service>.onrender.com`
- `VITE_ADMIN_KEY=<same as backend ADMIN_API_KEY>`

Redeploy frontend after setting env vars.

## 5) Demo preflight checks (must pass)

From browser:
- `https://<backend>.onrender.com/health`
- `https://<backend>.onrender.com/metrics`
- Open frontend and start a sample session

In backend logs, verify:
- database connection success
- migrations complete
- no AWS credential errors
- no 413 payload errors on document upload

## 6) Last-minute fallback plan

If AWS services throttle/fail during live demo:
- Keep `DEMO_MODE=true`
- Use pre-recorded short flow + live partial walkthrough
- Show `/health` and real session creation live

## 7) Security after event

Immediately rotate:
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`
- `API_KEY` / `ADMIN_API_KEY`
- any optional third-party keys
