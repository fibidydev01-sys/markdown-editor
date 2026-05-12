-- ============================================================
-- VibesDoc — Migration 001: Base Schema (Boilerplate)
-- ============================================================
-- Run order: 001 → 002 → 003
-- Prerequisites: FRESH Supabase project (no existing tables)
--
-- Creates:
--   - user_profiles      (1:1 with auth.users, auto-created on signup)
--   - user_preferences   (onboarding flags)
--   - user_trials        (48hr trial tracking)
--   - subscriptions      (Lemon Squeezy subscription data)
--   - webhook_events     (LS webhook event log)
--   - Shared helpers: handle_updated_at(), get_my_role()
--   - Auto-trigger: handle_new_user() on auth.users INSERT
--
-- Stack: Next.js 16 + Supabase SSR + Lemon Squeezy
-- ============================================================


-- ============================================================
-- EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================
-- TABLE: user_profiles
-- ============================================================

CREATE TABLE public.user_profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT        NOT NULL,
  role        TEXT        NOT NULL DEFAULT 'user'
                          CHECK (role IN ('super_admin', 'user')),
  avatar_url  TEXT,
  phone       TEXT,
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  is_deleted  BOOLEAN     NOT NULL DEFAULT FALSE,
  deleted_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_role      ON public.user_profiles(role);
CREATE INDEX idx_user_profiles_is_active ON public.user_profiles(is_active);


-- ============================================================
-- TABLE: user_preferences
-- ============================================================

CREATE TABLE public.user_preferences (
  id                       UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                  UUID        NOT NULL UNIQUE
                                       REFERENCES auth.users(id) ON DELETE CASCADE,
  has_completed_onboarding BOOLEAN     DEFAULT FALSE,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_preferences_user_id ON public.user_preferences(user_id);


-- ============================================================
-- TABLE: user_trials
-- ============================================================

CREATE TABLE public.user_trials (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID        NOT NULL UNIQUE
                               REFERENCES auth.users(id) ON DELETE CASCADE,
  trial_start_time TIMESTAMPTZ DEFAULT NOW(),
  trial_end_time   TIMESTAMPTZ NOT NULL,
  is_trial_used    BOOLEAN     DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_trials_user_id ON public.user_trials(user_id);


-- ============================================================
-- TABLE: subscriptions (Lemon Squeezy)
-- ============================================================
-- Status convention after mapping from LS:
--   active    — paying customer
--   trialing  — in trial period (LS: on_trial)
--   cancelled — cancelled, access until ends_at
--   expired   — past ends_at, no access
--   paused    — temporarily paused
--   past_due  — payment failed, grace period
--   unpaid    — payment failed beyond grace
-- ============================================================

CREATE TABLE public.subscriptions (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID        REFERENCES public.user_profiles(id) ON DELETE CASCADE,

  -- Lemon Squeezy identifiers
  ls_subscription_id TEXT        UNIQUE,
  ls_customer_id     TEXT,
  ls_order_id        TEXT,
  ls_product_id      TEXT,
  ls_variant_id      TEXT,
  ls_variant_name    TEXT,

  -- Subscription state
  status             TEXT        NOT NULL DEFAULT 'active'
                                 CHECK (status IN (
                                   'active', 'trialing', 'cancelled', 'expired',
                                   'paused', 'past_due', 'unpaid'
                                 )),

  -- Dates
  renews_at          TIMESTAMPTZ,
  ends_at            TIMESTAMPTZ,
  trial_ends_at      TIMESTAMPTZ,

  -- Billing info
  price              TEXT,
  card_brand         TEXT,
  card_last_four     TEXT,
  is_paused          BOOLEAN     DEFAULT FALSE,

  -- Soft delete
  deleted_at         TIMESTAMPTZ,

  -- Timestamps
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id            ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_ls_subscription_id ON public.subscriptions(ls_subscription_id);
CREATE INDEX idx_subscriptions_status             ON public.subscriptions(status);


-- ============================================================
-- TABLE: webhook_events (Lemon Squeezy best practice)
-- ============================================================
-- Log ALL webhook events BEFORE processing.
-- Return 200 fast, process async if needed.
-- ============================================================

CREATE TABLE public.webhook_events (
  id               BIGSERIAL   PRIMARY KEY,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_name       TEXT        NOT NULL,
  processed        BOOLEAN     DEFAULT FALSE,
  body             JSONB       NOT NULL,
  processing_error TEXT
);

CREATE INDEX idx_webhook_events_processed  ON public.webhook_events(processed);
CREATE INDEX idx_webhook_events_event_name ON public.webhook_events(event_name);
CREATE INDEX idx_webhook_events_created_at ON public.webhook_events(created_at DESC);


-- ============================================================
-- HELPER FUNCTION: get_my_role (bypass RLS in policies)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;


-- ============================================================
-- SHARED HELPER: handle_updated_at trigger function
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- Apply to all tables with updated_at
CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_user_trials_updated_at
  BEFORE UPDATE ON public.user_trials
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ============================================================
-- AUTO-CREATE PROFILE on signup
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- RLS — user_profiles
-- ============================================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_profiles_select"
  ON public.user_profiles FOR SELECT
  USING (
    auth.uid() = id
    OR public.get_my_role() = 'super_admin'
  );

CREATE POLICY "user_profiles_insert"
  ON public.user_profiles FOR INSERT
  WITH CHECK (
    auth.uid() = id
    OR public.get_my_role() = 'super_admin'
  );

CREATE POLICY "user_profiles_update_own"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = public.get_my_role()
    AND is_active = (SELECT is_active FROM public.user_profiles WHERE id = auth.uid())
  );

CREATE POLICY "user_profiles_update_admin"
  ON public.user_profiles FOR UPDATE
  USING (public.get_my_role() = 'super_admin');

CREATE POLICY "user_profiles_delete_admin"
  ON public.user_profiles FOR DELETE
  USING (public.get_my_role() = 'super_admin');


-- ============================================================
-- RLS — user_preferences
-- ============================================================

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_preferences_select"
  ON public.user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_preferences_insert"
  ON public.user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_preferences_update"
  ON public.user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "user_preferences_admin"
  ON public.user_preferences FOR ALL
  TO service_role USING (true);


-- ============================================================
-- RLS — user_trials
-- ============================================================

ALTER TABLE public.user_trials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_trials_select"
  ON public.user_trials FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_trials_insert"
  ON public.user_trials FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_trials_update"
  ON public.user_trials FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "user_trials_admin"
  ON public.user_trials FOR ALL
  TO service_role USING (true);


-- ============================================================
-- RLS — subscriptions
-- ============================================================

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can read their own subscriptions
CREATE POLICY "subscriptions_select_own"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Admin can read all subscriptions
CREATE POLICY "subscriptions_select_admin"
  ON public.subscriptions FOR SELECT
  USING (public.get_my_role() = 'super_admin');

-- Only service_role can INSERT/UPDATE (webhook handler)
CREATE POLICY "subscriptions_service_role"
  ON public.subscriptions FOR ALL
  TO service_role USING (true);


-- ============================================================
-- RLS — webhook_events
-- ============================================================

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Only service_role can access webhook_events
CREATE POLICY "webhook_events_service_role"
  ON public.webhook_events FOR ALL
  TO service_role USING (true);


-- ============================================================
-- GRANTS
-- ============================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- user_profiles
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_profiles TO authenticated;
GRANT SELECT ON public.user_profiles TO anon;

-- user_preferences
GRANT SELECT, INSERT, UPDATE ON public.user_preferences TO authenticated;

-- user_trials
GRANT SELECT, INSERT, UPDATE ON public.user_trials TO authenticated;

-- subscriptions (read-only for authenticated, write via service_role)
GRANT SELECT ON public.subscriptions TO authenticated;

-- webhook_events (no direct access — service_role only)

-- Sequence for webhook_events
GRANT USAGE, SELECT ON SEQUENCE public.webhook_events_id_seq TO service_role;


-- ============================================================
-- ✅ MIGRATION 001 DONE
-- ============================================================
-- Next: Run 002_workspaces.sql
-- ============================================================