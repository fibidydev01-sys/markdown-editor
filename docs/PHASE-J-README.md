# VibesDoc Phase J — Public Docs Renderer

**Status:** ✅ Ready for install (46 files, 0 SQL migrations, 9 new deps)

This phase closes the loop: published notebooks (from Phase I) now render
as **beautiful public docs sites** at `/@username/notebook-slug`.

After Phase J, the user can:
- Visit `/@andre` → see all of Andre's published notebooks as cards
- Visit `/@andre/saas-boilerplate` → redirects to first page
- Visit `/@andre/saas-boilerplate/setup/install` → renders the page
- Use 3-column layout: left section tree, content, right TOC with scroll-spy
- Press **⌘K** to search the notebook (Fuse.js, client-side)
- See syntax-highlighted code blocks (Shiki, github-dark, server-rendered)
- See callouts (`:::tip`, `:::warning`, `:::danger`, etc)
- Navigate with prev/next buttons at bottom of each page
- Header shows "Dashboard" + "Edit" buttons if owner is logged in
- Header shows "Dashboard" if any other user is logged in
- Header shows nothing if visitor is anonymous
- All routes SSR'd — view-source shows real HTML, great SEO

---

## What's Included

### Lib (10 files)

`src/lib/public-docs/`

| File | Purpose |
|------|---------|
| `fetch-workspace.ts` | Server-side workspace lookup + list of published notebooks |
| `fetch-notebook.ts` | Server-side notebook lookup via Phase I view |
| `extract-headings.ts` | Regex-based H2/H3 parser (skips code fences, frontmatter) |
| `slugify-heading.ts` | Diacritic-aware slugger matching `rehype-slug` output |
| `build-page-tree.ts` | Builds hierarchical section/page tree with URL paths |
| `find-page-by-path.ts` | URL segments → DocsPageNode resolver |
| `find-prev-next-page.ts` | Flat-order traversal for prev/next nav |
| `remark-callouts.ts` | Custom remark plugin: `:::tip` → `<div class="callout-tip">` |
| `get-viewer-info.ts` | Server-side auth + ownership check |
| `index.ts` | Barrel |

### Components (25 files)

`src/components/features/public-docs/`

**`layout/`** (4 files)
- `public-docs-header.tsx` — Sticky header (logo + search + auth button)
- `docs-shell.tsx` — 3-column layout wrapper
- `mobile-nav.tsx` — Hamburger + Sheet wrapping sidebar
- `index.ts`

**`sidebar/`** (4 files)
- `docs-sidebar.tsx` — Left section/page tree
- `sidebar-section.tsx` — Recursive collapsible section (auto-expand if active)
- `sidebar-page-link.tsx` — Page row with active highlight via `usePathname`
- `index.ts`

**`content/`** (6 files)
- `markdown-renderer.tsx` — Server component, full plugin stack
- `code-block.tsx` — Wraps `<pre>` with copy button
- `callout.tsx` — Renders callout divs with lucide icons per type
- `breadcrumbs.tsx` — Notebook / Section / Page navigation
- `page-nav-footer.tsx` — Prev/next cards at bottom of content
- `index.ts`

**`right-toc/`** (4 files)
- `on-page-toc.tsx` — Sticky right rail with scroll-spy
- `toc-tree.tsx` — Hierarchical heading display (active highlight)
- `use-scroll-spy.ts` — IntersectionObserver hook
- `index.ts`

**`search/`** (5 files)
- `search-trigger.tsx` — ⌘K button + global keyboard listener
- `search-palette.tsx` — Dialog with input, ↑↓/Enter keyboard nav, max 12 results
- `search-result-item.tsx` — Highlighted result with `<mark>` tags
- `use-search-index.ts` — Builds Fuse.js index from snapshot
- `index.ts`

**`auth-button/`** (2 files)
- `auth-aware-button.tsx` — Renders Dashboard / Edit / nothing based on viewer
- `index.ts`

### Routes (8 files)

`src/app/@[username]/`

```
@[username]/
├── layout.tsx                              # imports docs.css once
├── page.tsx                                # workspace landing
├── not-found.tsx                           # username 404
└── [notebookSlug]/
    ├── layout.tsx                          # minimal pass-through
    ├── page.tsx                            # redirects to first page
    ├── not-found.tsx                       # notebook 404
    └── [...pageSlug]/
        ├── page.tsx                        # ← THE MAIN PAGE RENDERER
        └── not-found.tsx                   # page 404
```

### API Routes (2 files)

`src/app/api/docs/`

- `workspace/[username]/route.ts` — GET workspace + published list (60s cache)
- `notebook/[username]/[slug]/route.ts` — GET full snapshot (60s cache)

These are optional — the SSR routes call the server lib directly. Useful
for client-side refresh or external integrations.

### Styles (1 file)

`src/styles/docs.css` — Scoped `.docs-prose` styles:
- Headings (h1–h4) with scroll-margin-top for sticky header offset
- Hash icon (`#`) on heading hover via `rehype-autolink-headings`
- GFM tables, lists, blockquotes, task lists
- Inline code + Shiki-rendered code blocks (github-dark, line highlighting, file titles)
- Callouts (tip=green, info/note=blue, warning/caution=amber, danger=red)
- Mobile font tweaks at 640px breakpoint

---

## Prerequisites

### Phases A–I must all be installed

Phase J depends on:
- **Phase A** types (`NotebookPage`, `NotebookSection`, `NotebookTag`)
- **Phase A** utilities (`slugify` from `@/lib/notebook/utils/slugify`)
- **Phase H** workspace + auth-store + `useAuthStore`
- **Phase H** routes (`ROUTES.DASHBOARD`, `ROUTES.NOTEBOOK_DETAIL`)
- **Phase I** `notebook_publishes` table
- **Phase I** `published_notebooks_with_workspace` view
- **Phase I** types (`PublishedNotebookWithWorkspace`)
- **Phase I** Supabase server client (`@/lib/supabase/server`)

### Shadcn components (already in boilerplate)

- `button`, `card`, `dialog`, `input`, `sheet`

No new shadcn components to install.

### Required env vars

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

No new env vars beyond what Phases H+I already need.

---

## Installation

### 1. Install dependencies

```bash
pnpm add react-markdown@^9 remark-gfm@^4 remark-directive@^3 \
  rehype-slug@^6 rehype-autolink-headings@^7 rehype-pretty-code@^0.13 \
  shiki@^1 fuse.js@^7 unified@^11 unist-util-visit
```

**Why each one:**
- `react-markdown` — React component that renders markdown AST
- `remark-gfm` — GitHub Flavored Markdown (tables, task lists, strikethrough)
- `remark-directive` — Parses `:::name` directive syntax
- `unist-util-visit` — Used by our remark-callouts plugin to walk the AST
- `rehype-slug` — Adds `id` attrs to headings (for anchor links)
- `rehype-autolink-headings` — Wraps headings in `<a href="#slug">`
- `rehype-pretty-code` — Shiki-based syntax highlighting
- `shiki` — The actual highlighter (runs at server-render time, no client bundle)
- `fuse.js` — Fuzzy search for ⌘K
- `unified` — Peer dep of the remark/rehype ecosystem

### 2. Copy files into your project

Extract `notebook-phase-j.zip` and copy `src/` into your project root.

**No REPLACE files** — Phase J is purely additive. The Next.js `@[username]`
route segment uses the `@` prefix which clashes with parallel routes ONLY
if you have parallel routes named `@username`. If you don't (the boilerplate
doesn't), it's interpreted as a literal `@` in the URL.

> **Heads up on the `@` route:** Next.js treats folders starting with `@`
> as **parallel routes** by default. But for top-level dynamic params like
> `@[username]`, it works as expected — the `@` becomes part of the URL.
> If you hit weird routing issues, double-check there's no parent layout
> with named slots like `<div>{userContent}</div>` expecting a slot named
> `userContent`.

### 3. Verify the route works

Start dev server:

```bash
pnpm dev
```

Then test:

1. **Workspace landing**: Visit `http://localhost:3000/@<your-username>`
   - ✅ Should show "X published notebooks" header
   - ✅ Cards for each published notebook
   - ✅ Click a card → navigates to notebook
   - ✅ Empty state if no published notebooks (with hint for owner)

2. **Notebook redirect**: Visit `http://localhost:3000/@<user>/<slug>`
   - ✅ Should redirect to first page (e.g. `/@user/slug/intro`)
   - ✅ If notebook is empty: shows empty state

3. **Page renderer**: Visit a deep page like `/@user/slug/setup/install`
   - ✅ Left sidebar shows section tree, active page highlighted
   - ✅ Breadcrumbs at top: Notebook / Section / Page
   - ✅ H1 page title rendered above markdown
   - ✅ Right TOC shows H2/H3 from page content (desktop ≥1280px)
   - ✅ Scroll-spy highlights active heading as you scroll
   - ✅ Click heading in TOC → smooth-scroll + URL hash updates
   - ✅ Code blocks have copy button (hover over code)
   - ✅ Callouts render with colored borders + icons
   - ✅ Prev/Next cards at bottom

4. **Search**: Press `⌘K` (Mac) or `Ctrl+K` (PC)
   - ✅ Modal opens with input focused
   - ✅ Type a query → results appear with `<mark>` highlights
   - ✅ ↑/↓ navigates, Enter opens
   - ✅ Esc closes

5. **Auth-aware header**:
   - ✅ Anonymous (not logged in): only logo on left, no auth button
   - ✅ Logged in (any user): "Dashboard" button on right
   - ✅ Logged in as owner: "Edit" + "Dashboard" buttons

6. **Mobile** (resize browser ≤1024px):
   - ✅ Left sidebar replaced by hamburger
   - ✅ Hamburger opens Sheet with sidebar content
   - ✅ Right TOC hidden
   - ✅ Tapping a sidebar link auto-closes the sheet

7. **404 handling**:
   - ✅ Bad username: `/@nonexistent` → "Workspace not found"
   - ✅ Bad slug: `/@user/wrongslug` → "Notebook not found"
   - ✅ Bad page: `/@user/slug/wrong/path` → "Page not found"

8. **SEO** (view-source):
   - ✅ `<title>` is `Page Title · Notebook Name`
   - ✅ `<meta property="og:title">` populated
   - ✅ `<meta property="og:description">` populated
   - ✅ Content HTML is present in source (not just `<div id="__next"></div>`)

---

## Architecture Notes

### Why server-side markdown rendering?

Per roadmap acceptance: "All pages SSR'd" + "Lighthouse > 90".

The markdown renderer is an **async server component**. It runs at request
time on the server, where the full plugin stack — including Shiki — executes.
The client receives pre-rendered HTML with syntax-highlighted code already
in place. **Zero Shiki ships to the client**, saving ~1.5 MB of theme data.

The only client-rendered interactivity inside the rendered HTML is:
- `<CodeBlock>` wrapper (copy button) — uses `useRef` + `useState`
- `<Callout>` icons — rendered server-side but the component is `"use client"`
  because lucide-react icons need it

### The remark-callouts plugin

Markdown:
```
:::tip Custom title
This is a tip.
:::
```

Flow:
1. `remark-directive` parses `:::tip` into a `containerDirective` node
2. Our `remarkCallouts` plugin transforms it: adds `data.hName = "div"`,
   sets className `callout callout-tip`, extracts label as `data-callout-title`
3. The renderer's `components.div` override catches divs with `callout-`
   className → wraps in `<Callout>` React component
4. `Callout` reads `data-callout-type` + `data-callout-title` and renders
   with the right icon + color

### Why a regex-based heading extractor?

Initially considered running the markdown through the full unified pipeline
to extract H2/H3. But that's expensive (parse → visit → extract) and the
TOC only needs structural info. A targeted regex parser handles:
- Skipping ` ```code fences``` ` (fence state machine)
- Skipping `    indented code blocks`
- Stripping leading frontmatter `--- ... ---`
- Stripping inline markdown markers (`**bold**`, `_em_`, etc.)
- Generating slugs that match what `rehype-slug` produces

Edge case: if `rehype-slug` ever changes its algorithm, our `slugifyHeading`
might diverge. For 99% of headings (ASCII letters/numbers, spaces, basic
punctuation), they agree perfectly. For exotic Unicode, swap in `github-slugger`
for exact parity.

### Hierarchical URL slugs

Roadmap example: `/@andre/saas-boilerplate/setup/install`

Pages have `title` + `sectionId` but no built-in slug. Strategy:
1. Server-side, when building the docs tree, slugify each section/page name
2. Track used slugs **per sibling group** for collision resolution
   (`installation` + `installation` → `installation` + `installation-2`)
3. Each tree node carries its full `pathSegments: string[]` from root
4. URL resolver walks the tree segment-by-segment matching against `slug`

If two pages in different sections have the same title, no collision — they
get different parent paths. Only **siblings** can collide, and the dedup
handles that.

### Scroll-spy implementation

`useScrollSpy` uses `IntersectionObserver` with `rootMargin: -80px 0px -70% 0px`:
- Top: -80px = activates when heading is just past the sticky header
- Bottom: -70% = deactivates when heading is 70% scrolled past

Why a Set instead of just last-intersecting? Multiple headings can be in view
at once (small ones, large viewport). Pick the **topmost intersecting** by
document order so the right one lights up.

### Client-side search index

Fuse.js index is built lazy via `useSearchIndex` — only when the palette
mounts. Weights:
- `title` × 0.6 (most relevant)
- `content` × 0.3 (truncated to 500 chars for speed)
- `sectionName` × 0.1 (helps "tutorial X" find pages in "Tutorials" section)

Threshold = 0.3 (Fuse default is 0.6 — too loose for docs search).

Content is markdown-stripped before indexing so search results don't show
raw `**bold**` markup. Code fences are replaced with whitespace (we don't
want to surface "function" 50 times from code samples).

### Why a layout file under `[notebookSlug]/`?

It's there mostly as a no-op pass-through. The reason it exists at all is
to make the route structure obvious to anyone reading the file tree. Could
be deleted without consequence (Next.js falls back to the parent layout).

If you ever want to add a notebook-level wrapper (e.g. an announcement banner),
this is where it goes.

### Why imports `docs.css` in layout but not in `app/layout.tsx`?

To keep dashboard pages from loading the docs CSS. Importing in
`@[username]/layout.tsx` scopes it to public docs only. If you import it
globally, dashboard headings would inherit `.docs-prose`-adjacent styles
even though they don't use the class — but the global CSS file would still
ship in every request bundle. Bandwidth + cleanliness win.

### Workspace landing's empty state for owner vs visitor

If the workspace owner is viewing their own landing and has nothing published
yet, we show a helpful CTA pointing them to the dashboard. For non-owners
the message is just "This workspace hasn't published any notebooks yet."

The owner detection happens via `getViewerInfo` which compares
`auth.getUser().id === workspace.user_id`.

---

## Smoke Tests

### SEO + SSR verification

```bash
# 1. Page is server-rendered (HTML contains content, not just root div)
curl -sL http://localhost:3000/@<username>/<slug>/<page> | grep -E "<title>|<h1>"
# Expected: real title + h1 in output

# 2. OpenGraph tags present
curl -sL http://localhost:3000/@<username>/<slug>/<page> | grep "og:"
# Expected: og:title, og:description, og:type=article

# 3. Twitter card present
curl -sL http://localhost:3000/@<username>/<slug>/<page> | grep "twitter:"
# Expected: twitter:card, twitter:title, twitter:description

# 4. Anchor IDs present on headings
curl -sL http://localhost:3000/@<username>/<slug>/<page> | grep -E '<h[234][^>]*id='
# Expected: lines with id="..."

# 5. Shiki code rendered server-side
curl -sL http://localhost:3000/@<username>/<slug>/<page> | grep -c "shiki"
# Expected: > 0 (Shiki classes embedded in HTML)

# 6. Workspace landing
curl -sL http://localhost:3000/@<username> | grep -E "<title>"
# Expected: "Display Name · Docs"

# 7. 404 returns proper status
curl -o /dev/null -s -w "%{http_code}\n" http://localhost:3000/@nonexistent
# Expected: 404

# 8. API endpoint cache headers
curl -I http://localhost:3000/api/docs/workspace/<username> | grep -i cache
# Expected: Cache-Control: public, max-age=60, s-maxage=60
```

### Lighthouse target

```bash
# Install lighthouse globally if not present
pnpm dlx lighthouse http://localhost:3000/@<username>/<slug>/<page> \
  --only-categories=performance,accessibility,seo,best-practices \
  --view
```

**Targets:**
- Performance: ≥ 90 (SSR + no client Shiki ships)
- Accessibility: ≥ 95 (aria-labels on nav, sheet, search palette)
- SEO: ≥ 95 (proper meta tags, semantic HTML)
- Best Practices: ≥ 95

### Manual UI checklist

- [ ] Workspace landing lists all published notebooks
- [ ] Click notebook → redirects to first page
- [ ] Sidebar shows section tree, expanded around active page
- [ ] Click sibling page in sidebar → URL updates, content swaps, sidebar
      highlight follows
- [ ] H2/H3 in content have `#` hover icons
- [ ] Click `#` icon → URL hash updates
- [ ] Scroll content → right TOC active heading follows
- [ ] Click TOC item → smooth scroll + URL hash updates
- [ ] Code block: hover → copy button appears → click → checkmark for 2s
- [ ] Callout types render with correct colors (tip=green, etc.)
- [ ] ⌘K opens palette, ↑↓ navigates, Enter opens, Esc closes
- [ ] Search results have highlighted match text in title or content
- [ ] Prev/next cards at bottom: clicking them works
- [ ] Mobile (resize to <1024px): hamburger replaces left sidebar
- [ ] Mobile hamburger sheet: tapping a link auto-closes
- [ ] Mobile (<1280px): right TOC hidden
- [ ] Anonymous: header has no auth button
- [ ] Logged-in non-owner: "Dashboard" button visible
- [ ] Owner: "Edit" + "Dashboard" buttons visible, "Edit" links to editor
- [ ] view-source shows real HTML content (not blank `__next` div)

---

## Known Limitations

### `@` route parsing edge cases

Next.js folder convention `@name` traditionally means "parallel route". Our
`@[username]` works because it's a dynamic route at the top level. But if
you ever add a parent layout with named slots, it could conflict. Tested
working with the boilerplate's current setup; flag this if you customize
the root layout.

### No incremental static regeneration

Pages are SSR'd at request time (good for freshness, never stale). We
considered ISR with `revalidate: 60` but for MVP, fresh-every-request is
fine and simpler. Cache headers on the API routes (60s) provide CDN-level
caching for the JSON endpoints.

If your traffic ever spikes, swap the SSR to ISR by adding:

```ts
export const revalidate = 60;
```

to the page files.

### Shiki theme is hardcoded

`github-dark` only, per roadmap D7. To add light theme later:
1. Change `rehypePrettyCode` config: `theme: { light: "github-light", dark: "github-dark" }`
2. Update `docs.css` to use CSS vars instead of hardcoded `#0d1117`
3. Add `data-theme` switching via class on `<html>`

### Images are external-only

Per Phase I roadmap D10. Markdown like `![](https://...)` works. Markdown
like `![](/local/upload)` won't (we never uploaded the image). Data URIs
work but bloat the snapshot. Future: add Supabase Storage upload.

### Search doesn't index code blocks

By design — `useSearchIndex.stripMarkdown` replaces code fences with
whitespace. Means you can't search for a specific function name inside
a code sample. Trade-off: keeps search results clean and prevents the same
keyword from matching 20 times via syntax highlighting tokens.

### No syntax highlighting for inline code

Inline code (`` `foo` ``) just gets the muted background style. Only
fenced code blocks get Shiki. This is rehype-pretty-code's default behavior
and changing it would require an additional rehype plugin.

### Right TOC threshold is `xl:` (1280px)

Left sidebar shows at `lg:` (1024px), right TOC at `xl:` (1280px). Between
those breakpoints, content gets the full left-sidebar layout without the
right TOC. This gives the content a comfortable max-width and avoids
cramped tablets.

### No table of contents on workspace landing

The `/@username` page lists notebooks but doesn't have a TOC. Reasoning:
notebooks ARE the navigation at that level, and a TOC of notebooks would
just duplicate the visible card list.

### Page slugs may shift on rename

When a user renames a page in IndexedDB then re-publishes, the slug changes.
Old URLs 404. This is unavoidable without a slug-to-page-id permanent table,
which adds complexity. The Phase I publish modal warns about slug changes
at the notebook level — page-level slug stability is a known gap.

A future enhancement: store a separate `published_pages` table with stable
ids, and a `redirects` map for renames. Out of scope for MVP.

---

## After Phase J — The Loop Is Closed

With H + I + J installed, the full flow works:

1. **User creates notebook locally** (Phases A–F) — IndexedDB
2. **User claims username** (Phase H) — workspaces table
3. **User publishes notebook** (Phase I) — notebook_publishes table
4. **World reads at `/@user/slug`** (Phase J) — SSR'd public docs site

MVP is shippable. 🚀

### Possible future enhancements (not roadmap)

- Light/dark theme toggle in docs (currently follows OS preference for everything except code blocks)
- Static site generation (ISR) for high-traffic sites
- Custom domains (CNAME → `<username>.yourdomain.com`)
- Analytics hooks (anonymous pageview counter)
- Print stylesheet (`@media print`)
- Versioned docs (multiple snapshots per notebook)
- Page-level edit history
- Real-time collaborative comments

These are intentionally out of scope. Shipping > perfect.
