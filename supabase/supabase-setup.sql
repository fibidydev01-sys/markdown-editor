-- ============================================================
-- VIBESDOC V2 — FULL SUPABASE SCHEMA (COMPLETE NUCLEAR)
-- ============================================================
-- Stack: Next.js 16 + Supabase SSR + Lemon Squeezy + IndexedDB
-- Run ONCE in Supabase SQL Editor
-- Nuclear drop → recreate everything clean
-- ============================================================
-- Tables:
--   1. user_profiles      — user accounts (auto-created on signup)
--   2. user_preferences   — onboarding flags
--   3. user_trials        — 48hr trial tracking
--   4. subscriptions      — Lemon Squeezy subscription data
--   5. webhook_events     — LS webhook event log
--   6. workspaces         — public @username container (1:1 with user)
--   7. notebook_publishes — published notebook snapshots
-- Views:
--   1. published_notebooks_with_workspace — joined view for public docs
-- Functions:
--   - get_my_role()                        — admin check
--   - handle_updated_at()                  — auto-update trigger
--   - handle_new_user()                    — create profile + workspace on signup
--   - is_username_available()              — workspace username check
--   - generate_unique_username()           — fallback for OAuth users
-- ============================================================


-- ============================================================
-- 0. NUCLEAR DROP — Hapus semua, mulai bersih
-- ============================================================

-- Triggers
DROP TRIGGER IF EXISTS trg_on_auth_user_created           ON auth.users;
DROP TRIGGER IF EXISTS trg_user_profiles_updated_at        ON public.user_profiles;
DROP TRIGGER IF EXISTS trg_subscriptions_updated_at        ON public.subscriptions;
DROP TRIGGER IF EXISTS trg_user_preferences_updated_at     ON public.user_preferences;
DROP TRIGGER IF EXISTS trg_user_trials_updated_at          ON public.user_trials;
DROP TRIGGER IF EXISTS trg_workspaces_updated_at           ON public.workspaces;
DROP TRIGGER IF EXISTS trg_notebook_publishes_updated_at   ON public.notebook_publishes;

-- Views (must drop before tables they depend on)
DROP VIEW IF EXISTS public.published_notebooks_with_workspace CASCADE;

-- Functions
DROP FUNCTION IF EXISTS public.handle_new_user()              CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at()            CASCADE;
DROP FUNCTION IF EXISTS public.get_my_role()                  CASCADE;
DROP FUNCTION IF EXISTS public.is_username_available(TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.generate_unique_username(TEXT)  CASCADE;

-- Tables (order matters — foreign keys)
DROP TABLE IF EXISTS public.notebook_publishes  CASCADE;
DROP TABLE IF EXISTS public.workspaces          CASCADE;
DROP TABLE IF EXISTS public.webhook_events      CASCADE;
DROP TABLE IF EXISTS public.subscriptions       CASCADE;
DROP TABLE IF EXISTS public.user_trials         CASCADE;
DROP TABLE IF EXISTS public.user_preferences    CASCADE;
DROP TABLE IF EXISTS public.user_profiles       CASCADE;


-- ============================================================
-- 1. EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================
-- 2. TABLE: user_profiles
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
-- 3. TABLE: user_preferences
-- ============================================================

CREATE TABLE public.user_preferences (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID        NOT NULL UNIQUE
                          REFERENCES auth.users(id) ON DELETE CASCADE,
  has_completed_onboarding BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_preferences_user_id ON public.user_preferences(user_id);


-- ============================================================
-- 4. TABLE: user_trials
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
-- 5. TABLE: subscriptions (Lemon Squeezy)
-- ============================================================

CREATE TABLE public.subscriptions (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID        REFERENCES public.user_profiles(id) ON DELETE CASCADE,

  ls_subscription_id    TEXT        UNIQUE,
  ls_customer_id        TEXT,
  ls_order_id           TEXT,
  ls_product_id         TEXT,
  ls_variant_id         TEXT,
  ls_variant_name       TEXT,

  status                TEXT        NOT NULL DEFAULT 'active'
                                    CHECK (status IN (
                                      'active', 'trialing', 'cancelled', 'expired',
                                      'paused', 'past_due', 'unpaid'
                                    )),

  renews_at             TIMESTAMPTZ,
  ends_at               TIMESTAMPTZ,
  trial_ends_at         TIMESTAMPTZ,

  price                 TEXT,
  card_brand            TEXT,
  card_last_four        TEXT,
  is_paused             BOOLEAN     DEFAULT FALSE,

  deleted_at            TIMESTAMPTZ,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id            ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_ls_subscription_id ON public.subscriptions(ls_subscription_id);
CREATE INDEX idx_subscriptions_status             ON public.subscriptions(status);


-- ============================================================
-- 6. TABLE: webhook_events (Lemon Squeezy)
-- ============================================================

CREATE TABLE public.webhook_events (
  id                BIGSERIAL   PRIMARY KEY,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_name        TEXT        NOT NULL,
  processed         BOOLEAN     DEFAULT FALSE,
  body              JSONB       NOT NULL,
  processing_error  TEXT
);

CREATE INDEX idx_webhook_events_processed   ON public.webhook_events(processed);
CREATE INDEX idx_webhook_events_event_name  ON public.webhook_events(event_name);
CREATE INDEX idx_webhook_events_created_at  ON public.webhook_events(created_at DESC);


-- ============================================================
-- 7. TABLE: workspaces (VibesDoc — public @username container)
-- ============================================================
-- 1:1 with auth.users for MVP. Future: team workspaces = 1:many.
-- Username is the public URL slug: /@username
-- ============================================================

CREATE TABLE public.workspaces (
  id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID        NOT NULL UNIQUE
                                       REFERENCES auth.users(id) ON DELETE CASCADE,

  username                 VARCHAR(30) NOT NULL UNIQUE
                                       CHECK (username ~* '^[a-z0-9-]{3,30}$'),
  display_name             VARCHAR(100),
  username_last_changed_at TIMESTAMPTZ DEFAULT NOW(),

  created_at               TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workspaces_username ON public.workspaces(username);
CREATE INDEX idx_workspaces_user_id  ON public.workspaces(user_id);


-- ============================================================
-- 8. TABLE: notebook_publishes (VibesDoc)
-- ============================================================
-- Snapshot of a published notebook from local IndexedDB.
-- One row per (workspace, notebook_local_id). Re-publish overwrites.
--
-- UNIQUE(workspace_id, notebook_local_id) — prevents duplicate snapshots
-- UNIQUE(workspace_id, notebook_slug)     — prevents slug conflicts
--                                            (HARDENING — was missing before!)
-- ============================================================

CREATE TABLE public.notebook_publishes (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id         UUID        NOT NULL
                                   REFERENCES public.workspaces(id) ON DELETE CASCADE,
  notebook_local_id    TEXT        NOT NULL,

  notebook_slug        VARCHAR(100) NOT NULL
                                    CHECK (notebook_slug ~* '^[a-z0-9-]{1,100}$'),
  notebook_name        VARCHAR(200) NOT NULL,
  notebook_icon        TEXT,
  notebook_description TEXT,

  sections             JSONB       NOT NULL DEFAULT '[]'::jsonb,
  pages                JSONB       NOT NULL DEFAULT '[]'::jsonb,
  tags                 JSONB       NOT NULL DEFAULT '[]'::jsonb,

  published_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW(),

  -- One snapshot per (workspace, local notebook)
  CONSTRAINT notebook_publishes_workspace_local_unique
    UNIQUE (workspace_id, notebook_local_id),

  -- One slug per workspace (defense against race condition)
  CONSTRAINT notebook_publishes_workspace_slug_unique
    UNIQUE (workspace_id, notebook_slug)
);

CREATE INDEX idx_notebook_publishes_workspace_id    ON public.notebook_publishes(workspace_id);
CREATE INDEX idx_notebook_publishes_slug            ON public.notebook_publishes(notebook_slug);
CREATE INDEX idx_notebook_publishes_updated_at      ON public.notebook_publishes(updated_at DESC);


-- ============================================================
-- 9. VIEW: published_notebooks_with_workspace
-- ============================================================
-- Joined view used by public docs renderer (Phase J / SSR pages).
-- Combines notebook_publishes + workspace info to avoid 2 queries.
-- ============================================================

CREATE OR REPLACE VIEW public.published_notebooks_with_workspace AS
SELECT
  np.id,
  np.workspace_id,
  np.notebook_local_id,
  np.notebook_slug,
  np.notebook_name,
  np.notebook_icon,
  np.notebook_description,
  np.sections,
  np.pages,
  np.tags,
  np.published_at,
  np.updated_at,
  w.username,
  w.display_name AS workspace_display_name,
  w.user_id AS workspace_user_id
FROM public.notebook_publishes np
JOIN public.workspaces w ON w.id = np.workspace_id;


-- ============================================================
-- 10. HELPER FUNCTION: get_my_role (bypass RLS)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;


-- ============================================================
-- 11. HELPER FUNCTION: is_username_available
-- ============================================================
-- Checks format + reserved list + uniqueness in one server-side call.
-- Used by username editor for fast availability checking.
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_username_available(
  candidate TEXT,
  exclude_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  normalized TEXT;
  reserved_usernames TEXT[] := ARRAY[
    'admin', 'api', 'docs', 'app', 'www', 'help',
    'support', 'blog', 'pricing', 'login', 'register',
    'dashboard', 'settings', 'profile', 'pay', 'overview',
    'notebooks', 'about', 'contact', 'terms', 'privacy',
    'root', 'system', 'mail', 'webmaster', 'noreply',
    'logout', 'auth', 'public', 'private', 'static',
    'assets', 'images', 'css', 'js', 'fonts', 'media',
    'undefined', 'null', 'test', 'demo', 'example'
  ];
BEGIN
  normalized := LOWER(TRIM(candidate));

  -- Format check
  IF normalized !~ '^[a-z0-9-]{3,30}$' THEN
    RETURN FALSE;
  END IF;

  -- No leading/trailing hyphens
  IF normalized LIKE '-%' OR normalized LIKE '%-' THEN
    RETURN FALSE;
  END IF;

  -- No consecutive hyphens
  IF normalized LIKE '%--%' THEN
    RETURN FALSE;
  END IF;

  -- Reserved check
  IF normalized = ANY(reserved_usernames) THEN
    RETURN FALSE;
  END IF;

  -- Uniqueness check (excluding the caller's own workspace if specified)
  IF exclude_user_id IS NOT NULL THEN
    RETURN NOT EXISTS (
      SELECT 1 FROM public.workspaces
      WHERE username = normalized
        AND user_id != exclude_user_id
    );
  ELSE
    RETURN NOT EXISTS (
      SELECT 1 FROM public.workspaces
      WHERE username = normalized
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;


-- ============================================================
-- 12. HELPER FUNCTION: generate_unique_username
-- ============================================================
-- Generates a unique username from a seed (email or full_name).
-- Used by handle_new_user trigger to auto-create workspace.
-- ============================================================

CREATE OR REPLACE FUNCTION public.generate_unique_username(seed TEXT)
RETURNS TEXT AS $$
DECLARE
  base_username TEXT;
  candidate TEXT;
  counter INT := 0;
BEGIN
  -- Clean seed: lowercase, replace non-alphanumeric with hyphen
  base_username := LOWER(seed);
  base_username := REGEXP_REPLACE(base_username, '@.*$', '');        -- strip email domain
  base_username := REGEXP_REPLACE(base_username, '[^a-z0-9]+', '-', 'g');
  base_username := REGEXP_REPLACE(base_username, '^-+|-+$', '', 'g'); -- trim hyphens
  base_username := REGEXP_REPLACE(base_username, '-+', '-', 'g');     -- collapse

  -- Ensure min length
  IF LENGTH(base_username) < 3 THEN
    base_username := 'user-' || SUBSTRING(MD5(seed) FROM 1 FOR 6);
  END IF;

  -- Truncate to fit
  IF LENGTH(base_username) > 25 THEN
    base_username := SUBSTRING(base_username FROM 1 FOR 25);
    base_username := REGEXP_REPLACE(base_username, '-+$', '', 'g');
  END IF;

  candidate := base_username;

  -- Loop until we find a unique one (max 100 attempts)
  WHILE NOT public.is_username_available(candidate) AND counter < 100 LOOP
    counter := counter + 1;
    candidate := base_username || '-' || counter::TEXT;
  END LOOP;

  -- Last resort fallback
  IF counter >= 100 THEN
    candidate := 'user-' || SUBSTRING(MD5(seed || NOW()::TEXT) FROM 1 FOR 8);
  END IF;

  RETURN candidate;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- ============================================================
-- 13. FUNCTION: auto updated_at trigger
-- ============================================================

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

CREATE TRIGGER trg_workspaces_updated_at
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_notebook_publishes_updated_at
  BEFORE UPDATE ON public.notebook_publishes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ============================================================
-- 14. FUNCTION & TRIGGER: auto-create profile + workspace on signup
-- ============================================================
-- On new auth.users row:
--   1. Create user_profile with role='user'
--   2. Create workspace with auto-generated unique username
--
-- Username generation:
--   - From email local part (e.g. "john.doe@gmail.com" → "john-doe")
--   - Fallback to "user-<hash>" if collision
--   - User can change later via settings page
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  generated_username TEXT;
  full_name_value TEXT;
BEGIN
  -- Determine full_name (from OAuth metadata or fallback to email)
  full_name_value := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.email
  );

  -- 1. Create user_profile
  INSERT INTO public.user_profiles (id, full_name, role)
  VALUES (NEW.id, full_name_value, 'user')
  ON CONFLICT (id) DO NOTHING;

  -- 2. Generate unique username + create workspace
  generated_username := public.generate_unique_username(
    COALESCE(NEW.email, NEW.id::TEXT)
  );

  INSERT INTO public.workspaces (user_id, username, display_name)
  VALUES (
    NEW.id,
    generated_username,
    full_name_value
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- 15. RLS — user_profiles
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
-- 16. RLS — user_preferences
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
-- 17. RLS — user_trials
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
-- 18. RLS — subscriptions
-- ============================================================

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


-- ============================================================
-- 19. RLS — webhook_events
-- ============================================================

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webhook_events_service_role"
  ON public.webhook_events FOR ALL
  TO service_role USING (true);


-- ============================================================
-- 20. RLS — workspaces
-- ============================================================
-- Key: workspaces are PUBLIC READ (anyone can resolve username → workspace).
-- Only the owner can update their own workspace.
-- ============================================================

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can read workspaces — needed for public docs
CREATE POLICY "workspaces_select_public"
  ON public.workspaces FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only the owner can update their own workspace
CREATE POLICY "workspaces_update_own"
  ON public.workspaces FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role full access (for trigger + admin)
CREATE POLICY "workspaces_service_role"
  ON public.workspaces FOR ALL
  TO service_role USING (true);

-- Note: INSERT only via trigger (handle_new_user). No INSERT policy for users.


-- ============================================================
-- 21. RLS — notebook_publishes
-- ============================================================
-- Key:
--   - PUBLIC READ — anyone can fetch a published notebook
--   - Only workspace owner can INSERT/UPDATE/DELETE
-- ============================================================

ALTER TABLE public.notebook_publishes ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can read published notebooks
CREATE POLICY "notebook_publishes_select_public"
  ON public.notebook_publishes FOR SELECT
  TO anon, authenticated
  USING (true);

-- Owner can INSERT publishes for their own workspace
CREATE POLICY "notebook_publishes_insert_own"
  ON public.notebook_publishes FOR INSERT
  TO authenticated
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM public.workspaces WHERE user_id = auth.uid()
    )
  );

-- Owner can UPDATE publishes for their own workspace
CREATE POLICY "notebook_publishes_update_own"
  ON public.notebook_publishes FOR UPDATE
  TO authenticated
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

-- Owner can DELETE publishes for their own workspace
CREATE POLICY "notebook_publishes_delete_own"
  ON public.notebook_publishes FOR DELETE
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM public.workspaces WHERE user_id = auth.uid()
    )
  );

-- Service role full access
CREATE POLICY "notebook_publishes_service_role"
  ON public.notebook_publishes FOR ALL
  TO service_role USING (true);


-- ============================================================
-- 22. GRANTS
-- ============================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- user_profiles
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_profiles TO authenticated;
GRANT SELECT ON public.user_profiles TO anon;

-- user_preferences
GRANT SELECT, INSERT, UPDATE ON public.user_preferences TO authenticated;

-- user_trials
GRANT SELECT, INSERT, UPDATE ON public.user_trials TO authenticated;

-- subscriptions (read-only for users, write via service_role)
GRANT SELECT ON public.subscriptions TO authenticated;

-- workspaces (public read, owner update)
GRANT SELECT ON public.workspaces TO anon, authenticated;
GRANT UPDATE ON public.workspaces TO authenticated;

-- notebook_publishes (public read, owner CRUD)
GRANT SELECT ON public.notebook_publishes TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.notebook_publishes TO authenticated;

-- View (mirror of underlying tables)
GRANT SELECT ON public.published_notebooks_with_workspace TO anon, authenticated;

-- webhook_events — service role only (no GRANT for anon/authenticated)

-- Sequence for webhook_events
GRANT USAGE, SELECT ON SEQUENCE public.webhook_events_id_seq TO service_role;

-- Functions
GRANT EXECUTE ON FUNCTION public.is_username_available(TEXT, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;


-- ============================================================
-- 23. BACKFILL WORKSPACES FOR EXISTING USERS (Safety net)
-- ============================================================
-- If there are existing auth.users WITHOUT a workspace row
-- (pre-trigger users), create one for them.
-- Safe to run multiple times (ON CONFLICT DO NOTHING).
-- ============================================================

INSERT INTO public.workspaces (user_id, username, display_name)
SELECT
  au.id,
  public.generate_unique_username(COALESCE(au.email, au.id::TEXT)),
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    au.email
  )
FROM auth.users au
LEFT JOIN public.workspaces w ON w.user_id = au.id
WHERE w.id IS NULL
ON CONFLICT (user_id) DO NOTHING;


-- ============================================================
-- 24. BACKFILL USER_PROFILES FOR EXISTING USERS (Safety net)
-- ============================================================

INSERT INTO public.user_profiles (id, full_name, role)
SELECT
  au.id,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    au.email
  ),
  'user'
FROM auth.users au
LEFT JOIN public.user_profiles up ON up.id = au.id
WHERE up.id IS NULL
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- ✅ SCHEMA READY — VIBESDOC V2 COMPLETE
-- ============================================================
-- Tables created (7):
--   1. user_profiles      — user accounts
--   2. user_preferences   — onboarding flags
--   3. user_trials        — 48hr trial tracking
--   4. subscriptions      — Lemon Squeezy data
--   5. webhook_events     — LS webhook log
--   6. workspaces         — @username container ⭐ NEW
--   7. notebook_publishes — published snapshots ⭐ NEW
--
-- Views created (1):
--   1. published_notebooks_with_workspace ⭐ NEW
--
-- Functions created (5):
--   - get_my_role
--   - handle_updated_at
--   - handle_new_user (now creates workspace too)
--   - is_username_available ⭐ NEW
--   - generate_unique_username ⭐ NEW
--
-- Key hardening (vs old schema):
--   ✅ UNIQUE(workspace_id, notebook_slug) — prevents duplicate slug bug
--   ✅ UNIQUE(workspace_id, notebook_local_id) — proper upsert
--   ✅ ON DELETE CASCADE — workspace delete → publishes delete
--   ✅ ON DELETE CASCADE — auth.users delete → everything cascades
--   ✅ Public READ on workspaces + notebook_publishes (RLS-enabled)
--   ✅ Owner-only WRITE policies
--   ✅ Auto-create workspace on signup (via trigger)
--   ✅ Backfill for existing users (idempotent)
-- ============================================================