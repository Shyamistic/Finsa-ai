import { Registry, Gauge, Histogram, Counter } from 'prom-client';

export const register = new Registry();

export const activeSessionsGauge = new Gauge({
  name: 'active_sessions_total',
  help: 'Currently active sessions',
  registers: [register],
});

export const agentProcessingTime = new Histogram({
  name: 'agent_processing_time_ms',
  help: 'Per-agent processing latency in ms',
  labelNames: ['agent_id'],
  buckets: [10, 50, 100, 250, 500, 1000, 2000, 5000],
  registers: [register],
});

export const fraudScoreHistogram = new Histogram({
  name: 'fraud_score_histogram',
  help: 'Distribution of fraud scores',
  buckets: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
  registers: [register],
});

export const offerGeneratedCounter = new Counter({
  name: 'offer_generated_total',
  help: 'Total successful offers generated',
  registers: [register],
});

export const sessionRejectedCounter = new Counter({
  name: 'session_rejected_total',
  help: 'Total rejected sessions',
  labelNames: ['reason'],
  registers: [register],
});

export const solanaAnchorSuccessCounter = new Counter({
  name: 'solana_anchor_success_total',
  help: 'Successful Solana on-chain anchors',
  registers: [register],
});

export const solanaAnchorFailureCounter = new Counter({
  name: 'solana_anchor_failure_total',
  help: 'Failed Solana on-chain anchors',
  registers: [register],
});

export const bandwidthTierCounter = new Counter({
  name: 'bandwidth_tier_total',
  help: 'Sessions by bandwidth tier',
  labelNames: ['tier'],
  registers: [register],
});
