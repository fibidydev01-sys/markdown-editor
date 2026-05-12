-- ============================================================
-- VibesDoc — Complete Database Setup (All-in-One)
-- ============================================================
-- Stack: Next.js 16 + Supabase SSR + Lemon Squeezy
-- Target: FRESH Supabase project (no existing tables)
--
-- This file combines:
--   - 001_base_schema.sql        (boilerplate: profiles, prefs, trials, subs, webhooks)
--   - 002_workspaces.sql         (Phase H: workspaces + auto-create trigger)
--   - 003_notebook_publishes.sql (Phase I: publishes + view + free tier RPC)
--
-- Run ONCE in Supabase SQL Editor.
--
-- After running, verify with:
--   SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;
-- Expected (7 tables):
--   notebook_publishes, subscriptions, user_preferences, user_profiles,
--   user_trials, webhook_events, workspaces
-- ============================================================


-- ============================================================
-- EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================
--  PART 1 — BASE SCHEMA (boilerplate)
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


CREATE TABLE public.user_preferences (
  id                       UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                  UUID        NOT NULL UNIQUE
                                       REFERENCES auth.users(id) ON DELETE CASCADE,
  has_completed_onboarding BOOLEAN     DEFAULT FALSE,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_preferences_user_id ON public.user_preferences(user_id);


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


CREATE TABLE public.subscriptions (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID        REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  ls_subscription_id TEXT        UNIQUE,
  ls_customer_id     TEXT,
  ls_order_id        TEXT,
  ls_product_id      TEXT,
  ls_variant_id      TEXT,
  ls_variant_name    TEXT,
  status             TEXT        NOT NULL DEFAULT 'active'
                                 CHECK (status IN (
                                   'active', 'trialing', 'cancelled', 'expired',
                                   'paused', 'past_due', 'unpaid'
                                 )),
  renews_at          TIMESTAMPTZ,
  ends_at            TIMESTAMPTZ,
  trial_ends_at      TIMESTAMPTZ,
  price              TEXT,
  card_brand         TEXT,
  card_last_four     TEXT,
  is_paused          BOOLEAN     DEFAULT FALSE,
  deleted_at         TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id            ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_ls_subscription_id ON public.subscriptions(ls_subscription_id);
CREATE INDEX idx_subscriptions_status             ON public.subscriptions(status);


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


-- HELPERS (Part 1)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;


CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


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


-- AUTO-CREATE PROFILE on signup
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


-- RLS — user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_profiles_select"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id OR public.get_my_role() = 'super_admin');

CREATE POLICY "user_profiles_insert"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id OR public.get_my_role() = 'super_admin');

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


-- RLS — user_preferences
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


-- RLS — user_trials
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


-- RLS — subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_select_own"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "subscriptions_select_admin"
  ON public.subscriptions FOR SELECT
  USING (public.get_my_role() = 'super_admin');

CREATE POLICY "subscriptions_service_role"
  ON public.subscriptions FOR ALL
  TO service_role USING (true);


-- RLS — webhook_events
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webhook_events_service_role"
  ON public.webhook_events FOR ALL
  TO service_role USING (true);


-- GRANTS (Part 1)
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_profiles TO authenticated;
GRANT SELECT ON public.user_profiles TO anon;

GRANT SELECT, INSERT, UPDATE ON public.user_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_trials TO authenticated;
GRANT SELECT ON public.subscriptions TO authenticated;

GRANT USAGE, SELECT ON SEQUENCE public.webhook_events_id_seq TO service_role;


-- ============================================================
--  PART 2 — WORKSPACES (Phase H)
-- ============================================================


CREATE TABLE public.workspaces (
  id                        UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username                  VARCHAR(30)  UNIQUE NOT NULL,
  display_name              VARCHAR(100),
  username_last_changed_at  TIMESTAMPTZ  DEFAULT NOW(),
  created_at                TIMESTAMPTZ  DEFAULT NOW(),
  updated_at                TIMESTAMPTZ  DEFAULT NOW(),

  CONSTRAINT username_format CHECK (username ~* '^[a-z0-9-]{3,30}$'),
  CONSTRAINT username_not_reserved CHECK (username NOT IN (
    'admin', 'api', 'docs', 'app', 'www', 'help',
    'support', 'blog', 'pricing', 'login', 'register',
    'dashboard', 'settings', 'profile', 'pay', 'overview',
    'notebooks', 'about', 'contact', 'terms', 'privacy',
    'root', 'system', 'mail', 'webmaster', 'noreply'
  )),
  CONSTRAINT user_id_unique UNIQUE (user_id)
);

CREATE INDEX idx_workspaces_username ON public.workspaces(username);
CREATE INDEX idx_workspaces_user_id  ON public.workspaces(user_id);


-- SHARED HELPER: update_updated_at_column (Phase H + I)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workspaces_updated_at
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


-- RLS — workspaces
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspaces_select_public"
  ON public.workspaces FOR SELECT
  USING (true);

CREATE POLICY "workspaces_update_own"
  ON public.workspaces FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "workspaces_insert_own"
  ON public.workspaces FOR INSERT
  WITH CHECK (auth.uid() = user_id);


-- AUTO-CREATE WORKSPACE on signup (Phase H)
-- Note: Trigger fires alphabetically.
--   'on_auth_user_created_workspace' (this)         -> 'o' first
--   'trg_on_auth_user_created'        (Part 1)      -> 't' later
-- Workspace trigger doesn't depend on user_profiles, so order is safe.

CREATE OR REPLACE FUNCTION public.handle_new_user_workspace()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INT := 0;
BEGIN
  -- 1. Source: full_name from metadata, fallback to email prefix
  base_username := LOWER(COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    SPLIT_PART(NEW.email, '@', 1)
  ));

  -- 2. Sanitize
  base_username := REGEXP_REPLACE(base_username, '[^a-z0-9]', '-', 'g');
  base_username := REGEXP_REPLACE(base_username, '-+', '-', 'g');
  base_username := TRIM(BOTH '-' FROM base_username);

  -- 3. Truncate to leave room for suffix
  base_username := SUBSTRING(base_username FROM 1 FOR 25);

  -- 4. Fallback if too short
  IF LENGTH(base_username) < 3 THEN
    base_username := 'user-' || SUBSTRING(NEW.id::TEXT FROM 1 FOR 6);
  END IF;

  -- 5. Ensure uniqueness + not reserved
  final_username := base_username;
  WHILE EXISTS (
    SELECT 1 FROM public.workspaces WHERE username = final_username
  ) OR final_username IN (
    'admin', 'api', 'docs', 'app', 'www', 'help', 'support',
    'blog', 'pricing', 'login', 'register', 'dashboard', 'settings',
    'profile', 'pay', 'overview', 'notebooks', 'about', 'contact',
    'terms', 'privacy', 'root', 'system', 'mail', 'webmaster', 'noreply'
  ) LOOP
    counter := counter + 1;
    final_username := base_username || '-' || counter;
  END LOOP;

  INSERT INTO public.workspaces (user_id, username, display_name)
  VALUES (
    NEW.id,
    final_username,
    NEW.raw_user_meta_data->>'full_name'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created_workspace
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_workspace();


-- RPC: is_username_available
CREATE OR REPLACE FUNCTION public.is_username_available(
  candidate TEXT,
  exclude_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  normalized TEXT;
BEGIN
  normalized := LOWER(TRIM(candidate));

  IF normalized !~ '^[a-z0-9-]{3,30}$' THEN
    RETURN FALSE;
  END IF;

  IF normalized IN (
    'admin', 'api', 'docs', 'app', 'www', 'help', 'support',
    'blog', 'pricing', 'login', 'register', 'dashboard', 'settings',
    'profile', 'pay', 'overview', 'notebooks', 'about', 'contact',
    'terms', 'privacy', 'root', 'system', 'mail', 'webmaster', 'noreply'
  ) THEN
    RETURN FALSE;
  END IF;

  RETURN NOT EXISTS (
    SELECT 1 FROM public.workspaces
    WHERE username = normalized
      AND (exclude_user_id IS NULL OR user_id != exclude_user_id)
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.is_username_available(TEXT, UUID) TO authenticated, anon;


-- GRANTS (Part 2)
GRANT SELECT, INSERT, UPDATE ON public.workspaces TO authenticated;
GRANT SELECT ON public.workspaces TO anon;


-- ============================================================
--  PART 3 — NOTEBOOK PUBLISHES (Phase I)
-- ============================================================


CREATE TABLE public.notebook_publishes (
  id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id         UUID         NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,

  -- Identity (used to lookup from both sides)
  notebook_local_id    TEXT         NOT NULL,
  notebook_slug        VARCHAR(100) NOT NULL,

  -- Display metadata
  notebook_name        VARCHAR(100) NOT NULL,
  notebook_icon        TEXT,
  notebook_description TEXT,

  -- Snapshot data (denormalized JSON)
  sections             JSONB        NOT NULL DEFAULT '[]'::jsonb,
  pages                JSONB        NOT NULL DEFAULT '[]'::jsonb,
  tags                 JSONB        NOT NULL DEFAULT '[]'::jsonb,

  -- Timestamps
  published_at         TIMESTAMPTZ  DEFAULT NOW(),
  updated_at           TIMESTAMPTZ  DEFAULT NOW(),

  CONSTRAINT slug_format CHECK (notebook_slug ~* '^[a-z0-9-]{1,100}$'),
  CONSTRAINT slug_unique_per_workspace UNIQUE (workspace_id, notebook_slug),
  CONSTRAINT local_id_unique_per_workspace UNIQUE (workspace_id, notebook_local_id)
);

CREATE INDEX idx_publishes_workspace ON public.notebook_publishes(workspace_id);
CREATE INDEX idx_publishes_lookup    ON public.notebook_publishes(workspace_id, notebook_slug);
CREATE INDEX idx_publishes_local_id  ON public.notebook_publishes(workspace_id, notebook_local_id);


-- RLS — notebook_publishes
ALTER TABLE public.notebook_publishes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "publishes_select_public"
  ON public.notebook_publishes FOR SELECT
  USING (true);

CREATE POLICY "publishes_insert_own"
  ON public.notebook_publishes FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM public.workspaces WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "publishes_update_own"
  ON public.notebook_publishes FOR UPDATE
  USING (
    workspace_id IN (
      SELECT id FROM public.workspaces WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM public.workspaces WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "publishes_delete_own"
  ON public.notebook_publishes FOR DELETE
  USING (
    workspace_id IN (
      SELECT id FROM public.workspaces WHERE user_id = auth.uid()
    )
  );


-- updated_at trigger (reuses Phase H helper)
CREATE TRIGGER publishes_updated_at
  BEFORE UPDATE ON public.notebook_publishes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


-- VIEW: published_notebooks_with_workspace (for Phase J SSR)
CREATE OR REPLACE VIEW public.published_notebooks_with_workspace AS
SELECT
  p.*,
  w.username,
  w.display_name AS workspace_display_name
FROM public.notebook_publishes p
JOIN public.workspaces w ON p.workspace_id = w.id;


-- RPC: count_workspace_publishes (for free tier check)
CREATE OR REPLACE FUNCTION public.count_workspace_publishes(
  ws_id UUID
)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.notebook_publishes
    WHERE workspace_id = ws_id
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.count_workspace_publishes(UUID) TO authenticated;


-- GRANTS (Part 3)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notebook_publishes TO authenticated;
GRANT SELECT ON public.notebook_publishes TO anon;
GRANT SELECT ON public.published_notebooks_with_workspace TO authenticated, anon;


-- ============================================================
-- ✅ ALL DONE — VibesDoc database ready
-- ============================================================
-- Verify:
--   SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;
--   -> Should return 7 tables
--
--   SELECT trigger_name FROM information_schema.triggers
--   WHERE event_object_schema='auth' AND event_object_table='users';
--   -> Should return 2 triggers: on_auth_user_created_workspace, trg_on_auth_user_created
--
--   SELECT viewname FROM pg_views WHERE schemaname='public';
--   -> Should return: published_notebooks_with_workspace
--
-- Next: run scripts/seed.js to create initial users
-- ============================================================