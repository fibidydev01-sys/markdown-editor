"use client";

/**
 * Notebook editor — main editing surface inside `/notebooks/[id]`.
 *
 * Renders a BlockNote visual editor by default with a toggle to a raw
 * markdown source view. Owns:
 *   - Title local state (synced from page prop on mount + page id change)
 *   - Mode local state (visual / source)
 *   - Markdown string local state (for source mode)
 *   - BlockNote instance via useCreateBlockNote()
 *   - Theme detection (light/dark via media query)
 *
 * Save flow:
 *   - All changes call `onScheduleSave(updates)` (debounced upstream)
 *   - On unmount or page switch, `onFlushSave()` commits pending changes
 *   - Mode switch triggers an immediate flush + content sync
 *
 * The parent (notebook page) owns the storage layer via useCurrentPage hook.
 */

import "@blocknote/mantine/style.css";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import type { Block } from "@blocknote/core";
import { EditorToolbar, type EditorMode } from "./editor-toolbar";
import { SourceEditor } from "./source-editor";
import { WordCountFooter } from "./word-count-footer";
import type { NotebookPage, UpdatePageInput } from "@/types/notebook";

interface NotebookEditorProps {
  /** The page being edited. Re-key the component when page.id changes. */
  page: NotebookPage;
  /** Default mode from user settings. */
  defaultMode?: EditorMode;
  /** Word count visibility from user settings. */
  showWordCount: boolean;
  /** Toggle word count visibility — persists to settings. */
  onToggleWordCount: () => void;
  /** Schedule a save (debounced upstream). */
  onScheduleSave: (updates: UpdatePageInput) => void;
  /** Flush pending save immediately. */
  onFlushSave: () => Promise<void>;
  /** Save indicator state. */
  isSaving?: boolean;
}

export function NotebookEditor({
  page,
  defaultMode = "visual",
  showWordCount,
  onToggleWordCount,
  onScheduleSave,
  onFlushSave,
  isSaving,
}: NotebookEditorProps) {
  // ── Local state ───────────────────────────────────────
  const [title, setTitle] = useState(page.title);
  const [mode, setMode] = useState<EditorMode>(defaultMode);
  const [markdown, setMarkdown] = useState(page.content);

  // ── Theme resolve (light/dark) for BlockNote ──────────
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(
    "light"
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Detect: either explicit .dark on html OR system preference
    const detectTheme = (): "light" | "dark" => {
      const htmlIsDark =
        document.documentElement.classList.contains("dark");
      if (htmlIsDark) return "dark";

      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      return prefersDark ? "dark" : "light";
    };

    setResolvedTheme(detectTheme());

    // Watch system preference changes
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handleMqChange = () => setResolvedTheme(detectTheme());
    mq.addEventListener("change", handleMqChange);

    // Watch `.dark` class changes on html element
    const observer = new MutationObserver(() => {
      setResolvedTheme(detectTheme());
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      mq.removeEventListener("change", handleMqChange);
      observer.disconnect();
    };
  }, []);

  // ── BlockNote instance ────────────────────────────────
  // Keyed by page.id at the component level (see parent) — so this hook
  // initializes fresh content for each page.
  const editor = useCreateBlockNote({
    initialContent:
      page.blockNoteContent && Array.isArray(page.blockNoteContent)
        ? (page.blockNoteContent as Block[])
        : undefined,
  });

  // ── First-load markdown parsing fallback ──────────────
  // If page has content (markdown) but no blockNoteContent yet (e.g. imported
  // from MD file or created without editor), parse markdown into blocks
  // on first mount and persist.
  const hasInitializedRef = useRef(false);
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const hasContent = page.content && page.content.length > 0;
    const hasBlocks =
      page.blockNoteContent &&
      Array.isArray(page.blockNoteContent) &&
      page.blockNoteContent.length > 0;

    if (hasContent && !hasBlocks) {
      // Parse markdown into blocks
      (async () => {
        const blocks = await editor.tryParseMarkdownToBlocks(page.content);
        if (!blocks || blocks.length === 0) return;

        // Only replace if user hasn't started typing yet.
        // Empty editor = 1 default empty paragraph block.
        const currentDoc = editor.document;
        const isEmpty =
          currentDoc.length === 0 ||
          (currentDoc.length === 1 &&
            currentDoc[0].type === "paragraph" &&
            (!currentDoc[0].content ||
              (Array.isArray(currentDoc[0].content) &&
                currentDoc[0].content.length === 0)));

        if (isEmpty) {
          // replaceBlocks fires BlockNote's onChange → handleEditorChange
          // will already schedule a save with both content + blockNoteContent.
          editor.replaceBlocks(editor.document, blocks);
        }
      })();
    }
    // Intentionally empty deps — first mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sync title from page prop when external title change ──
  // (e.g. rename from sidebar context menu while editor is open)
  useEffect(() => {
    setTitle(page.title);
  }, [page.title]);

  // ── Title change handler ──────────────────────────────
  const handleTitleChange = useCallback(
    (newTitle: string) => {
      setTitle(newTitle);
      onScheduleSave({ title: newTitle });
    },
    [onScheduleSave]
  );

  // ── BlockNote change handler (visual mode) ────────────
  const handleEditorChange = useCallback(async () => {
    if (mode !== "visual") return;
    const blocks = editor.document;
    const md = await editor.blocksToMarkdownLossy(blocks);
    setMarkdown(md);
    onScheduleSave({
      blockNoteContent: blocks,
      content: md,
    });
  }, [editor, mode, onScheduleSave]);

  // ── Source textarea change handler ────────────────────
  const handleMarkdownChange = useCallback(
    (newMarkdown: string) => {
      setMarkdown(newMarkdown);
      onScheduleSave({ content: newMarkdown });
    },
    [onScheduleSave]
  );

  // ── Mode switch handler ───────────────────────────────
  const handleModeChange = useCallback(
    async (newMode: EditorMode) => {
      if (newMode === mode) return;

      // Visual → Source: capture current markdown from blocks
      if (mode === "visual" && newMode === "source") {
        const md = await editor.blocksToMarkdownLossy(editor.document);
        setMarkdown(md);
        // Ensure pending blocks are flushed
        await onFlushSave();
      }
      // Source → Visual: parse markdown into blocks
      else if (mode === "source" && newMode === "visual") {
        const blocks = await editor.tryParseMarkdownToBlocks(markdown);
        if (blocks && blocks.length > 0) {
          editor.replaceBlocks(editor.document, blocks);
        } else {
          // Empty markdown — clear blocks
          editor.replaceBlocks(editor.document, []);
        }
        // Persist parsed blocks immediately
        onScheduleSave({
          blockNoteContent: editor.document,
          content: markdown,
        });
        await onFlushSave();
      }

      setMode(newMode);
    },
    [mode, editor, markdown, onScheduleSave, onFlushSave]
  );

  // ── Click below content area focuses cursor at end ────
  const handleEditorContainerClick = useCallback(
    (e: React.MouseEvent) => {
      // Only handle clicks on the wrapper itself (the spacer below content),
      // not clicks inside BlockNote's own container
      const target = e.target as HTMLElement;
      if (
        target === e.currentTarget ||
        target.closest(".bn-container") === null
      ) {
        const blocks = editor.document;
        if (blocks.length > 0) {
          const lastBlock = blocks[blocks.length - 1];
          editor.setTextCursorPosition(lastBlock, "end");
          editor.focus();
        }
      }
    },
    [editor]
  );

  // ── Flush on unmount ──────────────────────────────────
  useEffect(() => {
    return () => {
      // Fire-and-forget flush (component is unmounting, can't await)
      onFlushSave().catch((err) => {
        console.error("[NotebookEditor] unmount flush error:", err);
      });
    };
    // We want this only on unmount — onFlushSave is stable enough
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Memoize markdown for word count (only update in source mode
  //    or when blocks change in visual mode) ───────────────
  const wordCountMarkdown = useMemo(() => markdown, [markdown]);

  // ── Render ────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Toolbar */}
      <EditorToolbar
        title={title}
        onTitleChange={handleTitleChange}
        mode={mode}
        onModeChange={handleModeChange}
        isSaving={isSaving}
        lastSavedAt={page.updatedAt}
      />

      {/* Editor area */}
      {mode === "visual" ? (
        <div
          className="flex-1 min-h-0 overflow-auto cursor-text px-2 sm:px-4 pt-4"
          onClick={handleEditorContainerClick}
        >
          {/* Decorative title heading — shows the page title prominently
              in the content area. Edit via the toolbar input above. */}
          <h1 className="text-3xl font-bold tracking-tight mb-4 px-4 sm:px-12">
            {title || (
              <span className="text-muted-foreground/40">Untitled</span>
            )}
          </h1>

          <BlockNoteView
            editor={editor}
            onChange={handleEditorChange}
            theme={resolvedTheme}
          />

          {/* Spacer for clickable area below content */}
          <div className="min-h-[40vh]" />
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <SourceEditor
            markdown={markdown}
            onChange={handleMarkdownChange}
            className="flex-1"
          />
        </div>
      )}

      {/* Footer */}
      <WordCountFooter
        markdown={wordCountMarkdown}
        visible={showWordCount}
        onToggleVisible={onToggleWordCount}
      />
    </div>
  );
}
