-- Migration 002: Finsa AI Multi-Product Schema Extensions
-- Adds product_type to sessions, creates lead_scores, nudge_events, life_events, product_catalog tables
-- Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8

-- Migration: Add product_type to sessions
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS product_type VARCHAR(32) NOT NULL DEFAULT 'personal_loan';

-- New table: lead_scores
CREATE TABLE IF NOT EXISTS lead_scores (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES sessions(id),
  score NUMERIC(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
  segment VARCHAR(32) NOT NULL CHECK (segment IN ('high-intent', 'warm-lead', 'cold-lead', 'not-qualified')),
  scored_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lead_scores_session_id ON lead_scores(session_id);

-- New table: nudge_events
CREATE TABLE IF NOT EXISTS nudge_events (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES sessions(id),
  nudge_type VARCHAR(64) NOT NULL,
  feature_targeted VARCHAR(64) NOT NULL,
  accepted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_nudge_events_session_id ON nudge_events(session_id);

-- New table: life_events
CREATE TABLE IF NOT EXISTS life_events (
  id BIGSERIAL PRIMARY KEY,
  customer_id UUID NOT NULL,
  event_type VARCHAR(64) NOT NULL,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  engagement_action VARCHAR(64),
  outcome VARCHAR(32)
);
CREATE INDEX IF NOT EXISTS idx_life_events_customer_id ON life_events(customer_id);

-- New table: product_catalog
CREATE TABLE IF NOT EXISTS product_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_type VARCHAR(32) NOT NULL UNIQUE,
  config JSONB NOT NULL DEFAULT '{}',
  eligibility_rules JSONB NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Seed product catalog
INSERT INTO product_catalog (product_type, config, active) VALUES
  ('personal_loan', '{"displayName": "Personal Loan", "agents": ["visual_intel","speech_intel","fraud_detection","bureau_risk","persona","offer","compliance","auto_fill"]}', true),
  ('savings_account', '{"displayName": "Savings Account", "agents": ["speech_intel","customer_acquisition","digital_adoption","compliance"]}', true),
  ('credit_card', '{"displayName": "Credit Card", "agents": ["speech_intel","fraud_detection","bureau_risk","persona","offer","compliance"]}', true),
  ('investment_sip', '{"displayName": "Investment / SIP", "agents": ["speech_intel","persona","life_event","offer","compliance"]}', true),
  ('insurance', '{"displayName": "Insurance", "agents": ["speech_intel","persona","life_event","offer","compliance"]}', true),
  ('fixed_deposit', '{"displayName": "Fixed Deposit", "agents": ["speech_intel","customer_acquisition","offer","compliance"]}', true),
  ('upi_digital', '{"displayName": "UPI / Digital Payments", "agents": ["speech_intel","digital_adoption","compliance"]}', true)
ON CONFLICT (product_type) DO NOTHING;
