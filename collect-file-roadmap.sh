#!/bin/bash

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

WORKSPACE_ROOT="$(pwd)"
ROADMAP="$WORKSPACE_ROOT/ROADMAP"
SRC="$ROADMAP/src"
DOC="$ROADMAP/doc"
OUT="$WORKSPACE_ROOT/collected-patch.txt"

echo "" > "$OUT"

cat >> "$OUT" << 'EOF'
# MARKDOWN-EDITOR ROADMAP - Source Code Collection

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
section "📖" "DOC — Phase READMEs"

collect_file "$DOC/PHASE-A-README.md"
collect_file "$DOC/PHASE-B-README.md"
collect_file "$DOC/PHASE-C-README.md"
collect_file "$DOC/PHASE-D-README.md"
collect_file "$DOC/PHASE-E-README.md"
collect_file "$DOC/PHASE-F-README.md"

# ================================================
section "📝" "SRC — Types"

collect_file "$SRC/types/notebook.ts"

# ================================================
section "⚙️" "SRC — Constants"

collect_file "$SRC/constants/notebook.ts"
collect_file "$SRC/constants/routes.ts"
collect_file "$SRC/constants/index.ts"

# ================================================
section "🗄️" "SRC — Storage"

collect_file "$SRC/lib/notebook/storage/db.ts"
collect_file "$SRC/lib/notebook/storage/notebooks.ts"
collect_file "$SRC/lib/notebook/storage/sections.ts"
collect_file "$SRC/lib/notebook/storage/pages.ts"
collect_file "$SRC/lib/notebook/storage/tags.ts"
collect_file "$SRC/lib/notebook/storage/settings.ts"
collect_file "$SRC/lib/notebook/storage/backup.ts"
collect_file "$SRC/lib/notebook/storage/index.ts"

# ================================================
section "🔩" "SRC — Utils"

collect_file "$SRC/lib/notebook/utils/slugify.ts"
collect_file "$SRC/lib/notebook/utils/sort.ts"
collect_file "$SRC/lib/notebook/utils/filename-utils.ts"
collect_file "$SRC/lib/notebook/utils/frontmatter.ts"

# ================================================
section "✅" "SRC — Validators"

collect_file "$SRC/lib/notebook/validators.ts"

# ================================================
section "📥" "SRC — Import (lib)"

collect_file "$SRC/lib/notebook/import/zip-parser.ts"
collect_file "$SRC/lib/notebook/import/md-parser.ts"
collect_file "$SRC/lib/notebook/import/importer.ts"

# ================================================
section "📤" "SRC — Export (lib)"

collect_file "$SRC/lib/notebook/export/exporter.ts"
collect_file "$SRC/lib/notebook/export/zip-builder.ts"
collect_file "$SRC/lib/notebook/export/md-serializer.ts"
collect_file "$SRC/lib/notebook/export/filename-builder.ts"
collect_file "$SRC/lib/notebook/export/index.ts"

# ================================================
section "🧠" "SRC — Store"

collect_file "$SRC/stores/notebook-store.ts"

# ================================================
section "🎣" "SRC — Hooks"

collect_file "$SRC/hooks/notebook/use-notebooks.ts"
collect_file "$SRC/hooks/notebook/use-notebook.ts"
collect_file "$SRC/hooks/notebook/use-sections.ts"
collect_file "$SRC/hooks/notebook/use-pages.ts"
collect_file "$SRC/hooks/notebook/use-current-page.ts"
collect_file "$SRC/hooks/notebook/use-notebook-settings.ts"

# ================================================
section "🎨" "SRC — Layout"

collect_file "$SRC/components/layout/nav-config.ts"

# ================================================
section "📒" "SRC — Components: Notebooks"

collect_file "$SRC/components/features/notebook/notebooks/index.ts"
collect_file "$SRC/components/features/notebook/notebooks/notebook-card.tsx"
collect_file "$SRC/components/features/notebook/notebooks/notebook-grid.tsx"
collect_file "$SRC/components/features/notebook/notebooks/new-notebook-modal.tsx"
collect_file "$SRC/components/features/notebook/notebooks/notebook-tag-badge.tsx"

# ================================================
section "🗂️" "SRC — Components: File Manager"

collect_file "$SRC/components/features/notebook/file-manager/index.ts"
collect_file "$SRC/components/features/notebook/file-manager/notebook-sidebar.tsx"
collect_file "$SRC/components/features/notebook/file-manager/section-node.tsx"
collect_file "$SRC/components/features/notebook/file-manager/page-list-item.tsx"
collect_file "$SRC/components/features/notebook/file-manager/page-card.tsx"
collect_file "$SRC/components/features/notebook/file-manager/search-bar.tsx"
collect_file "$SRC/components/features/notebook/file-manager/new-item-menu.tsx"

# ================================================
section "✍️" "SRC — Components: Editor"

collect_file "$SRC/components/features/notebook/editor/index.ts"
collect_file "$SRC/components/features/notebook/editor/notebook-editor.tsx"
collect_file "$SRC/components/features/notebook/editor/source-editor.tsx"
collect_file "$SRC/components/features/notebook/editor/editor-toolbar.tsx"
collect_file "$SRC/components/features/notebook/editor/word-count-footer.tsx"

# ================================================
section "📦" "SRC — Components: Import"

collect_file "$SRC/components/features/notebook/import/index.ts"
collect_file "$SRC/components/features/notebook/import/import-zip-button.tsx"
collect_file "$SRC/components/features/notebook/import/import-preview-modal.tsx"
collect_file "$SRC/components/features/notebook/import/import-md-handler.tsx"
collect_file "$SRC/components/features/notebook/import/import-progress.tsx"

# ================================================
section "💾" "SRC — Components: Export"

collect_file "$SRC/components/features/notebook/export/index.ts"
collect_file "$SRC/components/features/notebook/export/export-zip-button.tsx"
collect_file "$SRC/components/features/notebook/export/backup-restore-section.tsx"
collect_file "$SRC/components/features/notebook/export/restore-confirm-modal.tsx"

# ================================================
section "🌐" "SRC — App Pages"

collect_file "$SRC/app/(dashboard)/notebooks/page.tsx"
collect_file "$SRC/app/(dashboard)/notebooks/new/page.tsx"
collect_file "$SRC/app/(dashboard)/notebooks/[id]/page.tsx"

# ================================================
echo ""
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}${GREEN}✅ DONE!${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}📄 Output : ${NC}$OUT"
echo -e "${CYAN}📝 Lines  : ${NC}$(wc -l < "$OUT")"
echo -e "${CYAN}📦 Size   : ${NC}$(du -h "$OUT" | cut -f1)"
echo -e "${YELLOW}⏭️  Skipped : dump/* (diabaikan)${NC}"
echo ""