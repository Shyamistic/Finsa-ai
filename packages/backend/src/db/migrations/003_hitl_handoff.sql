ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS handoff_status VARCHAR(24) NOT NULL DEFAULT 'not_assigned';

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS handoff_ticket_id VARCHAR(64);

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS handoff_notes TEXT;

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS handoff_assigned_at TIMESTAMPTZ;
