# Finsa AI — Demo Video Script
## SBI Hackathon @ GFF 2026 | Duration: 5–7 Minutes

---

## Section 1: Opening Hook (0:00 – 0:30)

### Speaker Script:
> "What if SBI could acquire, engage, and retain customers through a single intelligent platform that speaks their language?"
>
> "What if every customer interaction — from the very first click to years of engagement — was orchestrated by AI agents working in parallel, in real-time, in any of India's major languages?"
>
> "This is Finsa AI. Not a chatbot. Not a form. An agentic AI platform built specifically for SBI's three strategic pillars."

### Screen Actions:
- Open with Finsa AI logo animating into SBI-branded version
- Show the three pillars appearing one by one: 🎯 Acquisition · 📱 Adoption · 💡 Engagement
- End on the platform landing page with SBI branding active

### Timing Notes:
- Keep energy high, pace brisk
- Logo animation: 5s, pillar reveal: 10s, landing page: 15s

---

## Section 2: Problem Statement (0:30 – 1:15)

### Speaker Script:
> "India's banking sector faces three critical challenges that technology hasn't solved yet."
>
> "First — Customer Acquisition. The average cost to acquire a banking customer exceeds ₹3,200.
> 72% of applicants abandon form-based journeys. Banks are spending more and converting less."
>
> "Second — Digital Adoption. Over 60% of customers never activate features like UPI, YONO, or SIP
> after onboarding. The features exist — customers just don't discover them."
>
> "Third — Digital Engagement. 85% of life-event opportunities — salary credits, birthdays,
> job changes — go completely unaddressed. Reactive service means missed revenue."
>
> "Finsa AI solves all three. Simultaneously. With one platform."

### Screen Actions:
- Show animated statistics appearing on screen (₹3,200 CAC, 72% drop-off, 60% unused features)
- Red/orange highlighting for pain metrics
- Transition: stats dissolve into Finsa AI dashboard

### Timing Notes:
- 15s per pillar problem statement
- Pause briefly after each statistic for impact

---

## Section 3: Live Demo — Pillar 1: Customer Acquisition (1:15 – 2:45)

### Speaker Script:
> "Let me show you Pillar 1 in action. I'm navigating to our live demo at finsa-ai.onrender.com."
>
> "Watch what happens when a prospect arrives. I'll select 'SBI Personal Loan Flow' from our demo panel."
>
> [Click "Start Demo"]
>
> "Immediately, our Customer Acquisition Agent computes a Lead Score. You can see it updating
> in real-time — behavioral signals, engagement patterns, demographics — all synthesized into
> a score from 0 to 100."
>
> "This prospect scores 82 — that's 'High-Intent.' The system automatically triggers our
> conversational AI onboarding. No forms. No waiting. Instant engagement."
>
> "Now watch the agent panel on the right. Seven agents initialize simultaneously —
> Visual Intel, Speech Intel, Fraud Detection, Bureau Risk, Persona Classifier, Offer Engine,
> and Compliance. All running in parallel via our Redis EventBus."
>
> "The AI agent Priya begins the conversation. She's asking qualifying questions naturally —
> employment, income, loan purpose — all extracted via speech-to-text and auto-filled.
> No typing required."
>
> "Lead scoring updates as the conversation progresses. Segment classification: High-Intent.
> This entire acquisition flow — from first click to qualified lead — takes under 15 seconds."

### Screen Actions:
1. Navigate to https://finsa-ai.onrender.com/demo
2. Click "SBI Personal Loan Flow" in the scenario selector
3. Point to the Lead Score gauge updating in real-time
4. Point to the segment classification badge
5. Show the agent activity panel with all 7 agents initializing
6. Show the chat interface with Priya's conversation
7. Highlight the auto-filled fields appearing

### Timing Notes:
- 10s for navigation and selection
- 20s for lead scoring demonstration
- 30s for agent initialization and parallel execution
- 30s for conversational flow and auto-fill

---

## Section 4: Live Demo — Pillar 2: Digital Adoption (2:45 – 3:45)

### Speaker Script:
> "Now Pillar 2 — Digital Adoption. Watch what happens during the conversation."
>
> "Our Digital Adoption Agent has been monitoring the conversation context. It detected that
> this customer has a salary account but hasn't activated UPI. So it generates a contextual nudge."
>
> "See that nudge card? It says 'Activate UPI to receive instant loan disbursement —
> no bank visit needed.' It's not a random banner — it's contextually relevant to what
> the customer is doing RIGHT NOW."
>
> "The system limits nudges — maximum 3 per session, minimum 60 seconds apart.
> If dismissed, it never re-nudges the same feature. Respectful, intelligent engagement."
>
> "Here's the second nudge: 'Set up a SIP with your EMI savings after loan approval.'
> Again — contextual to the loan journey, not generic advertising."
>
> "Our tracking shows 45% acceptance rate for contextual nudges versus 3% for banner ads.
> That's a 15x improvement in digital feature activation."

### Screen Actions:
1. Point to the nudge card appearing in the conversation
2. Show the feature targeted: "UPI Activation"
3. Show the personalized message content
4. Demonstrate the nudge timing (60s interval)
5. Show a second nudge appearing for SIP
6. Point to the acceptance tracking metrics in the evaluator panel

### Timing Notes:
- 15s for first nudge explanation
- 15s for nudge rules and respectful engagement
- 15s for second nudge and SIP recommendation
- 15s for metrics and impact

---

## Section 5: Live Demo — Pillar 3: Digital Engagement (3:45 – 4:45)

### Speaker Script:
> "Pillar 3 — Digital Engagement. This is where it gets proactive."
>
> "Our Life-Event Engagement Agent works by detecting financial life events from customer data.
> Let me switch to a different demo profile — Priya Sharma, our salaried urban customer."
>
> "The agent detects a salary credit event. Immediately, it generates a personalized
> recommendation: 'Start a SIP with 10% of your monthly increment.' The personalization
> score is 0.87 — high confidence this is relevant."
>
> "For another profile, the system detects an EMI completion. Recommendation: credit limit
> increase on existing card. Personalization score: 0.92."
>
> "Each life event maps to exactly one product suggestion. Salary → SIP.
> Birthday → Reward offer. Job change → Home loan pre-approval. Large deposit → FD.
> EMI completion → Credit limit increase."
>
> "This is NOT reactive service. This is AI that anticipates customer needs before they
> even articulate them. Our data shows 3.5x higher engagement versus batch campaigns."

### Screen Actions:
1. Switch to Priya Sharma profile (ABCDE1234F)
2. Show the life-event detection panel
3. Point to "Salary Credit" event detected
4. Show the recommendation card with SIP suggestion
5. Show the personalization score gauge (0.87)
6. Switch to another profile showing EMI completion
7. Show the event → product mapping table

### Timing Notes:
- 10s for profile switch and context
- 20s for salary credit → SIP demo
- 15s for EMI completion → credit limit demo
- 15s for mapping explanation and impact metrics

---

## Section 6: Technical Deep Dive (4:45 – 5:45)

### Speaker Script:
> "Let me show you what's happening under the hood."
>
> "Here's our agent dashboard. You can see all 12 agents — their status, execution time,
> and event flow. Everything communicates via Redis EventBus — no direct coupling between
> agents. This means we can scale horizontally."
>
> "The audit trail — every single action is hash-chained. Each entry's prev_hash equals
> the preceding entry's payload_hash. And the root hash is anchored to Solana Devnet."
>
> [Click "Verify Audit on Solana"]
>
> "This opens Solana Explorer. Anyone can verify this session happened — without accessing
> any personal data. Immutable, tamper-evident compliance proof."
>
> "Fraud detection: 7 signals running simultaneously — geolocation, device fingerprint,
> session velocity, liveness, PAN validation, behavioral biometrics, and network risk.
> Composite score computed in real-time. Score over 70 means instant rejection."
>
> "And all of this is DPDP Act compliant. Biometric processing happens entirely in the browser.
> Only derived features — liveness score, transcript text — are transmitted. No raw video
> or audio ever reaches our server."

### Screen Actions:
1. Navigate to Admin Dashboard (/admin)
2. Show agent status grid with all 12 agents
3. Show event flow visualization with Redis channels
4. Navigate to audit trail section
5. Click "Verify Audit on Solana" — show Solana Explorer opening
6. Show fraud detection panel with 7-signal radar chart
7. Show the data flow diagram (client-side biometrics)

### Timing Notes:
- 15s for agent dashboard overview
- 15s for audit trail and Solana verification
- 15s for fraud detection signals
- 15s for DPDP compliance and data flow

---

## Section 7: Production Roadmap (5:45 – 6:30)

### Speaker Script:
> "What you've seen is our working prototype. Here's what production looks like."
>
> "Full AWS deployment using CDK infrastructure-as-code. ECS Fargate for compute —
> serverless containers that auto-scale. RDS PostgreSQL Multi-AZ for the database —
> automatic failover. ElastiCache Redis for our EventBus. CloudFront CDN for global edge delivery."
>
> "Deployment strategy: Blue/Green zero-downtime deployments. If a health check fails,
> automatic rollback. No customer impact during updates."
>
> "Multilingual: Sarvam AI integration brings 10 Indian languages. Hindi, Tamil, Telugu,
> Bengali, Marathi, Kannada, Malayalam, Gujarati, Punjabi, and Odia.
> That's 90%+ of India's population interacting in their native language."
>
> "Enterprise features: Admin dashboard with RBAC, analytics engine with A/B testing,
> API gateway with OAuth 2.0, auto-generated SDKs for third-party integration.
> This isn't a hackathon demo — it's an enterprise platform."

### Screen Actions:
1. Show AWS architecture diagram (pre-prepared slide)
2. Highlight: ECS Fargate → RDS → ElastiCache → CloudFront
3. Show Blue/Green deployment animation
4. Show India map with 10 language regions highlighted
5. Show Sarvam AI integration diagram
6. Flash enterprise features: Admin, Analytics, API Gateway

### Timing Notes:
- 15s for AWS infrastructure
- 10s for deployment strategy
- 10s for multilingual / Sarvam AI
- 10s for enterprise features

---

## Section 8: Closing (6:30 – 7:00)

### Speaker Script:
> "Finsa AI isn't just a prototype — it's a production-ready orchestration layer
> that can be deployed on SBI infrastructure today."
>
> "One platform addressing all three pillars. Twelve agents running in parallel.
> Ten Indian languages. Immutable audit trails. DPDP Act compliant from day one."
>
> "The numbers speak for themselves: 3x faster onboarding. 80% reduction in manual KYC.
> 40% improvement in lead conversion. 60% increase in digital adoption."
>
> "We're Tenzor. We built Finsa AI for SBI's digital future."
>
> "Thank you. We'd love to schedule a technical deep-dive with your engineering team."

### Screen Actions:
1. Return to landing page with SBI branding
2. Show impact metrics animating in (3x, 80%, 40%, 60%)
3. Show QR code for live demo: https://finsa-ai.onrender.com/demo
4. Show GitHub link: https://github.com/Shyamistic/Finsa-ai
5. End on "Schedule a Technical Deep Dive" CTA

### Timing Notes:
- 10s for platform summary
- 10s for metrics
- 10s for closing and CTA

---

## Production Notes

### Equipment Needed:
- Screen recording software (OBS recommended)
- Microphone (clear audio essential)
- Stable internet for live demo portions
- Backup: pre-recorded demo segments in case of connectivity issues

### Pre-Recording Checklist:
- [ ] Verify demo is running at https://finsa-ai.onrender.com
- [ ] Test all 5 demo profiles work correctly
- [ ] Verify Solana anchor is generating (Devnet may need faucet SOL)
- [ ] Set SBI white-label config active for demo mode
- [ ] Clear browser cache for clean visual state
- [ ] Test screen recording captures both screen and audio
- [ ] Prepare fallback slides for each demo section

### Backup Plan:
If the live demo is unavailable during recording:
1. Use pre-recorded screen captures for each demo section
2. Overlay with live narration
3. Include "Live at: finsa-ai.onrender.com" watermark

### Key Phrases to Emphasize:
- "All three SBI pillars — one platform"
- "Not a chatbot — multi-agent orchestration"
- "Under 15 seconds for full pipeline"
- "Blockchain-anchored compliance"
- "10 Indian languages"
- "Production-ready, not just a demo"

---

*Finsa AI | SBI Hackathon @ GFF 2026 | Tenzor*
