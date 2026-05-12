-- ============================================================
-- VibesDoc — Migration 003: Notebook Publishes (Phase I)
-- ============================================================
-- Run order: 001 → 002 → 003
-- Prerequisites: Migrations 001 + 002 must be applied
--
-- Creates:
--   - notebook_publishes table (1 row per published notebook)
--   - RLS policies (public read, owner-only write)
--   - updated_at trigger (reuses Phase H helper)
--   - published_notebooks_with_workspace view (for Phase J SSR)
--   - count_workspace_publishes RPC (for free tier check)
-- ============================================================


-- ============================================================
-- TABLE: notebook_publishes
--
-- Strategy:
--   - One row per published notebook (current version only, no history)
--   - Re-publishing REPLACES the snapshot in-place
--   - Snapshot is denormalized JSON (sections, pages, tags) — fast reads
--     for public docs route, no joins needed
--   - notebook_local_id maps back to IndexedDB notebook.id (for "is this
--     published?" lookup from the editor side)
-- ============================================================

CREATE TABLE public.notebook_publishes (
  id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id         UUID         NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,

  -- Identity (used to lookup from both sides)
  notebook_local_id    TEXT         NOT NULL,           -- IndexedDB notebook.id (client identifier)
  notebook_slug        VARCHAR(100) NOT NULL,           -- URL-safe slug (unique within workspace)

  -- Display metadata
  notebook_name        VARCHAR(100) NOT NULL,
  notebook_icon        TEXT,
  notebook_description TEXT,

  -- Snapshot data (denormalized JSON)
  sections             JSONB        NOT NULL DEFAULT '[]'::jsonb,  -- NotebookSection[]
  pages                JSONB        NOT NULL DEFAULT '[]'::jsonb,  -- NotebookPage[]
  tags                 JSONB        NOT NULL DEFAULT '[]'::jsonb,  -- NotebookTag[]

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


-- ============================================================
-- RLS Policies
-- ============================================================

ALTER TABLE public.notebook_publishes ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous) can read published notebooks — public docs
CREATE POLICY "publishes_select_public"
  ON public.notebook_publishes FOR SELECT
  USING (true);

-- Owner can INSERT into their own workspace
CREATE POLICY "publishes_insert_own"
  ON public.notebook_publishes FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM public.workspaces WHERE user_id = auth.uid()
    )
  );

-- Owner can UPDATE their own publishes
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

-- Owner can DELETE their own publishes (unpublish)
CREATE POLICY "publishes_delete_own"
  ON public.notebook_publishes FOR DELETE
  USING (
    workspace_id IN (
      SELECT id FROM public.workspaces WHERE user_id = auth.uid()
    )
  );


-- ============================================================
-- updated_at trigger (reuses Phase H helper)
-- ============================================================

CREATE TRIGGER publishes_updated_at
  BEFORE UPDATE ON public.notebook_publishes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================
-- VIEW: published_notebooks_with_workspace
-- Used by Phase J public docs renderer for single-query SSR lookup.
-- View inherits RLS from underlying tables (publishes public read,
-- workspaces public read) — so anon access works for /@username/slug pages.
-- ============================================================

CREATE OR REPLACE VIEW public.published_notebooks_with_workspace AS
SELECT
  p.*,
  w.username,
  w.display_name AS workspace_display_name
FROM public.notebook_publishes p
JOIN public.workspaces w ON p.workspace_id = w.id;


-- ============================================================
-- RPC: count_workspace_publishes
-- Used by free tier enforcement check in /api/notebooks/publish
-- ============================================================

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


-- ============================================================
-- GRANTS
-- ============================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notebook_publishes TO authenticated;
GRANT SELECT ON public.notebook_publishes TO anon;
GRANT SELECT ON public.published_notebooks_with_workspace TO authenticated, anon;


-- ============================================================
-- ✅ MIGRATION 003 DONE — ALL MIGRATIONS COMPLETE
-- ============================================================
-- Verify with: SELECT tablename FROM pg_tables WHERE schemaname='public';
-- Expected tables:
--   user_profiles, user_preferences, user_trials, subscriptions,
--   webhook_events, workspaces, notebook_publishes
-- ============================================================