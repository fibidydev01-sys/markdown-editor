#!/bin/bash

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

WORKSPACE_ROOT="$(pwd)"
SRC="$WORKSPACE_ROOT/src"
OUT="$WORKSPACE_ROOT/collected-patch.txt"

echo "" > "$OUT"

cat >> "$OUT" << 'EOF'
# MARKDOWN-EDITOR PATCH - Source Code Collection

---

EOF

collect_file() {
    local file=$1
    if [ -f "$file" ]; then
        local rel="${file#$WORKSPACE_ROOT/}"
        local lines=$(wc -l < "$file" 2>/dev/null || echo "0")
        local ext="${file##*.}"
        echo -e "${GREEN}  ✓ ${NC}$rel ${CYAN}(${lines} lines)${NC}"
        cat >> "$OUT" << EOF

## \`$rel\`

**Lines:** $lines

\`\`\`$ext
$(cat "$file")
\`\`\`

---

EOF
    else
        echo -e "${RED}  ✗ SKIP${NC} ${YELLOW}(not found)${NC}: ${file#$WORKSPACE_ROOT/}"
    fi
}

section() {
    local icon=$1
    local label=$2
    echo ""
    echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}${BLUE}${icon} ${label}${NC}"
    echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    cat >> "$OUT" << EOF

# ${icon} ${label}

EOF
}

# ================================================
section "📁" "APP ROOT"
collect_file "$SRC/app/layout.tsx"
collect_file "$SRC/app/page.tsx"
collect_file "$SRC/app/globals.css"
collect_file "$SRC/app/error.tsx"
collect_file "$SRC/app/not-found.tsx"
collect_file "$SRC/proxy.ts"

# ================================================
section "🔐" "AUTH"
collect_file "$SRC/app/(auth)/layout.tsx"
collect_file "$SRC/app/(auth)/login/page.tsx"
collect_file "$SRC/app/(auth)/register/page.tsx"
collect_file "$SRC/app/api/auth/callback/route.ts"
collect_file "$SRC/components/features/auth/index.ts"
collect_file "$SRC/components/features/auth/login-form.tsx"
collect_file "$SRC/components/features/auth/logout-button.tsx"
collect_file "$SRC/components/features/auth/register-form.tsx"
collect_file "$SRC/components/features/index.ts"
collect_file "$SRC/components/providers/auth-provider.tsx"
collect_file "$SRC/components/providers/index.ts"
collect_file "$SRC/stores/auth-store.ts"
collect_file "$SRC/stores/index.ts"

# ================================================
section "🏠" "DASHBOARD"
collect_file "$SRC/app/(dashboard)/layout.tsx"
collect_file "$SRC/app/(dashboard)/dashboard/page.tsx"
collect_file "$SRC/app/(dashboard)/overview/page.tsx"
collect_file "$SRC/app/(dashboard)/profile/page.tsx"
collect_file "$SRC/app/(dashboard)/settings/page.tsx"
collect_file "$SRC/app/(dashboard)/settings/workspace/page.tsx"
collect_file "$SRC/app/(dashboard)/admin/page.tsx"
collect_file "$SRC/app/(dashboard)/pay/page.tsx"

# ================================================
section "🌐" "MARKETING"
collect_file "$SRC/app/(marketing)/layout.tsx"
collect_file "$SRC/app/(marketing)/page.tsx"
collect_file "$SRC/components/landing/index.ts"
collect_file "$SRC/components/landing/hero-section.tsx"
collect_file "$SRC/components/landing/features-section.tsx"
collect_file "$SRC/components/landing/pricing-section.tsx"
collect_file "$SRC/components/landing/cta-section.tsx"
collect_file "$SRC/components/landing/faq-section.tsx"
collect_file "$SRC/components/landing/footer.tsx"

# ================================================
section "💳" "BILLING"
collect_file "$SRC/components/billing/index.ts"
collect_file "$SRC/components/billing/account-management.tsx"
collect_file "$SRC/components/billing/checkout-button.tsx"
collect_file "$SRC/components/billing/pricing-section.tsx"
collect_file "$SRC/components/billing/subscription-status.tsx"

# ================================================
section "🍋" "API - LEMONSQUEEZY"
collect_file "$SRC/app/api/lemonsqueezy/checkout/route.ts"
collect_file "$SRC/app/api/lemonsqueezy/cancel/route.ts"
collect_file "$SRC/app/api/lemonsqueezy/resume/route.ts"
collect_file "$SRC/app/api/lemonsqueezy/webhook/route.ts"

# ================================================
section "👤" "API - USER"
collect_file "$SRC/app/api/user/delete/route.ts"

# ================================================
section "📓" "API - NOTEBOOKS"
collect_file "$SRC/app/api/notebooks/publish/route.ts"
collect_file "$SRC/app/api/notebooks/unpublish/route.ts"

# ================================================
section "📡" "API - DOCS (PUBLIC)"
collect_file "$SRC/app/api/docs/workspace/[username]/route.ts"
collect_file "$SRC/app/api/docs/notebook/[username]/[slug]/route.ts"

# ================================================
section "🎨" "LAYOUT COMPONENTS"
collect_file "$SRC/components/layout/index.ts"
collect_file "$SRC/components/layout/app-sidebar.tsx"
collect_file "$SRC/components/layout/header.tsx"
collect_file "$SRC/components/layout/mobile-nav.tsx"
collect_file "$SRC/components/layout/nav-config.ts"
collect_file "$SRC/components/layout/public-topbar.tsx"
collect_file "$SRC/components/layout/user-menu.tsx"

# ================================================
section "🔧" "SHARED COMPONENTS"
collect_file "$SRC/components/shared/index.ts"
collect_file "$SRC/components/shared/confirm-dialog.tsx"
collect_file "$SRC/components/shared/loading-spinner.tsx"
collect_file "$SRC/components/shared/offline-detector.tsx"
collect_file "$SRC/components/shared/typewriter-effect.tsx"
collect_file "$SRC/components/shared/video-modal.tsx"

# ================================================
section "📚" "LIB - SUPABASE"
collect_file "$SRC/lib/supabase/client.ts"
collect_file "$SRC/lib/supabase/proxy.ts"
collect_file "$SRC/lib/supabase/server.ts"
collect_file "$SRC/lib/supabase/admin.ts"

# ================================================
section "🍋" "LIB - LEMONSQUEEZY"
collect_file "$SRC/lib/lemonsqueezy/client.ts"
collect_file "$SRC/lib/lemonsqueezy/index.ts"
collect_file "$SRC/lib/lemonsqueezy/signature.ts"
collect_file "$SRC/lib/lemonsqueezy/status-mapper.ts"
collect_file "$SRC/lib/lemonsqueezy/webhook-handlers.ts"

# ================================================
section "👥" "LIB - WORKSPACE"
collect_file "$SRC/lib/workspace/client.ts"
collect_file "$SRC/lib/workspace/index.ts"
collect_file "$SRC/lib/workspace/username-validator.ts"

# ================================================
section "🌍" "LIB - PUBLIC DOCS"
collect_file "$SRC/lib/public-docs/index.ts"
collect_file "$SRC/lib/public-docs/server.ts"
collect_file "$SRC/lib/public-docs/fetch-workspace.ts"
collect_file "$SRC/lib/public-docs/fetch-notebook.ts"
collect_file "$SRC/lib/public-docs/get-viewer-info.ts"
collect_file "$SRC/lib/public-docs/build-page-tree.ts"
collect_file "$SRC/lib/public-docs/find-page-by-path.ts"
collect_file "$SRC/lib/public-docs/find-prev-next-page.ts"
collect_file "$SRC/lib/public-docs/extract-headings.ts"
collect_file "$SRC/lib/public-docs/slugify-heading.ts"
collect_file "$SRC/lib/public-docs/remark-callouts.ts"

# ================================================
section "📒" "LIB - NOTEBOOK / EXPORT"
collect_file "$SRC/lib/notebook/export/index.ts"
collect_file "$SRC/lib/notebook/export/exporter.ts"
collect_file "$SRC/lib/notebook/export/filename-builder.ts"
collect_file "$SRC/lib/notebook/export/md-serializer.ts"
collect_file "$SRC/lib/notebook/export/zip-builder.ts"

# ================================================
section "📥" "LIB - NOTEBOOK / IMPORT"
collect_file "$SRC/lib/notebook/import/importer.ts"
collect_file "$SRC/lib/notebook/import/md-parser.ts"
collect_file "$SRC/lib/notebook/import/zip-parser.ts"

# ================================================
section "🚀" "LIB - NOTEBOOK / PUBLISH"
collect_file "$SRC/lib/notebook/publish/index.ts"
collect_file "$SRC/lib/notebook/publish/publish-status.ts"
collect_file "$SRC/lib/notebook/publish/publisher.ts"
collect_file "$SRC/lib/notebook/publish/slug-utils.ts"
collect_file "$SRC/lib/notebook/publish/unpublisher.ts"

# ================================================
section "🗄️" "LIB - NOTEBOOK / STORAGE"
collect_file "$SRC/lib/notebook/storage/index.ts"
collect_file "$SRC/lib/notebook/storage/db.ts"
collect_file "$SRC/lib/notebook/storage/notebooks.ts"
collect_file "$SRC/lib/notebook/storage/pages.ts"
collect_file "$SRC/lib/notebook/storage/sections.ts"
collect_file "$SRC/lib/notebook/storage/settings.ts"
collect_file "$SRC/lib/notebook/storage/tags.ts"
collect_file "$SRC/lib/notebook/storage/backup.ts"

# ================================================
section "🖱️" "LIB - NOTEBOOK / DND"
collect_file "$SRC/lib/notebook/dnd/drop-resolver.ts"

# ================================================
section "🔩" "LIB - NOTEBOOK / UTILS"
collect_file "$SRC/lib/notebook/utils/filename-utils.ts"
collect_file "$SRC/lib/notebook/utils/frontmatter.ts"
collect_file "$SRC/lib/notebook/utils/slugify.ts"
collect_file "$SRC/lib/notebook/utils/sort.ts"
collect_file "$SRC/lib/notebook/validators.ts"

# ================================================
section "🔩" "LIB - UTILS"
collect_file "$SRC/lib/utils.ts"
collect_file "$SRC/lib/validators.ts"
collect_file "$SRC/lib/cors.ts"
collect_file "$SRC/lib/env.ts"

# ================================================
section "📝" "TYPES"
collect_file "$SRC/types/index.ts"
collect_file "$SRC/types/database.ts"
collect_file "$SRC/types/lemonsqueezy.ts"
collect_file "$SRC/types/notebook.ts"
collect_file "$SRC/types/publish.ts"
collect_file "$SRC/types/workspace.ts"

# ================================================
section "⚙️" "CONSTANTS"
collect_file "$SRC/constants/index.ts"
collect_file "$SRC/constants/routes.ts"
collect_file "$SRC/constants/plans.ts"
collect_file "$SRC/constants/notebook.ts"

# ================================================
section "🎣" "HOOKS"
collect_file "$SRC/hooks/index.ts"
collect_file "$SRC/hooks/use-auth.ts"
collect_file "$SRC/hooks/use-subscription.ts"
collect_file "$SRC/hooks/use-trial-status.ts"
collect_file "$SRC/hooks/use-workspace.ts"
collect_file "$SRC/hooks/notebook/use-notebooks.ts"
collect_file "$SRC/hooks/notebook/use-notebook.ts"
collect_file "$SRC/hooks/notebook/use-sections.ts"
collect_file "$SRC/hooks/notebook/use-pages.ts"
collect_file "$SRC/hooks/notebook/use-current-page.ts"
collect_file "$SRC/hooks/notebook/use-notebook-settings.ts"
collect_file "$SRC/hooks/notebook/use-publish-status.ts"
collect_file "$SRC/hooks/notebook/use-publish-action.ts"

# ================================================
section "🧠" "STORES"
collect_file "$SRC/stores/auth-store.ts"
collect_file "$SRC/stores/notebook-store.ts"
collect_file "$SRC/stores/workspace-store.ts"

# ================================================
section "📒" "COMPONENTS — Notebooks"
collect_file "$SRC/components/features/notebook/notebooks/index.ts"
collect_file "$SRC/components/features/notebook/notebooks/notebook-card.tsx"
collect_file "$SRC/components/features/notebook/notebooks/notebook-grid.tsx"
collect_file "$SRC/components/features/notebook/notebooks/new-notebook-modal.tsx"
collect_file "$SRC/components/features/notebook/notebooks/notebook-tag-badge.tsx"

# ================================================
section "🗂️" "COMPONENTS — File Manager"
collect_file "$SRC/components/features/notebook/file-manager/index.ts"
collect_file "$SRC/components/features/notebook/file-manager/notebook-sidebar.tsx"
collect_file "$SRC/components/features/notebook/file-manager/section-node.tsx"
collect_file "$SRC/components/features/notebook/file-manager/page-list-item.tsx"
collect_file "$SRC/components/features/notebook/file-manager/page-card.tsx"
collect_file "$SRC/components/features/notebook/file-manager/search-bar.tsx"
collect_file "$SRC/components/features/notebook/file-manager/new-item-menu.tsx"
collect_file "$SRC/components/features/notebook/file-manager/dnd-context.tsx"
collect_file "$SRC/components/features/notebook/file-manager/drag-overlay-card.tsx"
collect_file "$SRC/components/features/notebook/file-manager/drop-indicator.tsx"

# ================================================
section "✍️" "COMPONENTS — Editor"
collect_file "$SRC/components/features/notebook/editor/index.ts"
collect_file "$SRC/components/features/notebook/editor/notebook-editor.tsx"
collect_file "$SRC/components/features/notebook/editor/source-editor.tsx"
collect_file "$SRC/components/features/notebook/editor/editor-toolbar.tsx"
collect_file "$SRC/components/features/notebook/editor/word-count-footer.tsx"

# ================================================
section "📦" "COMPONENTS — Import"
collect_file "$SRC/components/features/notebook/import/index.ts"
collect_file "$SRC/components/features/notebook/import/import-zip-button.tsx"
collect_file "$SRC/components/features/notebook/import/import-preview-modal.tsx"
collect_file "$SRC/components/features/notebook/import/import-md-handler.tsx"
collect_file "$SRC/components/features/notebook/import/import-progress.tsx"
collect_file "$SRC/components/features/notebook/import/md-notebook-modal.tsx"
collect_file "$SRC/components/features/notebook/import/unified-dropzone.tsx"

# ================================================
section "💾" "COMPONENTS — Export"
collect_file "$SRC/components/features/notebook/export/index.ts"
collect_file "$SRC/components/features/notebook/export/export-zip-button.tsx"
collect_file "$SRC/components/features/notebook/export/backup-restore-section.tsx"
collect_file "$SRC/components/features/notebook/export/restore-confirm-modal.tsx"

# ================================================
section "🚀" "COMPONENTS — Publish"
collect_file "$SRC/components/features/notebook/publish/index.ts"
collect_file "$SRC/components/features/notebook/publish/publish-button.tsx"
collect_file "$SRC/components/features/notebook/publish/publish-modal.tsx"
collect_file "$SRC/components/features/notebook/publish/publish-status-badge.tsx"
collect_file "$SRC/components/features/notebook/publish/unpublish-confirm-modal.tsx"

# ================================================
section "👥" "COMPONENTS — Workspace"
collect_file "$SRC/components/features/workspace/index.ts"
collect_file "$SRC/components/features/workspace/username-editor.tsx"
collect_file "$SRC/components/features/workspace/workspace-info-card.tsx"

# ================================================
section "🌍" "COMPONENTS — Public Docs"
collect_file "$SRC/components/features/public-docs/layout/index.ts"
collect_file "$SRC/components/features/public-docs/layout/docs-shell.tsx"
collect_file "$SRC/components/features/public-docs/layout/public-docs-header.tsx"
collect_file "$SRC/components/features/public-docs/layout/mobile-nav.tsx"
collect_file "$SRC/components/features/public-docs/sidebar/index.ts"
collect_file "$SRC/components/features/public-docs/sidebar/docs-sidebar.tsx"
collect_file "$SRC/components/features/public-docs/sidebar/sidebar-section.tsx"
collect_file "$SRC/components/features/public-docs/sidebar/sidebar-page-link.tsx"
collect_file "$SRC/components/features/public-docs/content/index.ts"
collect_file "$SRC/components/features/public-docs/content/markdown-renderer.tsx"
collect_file "$SRC/components/features/public-docs/content/breadcrumbs.tsx"
collect_file "$SRC/components/features/public-docs/content/callout.tsx"
collect_file "$SRC/components/features/public-docs/content/code-block-enhancer.tsx"
collect_file "$SRC/components/features/public-docs/content/page-nav-footer.tsx"
collect_file "$SRC/components/features/public-docs/right-toc/index.ts"
collect_file "$SRC/components/features/public-docs/right-toc/on-page-toc.tsx"
collect_file "$SRC/components/features/public-docs/right-toc/toc-tree.tsx"
collect_file "$SRC/components/features/public-docs/right-toc/use-scroll-spy.ts"
collect_file "$SRC/components/features/public-docs/search/index.ts"
collect_file "$SRC/components/features/public-docs/search/search-palette.tsx"
collect_file "$SRC/components/features/public-docs/search/search-result-item.tsx"
collect_file "$SRC/components/features/public-docs/search/search-trigger.tsx"
collect_file "$SRC/components/features/public-docs/search/use-search-index.ts"
collect_file "$SRC/components/features/public-docs/auth-button/index.ts"
collect_file "$SRC/components/features/public-docs/auth-button/auth-aware-button.tsx"

# ================================================
section "🌐" "APP — Public Docs Pages ([username])"
collect_file "$SRC/app/[username]/layout.tsx"
collect_file "$SRC/app/[username]/page.tsx"
collect_file "$SRC/app/[username]/not-found.tsx"
collect_file "$SRC/app/[username]/[notebookSlug]/layout.tsx"
collect_file "$SRC/app/[username]/[notebookSlug]/page.tsx"
collect_file "$SRC/app/[username]/[notebookSlug]/not-found.tsx"
collect_file "$SRC/app/[username]/[notebookSlug]/[...pageSlug]/page.tsx"
collect_file "$SRC/app/[username]/[notebookSlug]/[...pageSlug]/not-found.tsx"

# ================================================
section "📓" "APP — Notebook Pages"
collect_file "$SRC/app/(dashboard)/notebooks/page.tsx"
collect_file "$SRC/app/(dashboard)/notebooks/new/page.tsx"
collect_file "$SRC/app/(dashboard)/notebooks/[id]/page.tsx"

# ================================================
section "🎨" "STYLES"
collect_file "$SRC/styles/docs.css"

# ================================================
echo ""
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}${GREEN}✅ DONE!${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}📄 Output : ${NC}$OUT"
echo -e "${CYAN}📝 Lines  : ${NC}$(wc -l < "$OUT")"
echo -e "${CYAN}📦 Size   : ${NC}$(du -h "$OUT" | cut -f1)"
echo -e "${YELLOW}⏭️  Skipped : components/ui/* (shadcn — diabaikan)${NC}"
echo ""