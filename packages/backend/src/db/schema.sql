-- LoanWizard OS — PostgreSQL Schema
-- Initialised automatically by Docker Compose via docker-entrypoint-initdb.d

-- sessions
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status VARCHAR(32) NOT NULL DEFAULT 'initiated',
  pan_masked VARCHAR(16),
  persona VARCHAR(32),
  risk_band VARCHAR(8),
  fraud_score SMALLINT,
  offer JSONB,
  language CHAR(2) DEFAULT 'en',
  geo_country CHAR(2),
  bandwidth_tier VARCHAR(16),
  solana_tx_signature VARCHAR(128),
  vcip_pdf_url TEXT,
  resume_token UUID NOT NULL DEFAULT gen_random_uuid(),
  white_label_config JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- audit_log_entries
CREATE TABLE IF NOT EXISTS audit_log_entries (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES sessions(id),
  seq INTEGER NOT NULL,
  event_type VARCHAR(64) NOT NULL,
  timestamp_ms BIGINT NOT NULL,
  payload_hash CHAR(64) NOT NULL,
  prev_hash CHAR(64) NOT NULL,
  payload JSONB NOT NULL,
  UNIQUE(session_id, seq)
);

-- dpdp_consent_trail
CREATE TABLE IF NOT EXISTS dpdp_consent_trail (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES sessions(id),
  customer_ip INET,
  consent_version VARCHAR(16) NOT NULL,
  consented_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_categories TEXT[] NOT NULL,
  purpose TEXT NOT NULL,
  retention_days INTEGER NOT NULL
);

-- webhook_registrations
CREATE TABLE IF NOT EXISTS webhook_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  api_key_hash CHAR(64) NOT NULL,
  events TEXT[] NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- policy_rules (single-row JSON store)
CREATE TABLE IF NOT EXISTS policy_rules (
  id INTEGER PRIMARY KEY DEFAULT 1,
  rules JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- api_keys
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash CHAR(64) NOT NULL UNIQUE,
  role VARCHAR(16) NOT NULL DEFAULT 'api', -- 'api' or 'admin'
  label VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
