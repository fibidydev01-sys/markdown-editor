/**
 * Markdown renderer — server-side HTML pre-rendering.
 *
 * ──────────────────────────────────────────────────────────────────
 * WHY THIS CHANGED (Phase Fix):
 * ──────────────────────────────────────────────────────────────────
 * Previously this component used `react-markdown` to render markdown.
 * That caused a runtime error:
 *
 *   Error: `runSync` finished async. Use `run` instead.
 *
 * Cause: `rehype-pretty-code` (Shiki under the hood) is ASYNC, but
 * `react-markdown` calls plugins via `runSync`. The mismatch crashes
 * at client-side hydration.
 *
 * Fix: Use `unified` directly on the server, output an HTML string,
 * render via `dangerouslySetInnerHTML`. This is:
 *   - Faster (zero client JS for markdown)
 *   - Better SEO (HTML is pre-rendered)
 *   - Compatible with async plugins (Shiki works natively)
 *
 * This is the same pattern used by Vercel docs, shadcn/ui, etc.
 *
 * ──────────────────────────────────────────────────────────────────
 * Plugin pipeline (unchanged from before):
 *   - remark-parse           → markdown → mdast
 *   - remark-gfm             → tables, task lists, strikethrough
 *   - remark-directive       → ::: callout syntax
 *   - remarkCallouts         → custom: directives → callout divs
 *   - remark-rehype          → mdast → hast
 *   - rehype-slug            → add id to headings
 *   - rehype-autolink-headings → wrap headings in <a href="#slug">
 *   - rehype-pretty-code     → Shiki syntax highlighting
 *   - rehype-stringify       → hast → HTML string
 *
 * ──────────────────────────────────────────────────────────────────
 * Custom rendering (was via react-markdown components, now done in CSS/JS):
 *   - Code blocks → CSS handles copy button via .docs-code-copy class
 *     (small client component injected per code block via post-process)
 *   - Callouts → already emitted as <div class="callout callout-*">
 *     by remarkCallouts, styled by docs.css
 *   - External links → post-processed to add target="_blank"
 */

import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkDirective from "remark-directive";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeStringify from "rehype-stringify";
import { remarkCallouts } from "@/lib/public-docs";
import { CodeBlockEnhancer } from "./code-block-enhancer";

interface MarkdownRendererProps {
  markdown: string;
  className?: string;
}

/**
 * Server component — runs at request time, returns HTML string baked
 * into the page. The CodeBlockEnhancer client component is mounted
 * once to wire up copy buttons on all <pre> elements after hydration.
 */
export async function MarkdownRenderer({
  markdown,
  className,
}: MarkdownRendererProps) {
  const html = await renderMarkdownToHtml(markdown);

  return (
    <>
      <article
        className={`docs-prose ${className ?? ""}`.trim()}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {/* Client-side enhancer: adds copy buttons + external link handling */}
      <CodeBlockEnhancer />
    </>
  );
}

// ============================================================
// Server-side pipeline
// ============================================================

async function renderMarkdownToHtml(markdown: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkDirective)
    .use(remarkCallouts)
    .use(remarkRehype, { allowDangerousHtml: false })
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, {
      behavior: "wrap",
      properties: {
        className: ["heading-anchor"],
        ariaHidden: false,
        tabIndex: -1,
      },
    })
    .use(rehypePrettyCode, {
      theme: "github-dark",
      keepBackground: false,
      defaultLang: "plaintext",
    })
    .use(rehypeStringify)
    .process(markdown);

  return String(file);
}