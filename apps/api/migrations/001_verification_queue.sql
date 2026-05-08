CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS verification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_id TEXT NOT NULL,
  candidate_url TEXT NOT NULL,
  source_domain TEXT NOT NULL,
  is_likely_real_movie BOOLEAN NOT NULL,
  is_likely_legal BOOLEAN NOT NULL,
  classification TEXT NOT NULL,
  confidence DOUBLE PRECISION NOT NULL,
  safe_to_show_user BOOLEAN NOT NULL,
  reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by_uid TEXT,
  reviewer_email TEXT,
  CONSTRAINT verification_queue_status_check CHECK (status IN ('pending', 'approved', 'rejected'))
);

CREATE INDEX IF NOT EXISTS idx_verification_queue_status_created
  ON verification_queue (status, created_at DESC);
