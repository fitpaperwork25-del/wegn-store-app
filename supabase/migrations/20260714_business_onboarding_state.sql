-- ========================================
-- business_onboarding_state table
-- Applied: 2026-07-14
-- Scope: Wegn AI Onboarding Blueprint, Phase 1 only (Welcome, Business
--        Discovery, Industry Detection). Tracks whether a business has
--        completed the Wegn AI-guided setup flow, which step it's on, and
--        the answers collected so far, so the flow can be resumed exactly
--        where it left off after any interruption (closed tab, refresh,
--        different device).
--
-- Backfill: every business that exists at the time this migration is
--        applied is marked completed=true immediately below, so no
--        existing user is ever routed into onboarding. Only businesses
--        created after this migration get a completed=false row, inserted
--        explicitly by the app at business-creation time
--        (handleCreateBusiness in App.tsx).
-- Rollback: See bottom of file
-- ========================================

CREATE TABLE IF NOT EXISTS business_onboarding_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  current_step integer NOT NULL DEFAULT 1,
  step_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id)
);

CREATE INDEX IF NOT EXISTS idx_business_onboarding_state_business_id ON business_onboarding_state(business_id);

ALTER TABLE business_onboarding_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON business_onboarding_state;
CREATE POLICY tenant_isolation ON business_onboarding_state
  FOR ALL
  USING (business_id = auth_business_id())
  WITH CHECK (business_id = auth_business_id());

-- Backfill: mark every pre-existing business as having already completed
-- onboarding, so this migration can never change a current user's experience.
INSERT INTO business_onboarding_state (business_id, completed, current_step, step_data)
SELECT id, true, 3, '{}'::jsonb
FROM businesses
ON CONFLICT (business_id) DO NOTHING;

-- ========================================
-- ROLLBACK SQL (do not run unless reverting)
-- ========================================
--
-- DROP TABLE IF EXISTS business_onboarding_state;
