# VibesDoc — Final MVP Roadmap (Phase H, I, J)

**Public Docs Platform — Lean MVP**

> Status: 📋 **APPROVED SCOPE — Ready for Implementation**
> Builds on: Phase A–F (Complete) + Phase G (Polish, optional parallel)
> Total: **~3 weeks, ~40 files, 3 phases**

---

## Table of Contents

1. [North Star Vision](#1-north-star-vision)
2. [Locked Decisions](#2-locked-decisions)
3. [What's IN vs OUT of MVP](#3-whats-in-vs-out-of-mvp)
4. [Phase Overview](#4-phase-overview)
5. [Phase H — Auth Foundation & Workspaces](#5-phase-h--auth-foundation--workspaces)
6. [Phase I — Publish Flow](#6-phase-i--publish-flow)
7. [Phase J — Public Docs Renderer (3-Column)](#7-phase-j--public-docs-renderer-3-column)
8. [Complete Database Schema](#8-complete-database-schema)
9. [Final File Structure](#9-final-file-structure)
10. [Routing Map](#10-routing-map)
11. [Dependencies](#11-dependencies)
12. [Free vs Paid Tier](#12-free-vs-paid-tier)
13. [Merge Strategy Per Phase](#13-merge-strategy-per-phase)
14. [Risk Register](#14-risk-register)
15. [Implementation Timeline](#15-implementation-timeline)

---

## 1. North Star Vision

### 🎯 The Mantra

> **"User owns their docs. Platform is invisible."**

### 🪞 The Mirror Test

When a visitor lands on a published docs page, they should feel:
- ✅ "This is **andre's** documentation site"
- ❌ "This is a docs site hosted on VibesDoc"

### 📐 Visual Reference

Output should look and feel like:
- **supabase.com/docs** — 3-column layout, auth-aware header
- **fumadocs.dev** — TOC right sidebar with scroll-spy, search palette
- **nestjs.com/docs** — Section-folder navigation

### 🧬 Anti-Goals

NOT building:
- ❌ Custom domain support (cut from MVP — Phase M future)
- ❌ Analytics / page views (cut)
- ❌ Workspace branding (logo, custom colors, etc — cut)
- ❌ Custom header nav configuration (cut — use default static header)
- ❌ Multi-version snapshots / rollback (cut — single current version only)
- ❌ Image upload to Supabase Storage (cut — markdown image refs as-is)
- ❌ Team / multi-user workspaces (cut — single-user only)
- ❌ Real-time collab editing (cut)

---

## 2. Locked Decisions

> ⚠️ All decisions below are **FINAL** for MVP. Changes require explicit roadmap update.

### **D1 — URL Structure: `/@username/notebook-slug`**

```
vibesdoc.com/@andre                          → workspace landing (list of published notebooks)
vibesdoc.com/@andre/saas-boilerplate         → notebook home (first page)
vibesdoc.com/@andre/saas-boilerplate/intro   → specific page
```

**Username rules:**
- 3-30 chars, lowercase, alphanumeric + hyphens
- Auto-generated on signup from email (e.g., `andre@gmail.com` → `andre`)
- Auto-suffix on conflict (`andre-1`, `andre-2`)
- User can edit username **once per 30 days**
- Reserved list: `admin`, `api`, `docs`, `app`, `www`, `help`, `support`, `blog`, `pricing`, `login`, `register`, `dashboard`, `settings`, `profile`, `pay`, `overview`, `notebooks`, `about`, `contact`, `terms`, `privacy`

### **D2 — Storage Strategy: Manual Publish (Snapshot)**

```
WRITE MODE (private editing):
  Browser IndexedDB ← source of truth, offline-first

PUBLISH ACTION:
  User clicks "Publish" → snapshot uploaded to Supabase
  Replaces previous snapshot (NO versioning in MVP)

READ MODE (public docs):
  /@username/notebook → reads from Supabase (server-rendered for SEO)
```

**Why:**
- Clearest mental model: drafts vs published (like Vercel deployments)
- Offline-first preserved
- No background sync complexity
- Reinforces "user owns" — they decide when content goes public

### **D3 — Auth Detection on Public Docs: Anonymous-Default**

```
Visitor type             | Header shows
-------------------------|------------------------------------------
Anonymous (no session)   | Logo + search ONLY (no auth button)
Logged in (any user)     | Logo + search + "Dashboard" button
Owner of the docs        | Logo + search + "Dashboard" + "Edit" button
```

Login lives at `/login` on landing page — NOT inside docs.

### **D4 — Header Nav: Static Default (No DB Config)**

MVP uses a **static default header**:
- Logo on left (links to `/@username` workspace landing)
- Search trigger (⌘K) in middle
- Auth-aware button on right (per D3)

NO custom nav items configurable. (That was Phase K — cut from MVP.)

### **D5 — Right TOC: Yes, with scroll-spy**

Auto-generated from `## H2` and `### H3` in markdown.
- Sticky on scroll
- Active section highlighted via IntersectionObserver
- Click → smooth scroll
- Hidden on mobile

### **D6 — Search: Client-Side `fuse.js`**

- Pre-built index loaded once per notebook (lazy)
- ⌘K / Ctrl+K opens search palette (Supabase-style modal)
- Searches across all pages of currently-viewed notebook
- NO server-side search, NO Algolia

### **D7 — Markdown Stack**

```typescript
react-markdown          // base renderer
remark-gfm              // tables, task lists, strikethrough
remark-directive        // ::: syntax for callouts
rehype-slug             // adds id to headings
rehype-autolink-headings // # link on hover
rehype-pretty-code      // syntax highlighting via Shiki
```

**Supported features:**
- ✅ GFM (tables, task lists, strikethrough, autolinks)
- ✅ Syntax highlighting (Shiki, GitHub Dark theme)
- ✅ Callouts: `:::tip` `:::warning` `:::info` `:::danger`
- ✅ Auto-link headings (# icon on hover)
- ✅ Copy button on every code block
- ❌ NOT MDX (no JSX in markdown — security + complexity)
- ❌ NOT custom React components in content

### **D8 — Payment: Lemon Squeezy (Existing)**

Inherits boilerplate's LS integration. No Stripe migration.

### **D9 — Free Tier Limit: 1 Published Notebook**

```
Free user:       Can publish 1 notebook (forever)
Paid user:       Unlimited published notebooks
Trial user:      Counts as paid during 48hr trial
```

**Enforcement:** Server-side check on `/api/notebooks/publish` endpoint.

### **D10 — Images: As-is in Markdown**

User's markdown can reference images via:
- ✅ External URLs (`![alt](https://imgur.com/...)`)
- ✅ Data URIs (base64 inline)
- ❌ NO upload to Supabase Storage (cut)
- ❌ NO image extraction from imported ZIP (existing limitation persists)

Future: Phase N could add image upload if needed.

---

## 3. What's IN vs OUT of MVP

### ✅ IN (Build These)

| Feature | Phase |
|---------|-------|
| Workspace auto-created on signup | H |
| Username CRUD with reservation | H |
| Workspace settings page | H |
| Publish/Unpublish notebook | I |
| Snapshot to Supabase on publish | I |
| Publish button + modal | I |
| Status badge on notebook card | I |
| `/@username/notebook` public route | J |
| 3-column docs layout | J |
| Left sidebar with section tree | J |
| Right TOC with scroll-spy | J |
| Markdown rendering (full D7 stack) | J |
| Code syntax highlighting | J |
| Callouts (tip/warning/info/danger) | J |
| Copy code button | J |
| Breadcrumbs | J |
| Prev/Next page navigation | J |
| Client-side search (⌘K) | J |
| Auth-aware header | J |
| Mobile responsive | J |
| SSR for SEO | J |
| 404 pages (user/notebook/page not found) | J |

### ❌ OUT (Cut from MVP)

| Feature | Reason |
|---------|--------|
| Custom domain (`docs.you.com`) | Complexity, paid-only feature later |
| Analytics / page views | Lo bilang no analytics |
| Multi-version snapshots / rollback | YAGNI for MVP |
| Custom header navigation (per workspace) | Use static default |
| Workspace branding (logo, colors, favicon) | Default branding only |
| Team / multi-user workspaces | Single-user only |
| Real-time collab editing | Out of scope |
| Image upload to cloud storage | Markdown as-is |
| Server-side search (Algolia/Meilisearch) | Client fuse.js sufficient |
| Rate limiting on publish | YAGNI, monitor first |
| GDPR delete tooling | Use existing Supabase tooling |
| Powered-by-VibesDoc footer toggle | Always show in MVP |

---

## 4. Phase Overview

| Phase | Goal | Effort | New Files | Migrations |
|-------|------|--------|-----------|------------|
| **H** | Auth + workspaces + username | 2-3 days | ~10 | 1 |
| **I** | Publish/unpublish flow | 3-4 days | ~10 | 1 |
| **J** | Public docs 3-column renderer | 7-10 days | ~22 | 0 |
| **Total** | **MVP** | **~3 weeks** | **~42** | **2** |

---

## 5. Phase H — Auth Foundation & Workspaces

### 🎯 Goal

Every authenticated user gets a workspace with a unique username. Workspace = the container for their publishable notebooks.

### 📦 Database Migration

**File:** `supabase/migrations/001_workspaces.sql`

```sql
-- ============================================================
-- Workspaces table
-- 1:1 with auth.users for MVP (1:many for future teams)
-- ============================================================
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(30) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  username_last_changed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

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

CREATE INDEX idx_workspaces_username ON workspaces(username);

-- ============================================================
-- RLS Policies
-- ============================================================
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- Anyone can read workspaces (for public /@username pages)
CREATE POLICY "workspaces_select_public"
  ON workspaces FOR SELECT
  USING (true);

-- Only owner can update their workspace
CREATE POLICY "workspaces_update_own"
  ON workspaces FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Auto-create workspace on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user_workspace()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INT := 0;
BEGIN
  -- Generate base username from full_name or email prefix
  base_username := LOWER(REGEXP_REPLACE(
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      SPLIT_PART(NEW.email, '@', 1)
    ),
    '[^a-z0-9]', '-', 'g'
  ));
  base_username := REGEXP_REPLACE(base_username, '-+', '-', 'g');
  base_username := TRIM(BOTH '-' FROM base_username);
  base_username := SUBSTRING(base_username FROM 1 FOR 25);

  -- Fallback if username became empty
  IF LENGTH(base_username) < 3 THEN
    base_username := 'user-' || SUBSTRING(NEW.id::TEXT FROM 1 FOR 6);
  END IF;

  -- Ensure uniqueness
  final_username := base_username;
  WHILE EXISTS (
    SELECT 1 FROM workspaces WHERE username = final_username
  ) OR final_username IN (
    'admin', 'api', 'docs', 'app', 'www', 'help', 'support',
    'blog', 'pricing', 'login', 'register', 'dashboard', 'settings',
    'profile', 'pay', 'overview', 'notebooks', 'about', 'contact',
    'terms', 'privacy', 'root', 'system', 'mail', 'webmaster', 'noreply'
  ) LOOP
    counter := counter + 1;
    final_username := base_username || '-' || counter;
  END LOOP;

  INSERT INTO workspaces (user_id, username, display_name)
  VALUES (
    NEW.id,
    final_username,
    NEW.raw_user_meta_data->>'full_name'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_workspace
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_workspace();

-- ============================================================
-- Auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workspaces_updated_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

### 📁 Files to Create (10 files)

```
src/
├── types/
│   └── workspace.ts                          # Workspace types
│
├── lib/workspace/
│   ├── client.ts                             # Workspace CRUD via Supabase
│   ├── username-validator.ts                 # Reserved list + format + availability
│   └── index.ts                              # Barrel
│
├── hooks/
│   └── use-workspace.ts                      # Current user's workspace
│
├── stores/
│   └── workspace-store.ts                    # (Optional) workspace state in store
│
├── app/(dashboard)/settings/workspace/
│   └── page.tsx                              # Username + display name editor
│
└── components/features/workspace/
    ├── username-editor.tsx                   # Inline editable with availability check
    ├── workspace-info-card.tsx               # Display username + public URL preview
    └── index.ts                              # Barrel
```

### 📝 Files to Modify (3 files)

| File | Change |
|------|--------|
| `src/stores/auth-store.ts` | Fetch workspace alongside user profile |
| `src/types/index.ts` | Re-export workspace types |
| `src/constants/routes.ts` | Add `WORKSPACE_SETTINGS = "/settings/workspace"` |
| `src/components/layout/nav-config.ts` | (Optional) add workspace settings to nav |

### 📋 Type Contract

```typescript
// src/types/workspace.ts

export interface Workspace {
  id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  username_last_changed_at: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateWorkspaceInput {
  username?: string;
  display_name?: string | null;
}

export interface UsernameValidationResult {
  isValid: boolean;
  isAvailable: boolean;
  error?: string;
}
```

### ✅ Acceptance Criteria

- [ ] New signup → workspace row auto-created in `workspaces` table
- [ ] Username generated from email/name, suffixed on conflict
- [ ] Username uniqueness enforced at DB constraint level
- [ ] User can edit username via Settings → Workspace page
- [ ] 30-day cooldown enforced (UI shows "Next change available: ...")
- [ ] Reserved usernames rejected with clear error
- [ ] `useWorkspace()` hook returns `{ workspace, isLoading }` in every authenticated component
- [ ] Public URL preview shown in settings (`vibesdoc.com/@andre`)
- [ ] RLS verified: anyone reads, only owner writes

### 🧪 Smoke Tests

```sql
-- 1. After signup, workspace exists
SELECT username, display_name FROM workspaces
WHERE user_id = '<your-user-id>';

-- 2. Username uniqueness blocked
INSERT INTO workspaces (user_id, username) VALUES (gen_random_uuid(), 'andre');
-- ERROR: duplicate key violates unique constraint

-- 3. Reserved username blocked
UPDATE workspaces SET username = 'admin' WHERE id = '<your-workspace-id>';
-- ERROR: violates check constraint "username_not_reserved"
```

---

## 6. Phase I — Publish Flow

### 🎯 Goal

User clicks **"Publish"** on a notebook → snapshot uploaded to Supabase → notebook becomes publicly readable at `/@username/<notebook-slug>`.

### 📦 Database Migration

**File:** `supabase/migrations/002_notebook_publishes.sql`

```sql
-- ============================================================
-- Notebook Publishes
-- One row per published notebook (current version only)
-- Re-publishing REPLACES the snapshot in-place
-- ============================================================
CREATE TABLE notebook_publishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  notebook_local_id TEXT NOT NULL,           -- IndexedDB notebook.id (client identifier)
  notebook_slug VARCHAR(100) NOT NULL,       -- URL-safe slug (unique within workspace)
  notebook_name VARCHAR(100) NOT NULL,
  notebook_icon TEXT,
  notebook_description TEXT,

  -- Snapshot data
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,  -- NotebookSection[]
  pages JSONB NOT NULL DEFAULT '[]'::jsonb,     -- NotebookPage[]
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,      -- NotebookTag[]

  -- Metadata
  published_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT slug_format CHECK (notebook_slug ~* '^[a-z0-9-]{1,100}$'),
  CONSTRAINT slug_unique_per_workspace UNIQUE (workspace_id, notebook_slug),
  CONSTRAINT local_id_unique_per_workspace UNIQUE (workspace_id, notebook_local_id)
);

CREATE INDEX idx_publishes_workspace ON notebook_publishes(workspace_id);
CREATE INDEX idx_publishes_lookup ON notebook_publishes(workspace_id, notebook_slug);

-- ============================================================
-- RLS Policies
-- ============================================================
ALTER TABLE notebook_publishes ENABLE ROW LEVEL SECURITY;

-- Anyone can read published notebooks (public docs)
CREATE POLICY "publishes_select_public"
  ON notebook_publishes FOR SELECT
  USING (true);

-- Owner can do anything with their publishes
CREATE POLICY "publishes_owner_all"
  ON notebook_publishes FOR ALL
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- Auto-update updated_at
-- ============================================================
CREATE TRIGGER publishes_updated_at
  BEFORE UPDATE ON notebook_publishes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Helper view: get published notebook with workspace
-- ============================================================
CREATE OR REPLACE VIEW published_notebooks_with_workspace AS
SELECT
  p.*,
  w.username,
  w.display_name as workspace_display_name
FROM notebook_publishes p
JOIN workspaces w ON p.workspace_id = w.id;
```

### 📁 Files to Create (10 files)

```
src/
├── lib/notebook/publish/
│   ├── publisher.ts                          # Build snapshot + upload
│   ├── unpublisher.ts                        # Delete snapshot
│   ├── publish-status.ts                     # Check if notebook is published
│   ├── slug-utils.ts                         # Generate + validate slug
│   └── index.ts
│
├── hooks/notebook/
│   ├── use-publish-status.ts                 # { isPublished, publishedAt, publicUrl }
│   └── use-publish-action.ts                 # { publish, unpublish, isPublishing }
│
├── components/features/notebook/publish/
│   ├── publish-button.tsx                    # Main CTA in editor header
│   ├── publish-modal.tsx                     # Slug picker + preview + confirm
│   ├── publish-status-badge.tsx              # "Published" indicator
│   ├── unpublish-confirm-modal.tsx           # Destructive confirm
│   └── index.ts
│
└── app/api/notebooks/
    ├── publish/route.ts                      # POST: upload snapshot
    └── unpublish/route.ts                    # POST: delete snapshot
```

### 📝 Files to Modify (2 files)

| File | Change |
|------|--------|
| `src/app/(dashboard)/notebooks/[id]/page.tsx` | Add `<PublishButton />` to header area |
| `src/components/features/notebook/notebooks/notebook-card.tsx` | Show `<PublishStatusBadge />` if applicable |

### 📋 Type Contract

```typescript
// Inside src/types/workspace.ts or new src/types/publish.ts

export interface PublishedNotebook {
  id: string;
  workspace_id: string;
  notebook_local_id: string;
  notebook_slug: string;
  notebook_name: string;
  notebook_icon: string | null;
  notebook_description: string | null;
  sections: NotebookSection[];
  pages: NotebookPage[];
  tags: NotebookTag[];
  published_at: string;
  updated_at: string;
}

export interface PublishedNotebookWithWorkspace extends PublishedNotebook {
  username: string;
  workspace_display_name: string | null;
}

export interface PublishInput {
  notebookLocalId: string;
  notebookSlug: string;
  notebookName: string;
  notebookIcon: string | null;
  notebookDescription: string | null;
  sections: NotebookSection[];
  pages: NotebookPage[];
  tags: NotebookTag[];
}

export interface PublishResult {
  publishId: string;
  publicUrl: string;             // /@username/notebook-slug
  publishedAt: string;
}
```

### 🔐 Free Tier Enforcement

In `/api/notebooks/publish/route.ts`:

```typescript
// Server-side check before allowing publish
const { count } = await supabase
  .from('notebook_publishes')
  .select('id', { count: 'exact', head: true })
  .eq('workspace_id', workspace.id);

const isPaidOrTrial = await checkSubscriptionOrTrial(userId);

if (count >= 1 && !isPaidOrTrial) {
  return NextResponse.json(
    { error: 'Free tier allows 1 published notebook. Upgrade to publish more.' },
    { status: 402 } // 402 Payment Required
  );
}
```

### ✅ Acceptance Criteria

- [ ] User clicks "Publish" in notebook editor → modal opens
- [ ] Modal shows: slug input (auto-suggested from name), description preview, publish URL preview
- [ ] Slug uniqueness checked within workspace before submit
- [ ] On submit → loader → success toast → modal closes
- [ ] Published notebook gets badge in dashboard card
- [ ] Re-publishing overwrites previous snapshot (no version history)
- [ ] User can unpublish → confirm modal → notebook becomes inaccessible publicly
- [ ] Free tier blocked when trying to publish 2nd notebook (clear upgrade CTA)
- [ ] Slug edit allowed if URL is going to change (warn user about old URL)
- [ ] Public URL displayed prominently after successful publish

### 🧪 Smoke Tests

```sql
-- After publishing a notebook
SELECT notebook_slug, notebook_name, published_at, jsonb_array_length(pages) as page_count
FROM notebook_publishes
WHERE workspace_id = (SELECT id FROM workspaces WHERE username = 'andre');

-- Verify: free tier limit
-- (try publishing 2nd notebook as free user → should fail)
```

---

## 7. Phase J — Public Docs Renderer (3-Column)

### 🎯 Goal

Build the public-facing docs reader at `/@[username]/[notebook-slug]`. The showcase phase — what every visitor sees.

### 📐 Visual Layout

```
┌───────────────────────────────────────────────────────────────────────┐
│  [Logo VibesDoc]                       [⌘K Search]        [Dashboard] │ ← Header
├──────────────┬───────────────────────────────────────┬────────────────┤
│              │                                       │                │
│  📁 Intro    │   Introduction › What is this?       │ On this page   │
│    📄 What  │   ────────────────────────────────    │ ─ Introduction │
│  ▶ 📄 Why   │                                       │   ├ Goals      │
│              │   # What is this?                    │   └ Audience   │
│  📁 Setup    │                                       │ ─ Installation │
│    📄 Install│   Welcome to my documentation.       │ ─ Configuration│
│    📄 Config │                                       │                │
│              │   ## Goals                            │                │
│  📁 Guides   │                                       │                │
│    📄 Basic  │   - Lorem ipsum                       │                │
│    📄 Advanced  - Dolor sit amet                     │                │
│              │                                       │                │
│              │   ```typescript                       │                │
│              │   const x = "hello";          [Copy]  │                │
│              │   ```                                 │                │
│              │                                       │                │
│              │   :::tip                              │                │
│              │   Pro tip here                        │                │
│              │   :::                                 │                │
│              │                                       │                │
│              │   ────────────────────────────────    │                │
│              │   ← Previous: Why         Next: Install →             │
│              │                                       │                │
├── 260px ─────┼─── flex-1 (max 800px) ──────────────┼─── 240px ──────┤
   Left TOC          Markdown Content                  Right TOC
```

### 📁 Files to Create (22 files)

```
src/
├── app/
│   ├── @[username]/                          # Note: @ in folder name is literal in URL
│   │   ├── layout.tsx                        # Public docs shell + workspace context
│   │   ├── page.tsx                          # Workspace landing (list published notebooks)
│   │   ├── not-found.tsx                     # Username not found
│   │   └── [notebookSlug]/
│   │       ├── layout.tsx                    # 3-column shell
│   │       ├── page.tsx                      # Notebook home (first page redirect)
│   │       ├── not-found.tsx                 # Notebook not found
│   │       └── [...pageSlug]/
│   │           ├── page.tsx                  # Renders specific page
│   │           └── not-found.tsx             # Page not found
│   │
│   └── api/docs/
│       ├── workspace/[username]/route.ts     # GET workspace + published list
│       └── notebook/[username]/[slug]/route.ts # GET full published notebook
│
├── components/features/public-docs/
│   ├── layout/
│   │   ├── public-docs-header.tsx            # Auth-aware top header
│   │   ├── docs-shell.tsx                    # 3-column wrapper
│   │   ├── mobile-nav.tsx                    # Sheet for left sidebar on mobile
│   │   └── index.ts
│   │
│   ├── sidebar/
│   │   ├── docs-sidebar.tsx                  # Left TOC container
│   │   ├── sidebar-section.tsx               # Recursive section node
│   │   ├── sidebar-page-link.tsx             # Page row with active highlight
│   │   └── index.ts
│   │
│   ├── content/
│   │   ├── markdown-renderer.tsx             # react-markdown setup
│   │   ├── code-block.tsx                    # Shiki + copy button
│   │   ├── callout.tsx                       # :::tip ::: components
│   │   ├── breadcrumbs.tsx                   # Section / Page path
│   │   ├── page-nav-footer.tsx               # Prev / Next buttons
│   │   └── index.ts
│   │
│   ├── right-toc/
│   │   ├── on-page-toc.tsx                   # Right sidebar container
│   │   ├── toc-tree.tsx                      # Heading hierarchy display
│   │   ├── use-scroll-spy.ts                 # IntersectionObserver hook
│   │   └── index.ts
│   │
│   ├── search/
│   │   ├── search-trigger.tsx                # ⌘K button in header
│   │   ├── search-palette.tsx                # Modal with fuse.js
│   │   ├── search-result-item.tsx
│   │   ├── use-search-index.ts               # Build + query index
│   │   └── index.ts
│   │
│   └── auth-button/
│       ├── auth-aware-button.tsx             # Dashboard/Edit/None per D3
│       └── index.ts
│
├── lib/public-docs/
│   ├── fetch-workspace.ts                    # Server-side workspace fetch
│   ├── fetch-notebook.ts                     # Server-side notebook fetch
│   ├── extract-headings.ts                   # Parse MD → heading tree
│   ├── slugify-heading.ts                    # For anchor IDs
│   ├── build-page-tree.ts                    # Sidebar nav structure
│   ├── find-page-by-path.ts                  # URL path → page lookup
│   ├── find-prev-next-page.ts                # Navigation helper
│   ├── remark-callouts.ts                    # Custom remark plugin for ::: syntax
│   └── index.ts
│
└── styles/
    └── docs.css                              # Prose styles + callout colors
```

### 📋 Markdown Plugin Configuration

```typescript
// src/components/features/public-docs/content/markdown-renderer.tsx

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkDirective from 'remark-directive';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypePrettyCode from 'rehype-pretty-code';
import { remarkCallouts } from '@/lib/public-docs/remark-callouts';
import { CodeBlock } from './code-block';
import { Callout } from './callout';

<ReactMarkdown
  remarkPlugins={[remarkGfm, remarkDirective, remarkCallouts]}
  rehypePlugins={[
    rehypeSlug,
    [rehypeAutolinkHeadings, { behavior: 'wrap' }],
    [rehypePrettyCode, {
      theme: 'github-dark',
      keepBackground: false,
      defaultLang: 'plaintext'
    }]
  ]}
  components={{
    pre: ({ children, ...props }) => <CodeBlock {...props}>{children}</CodeBlock>,
    div: ({ node, className, children, ...props }) => {
      // Handle :::tip etc. directives
      if (className?.includes('callout-')) {
        const type = className.replace('callout-', '');
        return <Callout type={type as any}>{children}</Callout>;
      }
      return <div className={className} {...props}>{children}</div>;
    }
  }}
>
  {markdown}
</ReactMarkdown>
```

### 📋 Type Contracts

```typescript
// src/lib/public-docs/extract-headings.ts

export interface Heading {
  id: string;        // slugified for anchor
  text: string;
  depth: 2 | 3;      // H2 or H3 only
  children?: Heading[];
}

// src/lib/public-docs/build-page-tree.ts

export interface DocsTreeNode {
  type: 'section' | 'page';
  id: string;
  name: string;
  path: string;      // URL slug for navigation
  pageSlug?: string; // For pages only
  children?: DocsTreeNode[];
}
```

### 🔍 Search Implementation Sketch

```typescript
// src/components/features/public-docs/search/use-search-index.ts

import Fuse from 'fuse.js';

interface SearchablePage {
  id: string;
  title: string;
  content: string;     // first 500 chars only for performance
  path: string;        // URL to navigate to
  sectionName?: string;
}

export function useSearchIndex(notebook: PublishedNotebookWithWorkspace) {
  return useMemo(() => {
    const docs: SearchablePage[] = notebook.pages.map(page => ({
      id: page.id,
      title: page.title,
      content: page.content.slice(0, 500),
      path: buildPagePath(page, notebook),
      sectionName: notebook.sections.find(s => s.id === page.sectionId)?.name
    }));

    return new Fuse(docs, {
      keys: ['title', 'content', 'sectionName'],
      threshold: 0.3,
      includeMatches: true
    });
  }, [notebook]);
}
```

### ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `⌘K` / `Ctrl+K` | Open search palette |
| `Esc` | Close search palette |
| `↑` / `↓` | Navigate search results |
| `Enter` | Open selected result |

### ✅ Acceptance Criteria

#### Routing
- [ ] `/@andre` → workspace landing with list of published notebooks
- [ ] `/@andre/saas-boilerplate` → redirects to first page of notebook
- [ ] `/@andre/saas-boilerplate/intro` → renders page "intro"
- [ ] `/@andre/saas-boilerplate/setup/install` → renders page "install" inside "setup" section
- [ ] All public routes work without authentication
- [ ] 404 pages render gracefully for missing user/notebook/page

#### Layout
- [ ] 3-column desktop layout matches visual spec
- [ ] Left sidebar collapsible on mobile (hamburger → Sheet)
- [ ] Right TOC hidden on mobile
- [ ] Content area max-width 800px, centered

#### Sidebar (Left)
- [ ] Shows full section tree with active page highlighted
- [ ] Recursive collapse/expand for nested sections
- [ ] Click page → navigate

#### Markdown Content
- [ ] All MD elements render correctly (headings, lists, tables, links, images)
- [ ] Code blocks have syntax highlighting
- [ ] Code blocks have copy button (shows "Copied!" on click)
- [ ] Callouts `:::tip` `:::warning` `:::info` `:::danger` render with appropriate colors/icons
- [ ] Heading anchors clickable (# icon on hover)
- [ ] Internal links work (relative `/intro` resolves correctly)

#### Right TOC
- [ ] Shows all H2 and H3 from current page
- [ ] Indents H3 under H2
- [ ] Active heading highlighted as user scrolls (IntersectionObserver)
- [ ] Click → smooth scroll to heading

#### Navigation
- [ ] Breadcrumbs above page title (Section > Page)
- [ ] Prev/Next buttons at bottom show previous/next page in tree order
- [ ] First page has no "Prev", last has no "Next"

#### Search
- [ ] ⌘K opens palette
- [ ] Search across page titles + content
- [ ] Results show: page title + section + content snippet with match highlighted
- [ ] Click result → navigate, close palette

#### Auth-Aware Header
- [ ] Anonymous → only logo + search
- [ ] Logged-in non-owner → adds "Dashboard" button → goes to user's own dashboard
- [ ] Owner viewing own docs → adds "Dashboard" + "Edit this notebook" button

#### Performance / SEO
- [ ] All pages SSR'd (verify with `view-source:`)
- [ ] Proper `<title>` and `<meta description>`
- [ ] Lighthouse score > 90 (Performance, SEO, Accessibility)
- [ ] Open Graph tags for social sharing

### 🧪 Smoke Tests

```bash
# 1. Anonymous access
curl https://vibesdoc.com/@andre/saas-boilerplate
# Response should NOT contain "Dashboard" or "Sign in" button

# 2. SEO check
curl https://vibesdoc.com/@andre/saas-boilerplate/intro | grep -E '(<title>|<meta name="description")'

# 3. 404 handling
curl -I https://vibesdoc.com/@nonexistent
# HTTP/2 404
```

---

## 8. Complete Database Schema

Final state after Phase J:

```sql
-- ============================================================
-- Migration 001 (Phase H)
-- ============================================================
CREATE TABLE workspaces (...);
CREATE TRIGGER on_auth_user_created_workspace ...;
CREATE TRIGGER workspaces_updated_at ...;

-- ============================================================
-- Migration 002 (Phase I)
-- ============================================================
CREATE TABLE notebook_publishes (...);
CREATE TRIGGER publishes_updated_at ...;
CREATE VIEW published_notebooks_with_workspace AS ...;

-- (Phase J adds NO new tables — only reads from above)
```

**Total tables added:** 2
**Total triggers:** 3
**Total views:** 1

---

## 9. Final File Structure

Complete state after Phase H + I + J (delta only from Phase A-G):

```
src/
├── app/
│   ├── @[username]/                          # 🆕 Phase J
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── not-found.tsx
│   │   └── [notebookSlug]/
│   │       ├── layout.tsx
│   │       ├── page.tsx
│   │       ├── not-found.tsx
│   │       └── [...pageSlug]/
│   │           ├── page.tsx
│   │           └── not-found.tsx
│   │
│   ├── (dashboard)/
│   │   ├── notebooks/[id]/page.tsx           # 🔧 Phase I — add publish button
│   │   └── settings/workspace/page.tsx       # 🆕 Phase H
│   │
│   └── api/
│       ├── notebooks/
│       │   ├── publish/route.ts              # 🆕 Phase I
│       │   └── unpublish/route.ts            # 🆕 Phase I
│       └── docs/
│           ├── workspace/[username]/route.ts # 🆕 Phase J
│           └── notebook/[username]/[slug]/route.ts # 🆕 Phase J
│
├── components/features/
│   ├── workspace/                            # 🆕 Phase H
│   │   ├── username-editor.tsx
│   │   ├── workspace-info-card.tsx
│   │   └── index.ts
│   │
│   ├── notebook/
│   │   ├── publish/                          # 🆕 Phase I
│   │   │   ├── publish-button.tsx
│   │   │   ├── publish-modal.tsx
│   │   │   ├── publish-status-badge.tsx
│   │   │   ├── unpublish-confirm-modal.tsx
│   │   │   └── index.ts
│   │   └── notebooks/notebook-card.tsx       # 🔧 Phase I — status badge
│   │
│   └── public-docs/                          # 🆕 Phase J (entire tree)
│       ├── layout/
│       │   ├── public-docs-header.tsx
│       │   ├── docs-shell.tsx
│       │   ├── mobile-nav.tsx
│       │   └── index.ts
│       ├── sidebar/
│       │   ├── docs-sidebar.tsx
│       │   ├── sidebar-section.tsx
│       │   ├── sidebar-page-link.tsx
│       │   └── index.ts
│       ├── content/
│       │   ├── markdown-renderer.tsx
│       │   ├── code-block.tsx
│       │   ├── callout.tsx
│       │   ├── breadcrumbs.tsx
│       │   ├── page-nav-footer.tsx
│       │   └── index.ts
│       ├── right-toc/
│       │   ├── on-page-toc.tsx
│       │   ├── toc-tree.tsx
│       │   ├── use-scroll-spy.ts
│       │   └── index.ts
│       ├── search/
│       │   ├── search-trigger.tsx
│       │   ├── search-palette.tsx
│       │   ├── search-result-item.tsx
│       │   ├── use-search-index.ts
│       │   └── index.ts
│       └── auth-button/
│           ├── auth-aware-button.tsx
│           └── index.ts
│
├── hooks/
│   ├── use-workspace.ts                      # 🆕 Phase H
│   └── notebook/
│       ├── use-publish-status.ts             # 🆕 Phase I
│       └── use-publish-action.ts             # 🆕 Phase I
│
├── lib/
│   ├── workspace/                            # 🆕 Phase H
│   │   ├── client.ts
│   │   ├── username-validator.ts
│   │   └── index.ts
│   │
│   ├── notebook/publish/                     # 🆕 Phase I
│   │   ├── publisher.ts
│   │   ├── unpublisher.ts
│   │   ├── publish-status.ts
│   │   ├── slug-utils.ts
│   │   └── index.ts
│   │
│   └── public-docs/                          # 🆕 Phase J
│       ├── fetch-workspace.ts
│       ├── fetch-notebook.ts
│       ├── extract-headings.ts
│       ├── slugify-heading.ts
│       ├── build-page-tree.ts
│       ├── find-page-by-path.ts
│       ├── find-prev-next-page.ts
│       ├── remark-callouts.ts
│       └── index.ts
│
├── stores/
│   └── workspace-store.ts                    # 🆕 Phase H (optional)
│
├── styles/
│   └── docs.css                              # 🆕 Phase J
│
├── types/
│   ├── workspace.ts                          # 🆕 Phase H
│   └── index.ts                              # 🔧 Phase H — re-exports
│
├── constants/
│   └── routes.ts                             # 🔧 Phase H — adds workspace route
│
└── supabase/migrations/                      # 🆕
    ├── 001_workspaces.sql
    └── 002_notebook_publishes.sql
```

### File Count Summary

| Phase | New | Modified | SQL |
|-------|:---:|:--------:|:---:|
| H | 10 | 3 | 1 |
| I | 10 | 2 | 1 |
| J | 22 | 0 | 0 |
| **Total** | **42** | **5** | **2** |

---

## 10. Routing Map

### Authenticated Routes (Dashboard — existing)

```
/dashboard                                   (existing)
/notebooks                                   (existing)
/notebooks/new                               (existing)
/notebooks/[id]                              (modified Phase I — adds publish button)
/profile                                     (existing)
/settings                                    (existing)
/settings/workspace                          🆕 Phase H
/pay                                         (existing)
```

### Public Routes (Anonymous OK)

```
/                                            (existing landing)
/login                                       (existing)
/register                                    (existing)

🆕 Phase J — Public Docs:
/@[username]                                 → workspace landing
/@[username]/[notebook-slug]                 → notebook home
/@[username]/[notebook-slug]/[...page-path]  → specific page
```

### API Routes

```
/api/auth/callback                           (existing)
/api/lemonsqueezy/*                          (existing)
/api/user/delete                             (existing)

🆕 Phase I:
/api/notebooks/publish                       POST
/api/notebooks/unpublish                     POST

🆕 Phase J:
/api/docs/workspace/[username]               GET
/api/docs/notebook/[username]/[slug]         GET
```

---

## 11. Dependencies

### Phase H

```bash
# No new dependencies — uses existing Supabase client
```

### Phase I

```bash
# No new dependencies — uses existing Supabase client
```

### Phase J (THE BIG ONE)

```bash
pnpm add \
  react-markdown@^9 \
  remark-gfm@^4 \
  remark-directive@^3 \
  rehype-slug@^6 \
  rehype-autolink-headings@^7 \
  rehype-pretty-code@^0.13 \
  shiki@^1 \
  fuse.js@^7 \
  unified@^11

# Types (if needed)
pnpm add -D @types/mdast
```

**Bundle size impact:** ~600KB gzipped (mostly Shiki). Use dynamic import for code blocks to defer load.

---

## 12. Free vs Paid Tier

| Feature | Free | Paid (LS subscription) | Trial (48hr) |
|---------|:----:|:----------------------:|:------------:|
| **Local editing (Phase A-G)** | | | |
| Unlimited notebooks (IndexedDB) | ✅ | ✅ | ✅ |
| ZIP import / export | ✅ | ✅ | ✅ |
| Local backup/restore | ✅ | ✅ | ✅ |
| **Publishing (Phase I-J)** | | | |
| Publish to `/@username/notebook` | ✅ (1 notebook only) | ✅ (unlimited) | ✅ (unlimited) |
| Public docs accessible by anyone | ✅ | ✅ | ✅ |
| 3-column layout + search | ✅ | ✅ | ✅ |
| Syntax highlighting | ✅ | ✅ | ✅ |
| Callouts | ✅ | ✅ | ✅ |

**The only paywall:** 1 published notebook limit on free tier. Everything else (features, performance, design) is identical.

---

## 13. Merge Strategy Per Phase

### Phase H — Auth + Workspaces

**Pre-merge:**
1. Login to Supabase dashboard → SQL Editor
2. Run `001_workspaces.sql`
3. Verify: create test signup → check `workspaces` table has new row
4. Backup these files in your project:
   - `src/stores/auth-store.ts`
   - `src/types/index.ts`
   - `src/constants/routes.ts`

**Merge order (copy from ZIP to your `src/`):**
1. `types/workspace.ts`
2. `lib/workspace/*`
3. `hooks/use-workspace.ts`
4. `stores/workspace-store.ts` (if using)
5. **Manually merge** `stores/auth-store.ts` (add workspace fetch logic)
6. **Manually merge** `types/index.ts` (re-export workspace types)
7. **Manually merge** `constants/routes.ts` (add `WORKSPACE_SETTINGS`)
8. `app/(dashboard)/settings/workspace/page.tsx`
9. `components/features/workspace/*`

**Post-merge smoke test:**
```bash
# 1. Sign up new user via /register
# 2. Check Supabase workspaces table → row exists with auto-generated username
# 3. Visit /settings/workspace → see editor with current username
# 4. Try editing username → save → verify 30-day cooldown banner appears
# 5. Try reserved username (e.g., "admin") → see error
```

---

### Phase I — Publish Flow

**Pre-merge:**
1. Verify Phase H is working (workspace exists for your user)
2. Run `002_notebook_publishes.sql` in Supabase SQL editor
3. Backup: `src/app/(dashboard)/notebooks/[id]/page.tsx`

**Merge order:**
1. `lib/notebook/publish/*`
2. `hooks/notebook/use-publish-*.ts`
3. `components/features/notebook/publish/*`
4. `app/api/notebooks/publish/route.ts`
5. `app/api/notebooks/unpublish/route.ts`
6. **Manually merge** `app/(dashboard)/notebooks/[id]/page.tsx` (add `<PublishButton />`)
7. **Manually merge** `components/features/notebook/notebooks/notebook-card.tsx` (add badge)

**Post-merge smoke test:**
```bash
# 1. Open existing notebook in editor
# 2. Click "Publish" → modal opens with auto-suggested slug
# 3. Modify slug → submit → success toast
# 4. Check Supabase notebook_publishes table → row exists
# 5. Try publishing 2nd notebook as free user → see paywall
# 6. Click "Unpublish" → confirm → row deleted from DB
```

---

### Phase J — Public Docs Renderer

**Pre-merge:**
1. Install all new dependencies (see Section 11)
2. Verify Phase I is working (you have at least 1 published notebook)
3. Test bundle size — add `@next/bundle-analyzer` and verify Shiki is lazy-loaded

**Merge order:**
1. `lib/public-docs/*` (data layer first)
2. `components/features/public-docs/content/*` (renderer components)
3. `components/features/public-docs/sidebar/*`
4. `components/features/public-docs/right-toc/*`
5. `components/features/public-docs/search/*`
6. `components/features/public-docs/auth-button/*`
7. `components/features/public-docs/layout/*`
8. `app/@[username]/*` (routes last — depends on all above)
9. `app/api/docs/*`
10. `styles/docs.css` → import in `src/app/layout.tsx`

**Post-merge smoke test:**
```bash
# 1. Visit /@yourusername → see workspace landing
# 2. Click your published notebook → 3-column layout renders
# 3. Click pages in left sidebar → content updates
# 4. Scroll long page → right TOC highlights active section
# 5. Press ⌘K → search palette opens → type → see results
# 6. Click result → navigates to page
# 7. Open in private browser window → no "Dashboard" button visible
# 8. Run Lighthouse → all scores >90
```

---

## 14. Risk Register

| Risk | Phase | Likelihood | Impact | Mitigation |
|------|-------|:----------:|:------:|------------|
| Username collision on signup | H | Medium | Low | Auto-suffix in trigger (`andre-1`, `andre-2`) |
| RLS misconfigured → data leak | H/I | Low | Critical | Test policies explicitly: anonymous read OK, anonymous write blocked |
| Snapshot JSON grows too large | I | Medium | Medium | JSONB compresses well in Postgres; monitor average size |
| Shiki bundle kills perf | J | High | High | Dynamic import + SSR-only code highlighting; user gets pre-rendered HTML |
| Search index too large client-side | J | Low | Low | Limit indexed content to 500 chars per page; lazy-load |
| SEO bad due to client-render | J | High | High | SSR all `/@username/*` routes (Next.js server components by default) |
| URL collision with reserved paths | H | Low | High | Reserved list enforced in DB check constraint + trigger |
| User loses local data (no cloud sync) | All | Medium | High | UX nudge: "Backup before clearing browser data"; emphasize publish = backup |
| Free tier abuse (multiple accounts) | I | Medium | Low | Monitor patterns; LS handles payment fraud |
| Public docs scraped/copied | J | High | Low | Acceptable — content is meant to be public |

---

## 15. Implementation Timeline

### Sprint 1 — Phase H (Week 1, days 1-3)

**Day 1:** Database + types + storage layer
- Run migration in Supabase
- Build `lib/workspace/*` + types
- Build `useWorkspace` hook

**Day 2:** Settings UI
- `UsernameEditor` component with availability check
- `WorkspaceInfoCard` with public URL preview
- Settings page wiring

**Day 3:** Integration + testing
- Merge with existing auth store
- Smoke test full signup → workspace creation flow
- Polish + edge cases

### Sprint 2 — Phase I (Week 1 day 4 → Week 2 day 1)

**Day 4:** Database + library
- Run migration
- `lib/notebook/publish/*` (publisher, unpublisher, slug utils)
- API routes

**Day 5:** UI components
- `PublishButton`, `PublishModal`, status badge
- Free tier enforcement check

**Day 6:** Integration
- Wire into notebook editor page
- Wire into notebook card
- Smoke test full publish → re-publish → unpublish flow

**Day 7:** Polish + edge cases
- Slug conflict handling
- Network error handling
- Loading states

### Sprint 3 — Phase J Part 1 (Week 2 days 2-7)

**Day 8-9:** Foundation
- Install deps
- Set up `lib/public-docs/*` (data fetching)
- Create routes structure with placeholders

**Day 10-11:** Layout shell
- 3-column `DocsShell`
- `PublicDocsHeader` with auth detection
- Mobile responsive sheet for sidebar

**Day 12-13:** Markdown rendering
- `MarkdownRenderer` with full plugin stack
- `CodeBlock` with Shiki + copy
- `Callout` components

### Sprint 4 — Phase J Part 2 (Week 3 days 1-5)

**Day 14:** Left sidebar
- Recursive section tree
- Active highlighting
- Mobile sheet integration

**Day 15:** Right TOC
- Heading extraction
- Scroll-spy with IntersectionObserver
- Smooth scroll on click

**Day 16:** Search
- `useSearchIndex` with fuse.js
- Search palette modal
- Keyboard shortcuts

**Day 17:** Navigation polish
- Breadcrumbs
- Prev/Next buttons
- 404 pages

**Day 18:** SEO + perf
- Meta tags
- Open Graph
- Lighthouse optimization
- Final smoke test full flow

---

## 📦 Deliverable Format

After your approval of this roadmap, each phase will be delivered as:

```
notebook-phase-h.zip
├── src/                          ← Copy contents into your project's src/
│   ├── types/workspace.ts
│   ├── lib/workspace/...
│   └── ...
├── supabase-migrations/
│   └── 001_workspaces.sql        ← Run in Supabase dashboard
└── README.md                     ← Phase-specific install + test steps
```

Each phase ZIP is **self-contained** — extract `src/` into project, run migration, smoke test, done.

---

## ✅ Final Approval Checklist

Before Phase H implementation begins, confirm:

- [ ] **All 10 locked decisions (Section 2) approved**
- [ ] **Database schema (Section 8) acceptable** — RLS policies, triggers
- [ ] **File structure (Section 9) makes sense**
- [ ] **Phase H → I → J order accepted** (no skipping)
- [ ] **Free tier limit of 1 published notebook OK?** (D9)
- [ ] **Timeline ~3 weeks realistic for your bandwidth?**
- [ ] **No additional features needed for MVP?** (last chance to add before build starts)

---

**End of Final MVP Roadmap.**

Once approved, **Phase H ZIP** ships first. 🚀