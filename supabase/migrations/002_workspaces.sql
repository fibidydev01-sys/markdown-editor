-- ============================================================
-- VibesDoc — Migration 002: Workspaces (Phase H)
-- ============================================================
-- Run order: 001 → 002 → 003
-- Prerequisites: Migration 001 must be applied
--
-- Creates:
--   - workspaces table (1:1 with auth.users for MVP)
--   - Auto-create workspace trigger on user signup (Phase H)
--   - Username availability RPC
--   - update_updated_at_column() helper (shared with Phase I)
--   - RLS policies (public read, owner-only write)
-- ============================================================


-- ============================================================
-- TABLE: workspaces
-- 1:1 with auth.users for MVP (1:many for future teams)
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
  CONSTRAINT user_id_unique UNIQUE (user_id)  -- 1:1 for MVP
);

CREATE INDEX idx_workspaces_username ON public.workspaces(username);
CREATE INDEX idx_workspaces_user_id  ON public.workspaces(user_id);


-- ============================================================
-- SHARED HELPER: update_updated_at_column
-- (Used by Phase H + Phase I — same function, different name from
-- handle_updated_at in 001 to avoid collision.)
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- updated_at trigger for workspaces
CREATE TRIGGER workspaces_updated_at
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================
-- RLS Policies
-- ============================================================

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous) can read workspaces — public /@username pages
CREATE POLICY "workspaces_select_public"
  ON public.workspaces FOR SELECT
  USING (true);

-- Only owner can update their workspace
CREATE POLICY "workspaces_update_own"
  ON public.workspaces FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Insertion goes through trigger (auto) or via user themselves
CREATE POLICY "workspaces_insert_own"
  ON public.workspaces FOR INSERT
  WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- AUTO-CREATE WORKSPACE on signup
--
-- Strategy:
--   1. Generate base username from full_name (preferred) or email prefix
--   2. Sanitize: lowercase, replace non-alphanumeric with hyphen, collapse
--   3. Truncate to 25 chars (leaves room for "-NN" suffix)
--   4. Fallback to "user-XXXXXX" if sanitized result is too short
--   5. Loop with counter suffix if conflict OR reserved
--
-- IMPORTANT: This trigger fires AFTER trg_on_auth_user_created (from 001)
-- because Postgres fires triggers alphabetically:
--   - 'on_auth_user_created_workspace' (this trigger)
--   - 'trg_on_auth_user_created'       (from 001)
-- Alphabetically 'o' < 't', so workspace trigger fires FIRST.
-- This is OK because workspace trigger doesn't depend on user_profiles.
-- ============================================================

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

  -- 2. Sanitize: replace non-alphanumeric with hyphen, collapse consecutive,
  --    trim leading/trailing hyphens
  base_username := REGEXP_REPLACE(base_username, '[^a-z0-9]', '-', 'g');
  base_username := REGEXP_REPLACE(base_username, '-+', '-', 'g');
  base_username := TRIM(BOTH '-' FROM base_username);

  -- 3. Truncate to leave room for suffix
  base_username := SUBSTRING(base_username FROM 1 FOR 25);

  -- 4. Fallback if sanitization left us with something too short
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


-- Trigger fires AFTER user is created in auth.users
CREATE TRIGGER on_auth_user_created_workspace
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_workspace();


-- ============================================================
-- HELPER FUNCTION: check username availability
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_username_available(
  candidate TEXT,
  exclude_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  normalized TEXT;
BEGIN
  normalized := LOWER(TRIM(candidate));

  -- Format check
  IF normalized !~ '^[a-z0-9-]{3,30}$' THEN
    RETURN FALSE;
  END IF;

  -- Reserved check
  IF normalized IN (
    'admin', 'api', 'docs', 'app', 'www', 'help', 'support',
    'blog', 'pricing', 'login', 'register', 'dashboard', 'settings',
    'profile', 'pay', 'overview', 'notebooks', 'about', 'contact',
    'terms', 'privacy', 'root', 'system', 'mail', 'webmaster', 'noreply'
  ) THEN
    RETURN FALSE;
  END IF;

  -- Existing check (allow user to keep their own username)
  RETURN NOT EXISTS (
    SELECT 1 FROM public.workspaces
    WHERE username = normalized
      AND (exclude_user_id IS NULL OR user_id != exclude_user_id)
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;


-- Grant execute to authenticated + anon (public availability check)
GRANT EXECUTE ON FUNCTION public.is_username_available(TEXT, UUID) TO authenticated, anon;


-- ============================================================
-- GRANTS
-- ============================================================

GRANT SELECT, INSERT, UPDATE ON public.workspaces TO authenticated;
GRANT SELECT ON public.workspaces TO anon;


-- ============================================================
-- ✅ MIGRATION 002 DONE
-- ============================================================
-- Next: Run 003_notebook_publishes.sql
-- ============================================================