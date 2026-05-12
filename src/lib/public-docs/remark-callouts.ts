/**
 * Remark plugin: transform `remark-directive` container directives into
 * callout-compatible nodes that our React renderer can pick up.
 *
 * Markdown input:
 *   :::tip Custom title
 *   This is a tip.
 *   :::
 *
 * After this plugin runs, the AST node becomes a <div> with:
 *   - className: "callout callout-tip"
 *   - data-callout-type: "tip"
 *   - data-callout-title: "Custom title" (optional)
 *
 * The React markdown renderer's `components.div` override then catches
 * these and renders our `<Callout>` component.
 */

import type { Root } from "mdast";
import { visit } from "unist-util-visit";

// Allowed callout types — anything else becomes a generic info block
const ALLOWED_TYPES = new Set([
  "tip",
  "info",
  "warning",
  "danger",
  "note",
  "caution",
]);

interface DirectiveNode {
  type: "containerDirective" | "leafDirective" | "textDirective";
  name: string;
  attributes?: Record<string, string | null | undefined>;
  children?: unknown[];
  data?: {
    hName?: string;
    hProperties?: Record<string, unknown>;
  };
}

export function remarkCallouts() {
  return (tree: Root) => {
    visit(tree, (node: unknown) => {
      const n = node as DirectiveNode;
      if (
        n.type !== "containerDirective" &&
        n.type !== "leafDirective" &&
        n.type !== "textDirective"
      ) {
        return;
      }

      // Only handle container directives (the ::: blocks)
      if (n.type !== "containerDirective") return;

      const type = ALLOWED_TYPES.has(n.name) ? n.name : "info";

      // Extract optional title from first paragraph if marked as label
      // remark-directive puts directive label into a paragraph with
      // data: { directiveLabel: true } as the first child.
      let title: string | undefined;
      const firstChild = n.children?.[0] as
        | { data?: { directiveLabel?: boolean }; children?: Array<{ value?: string }> }
        | undefined;
      if (firstChild?.data?.directiveLabel) {
        title = firstChild.children
          ?.map((c) => c.value ?? "")
          .join("")
          .trim();
        // Remove the label paragraph from children so it doesn't render twice
        n.children = (n.children ?? []).slice(1);
      }

      // Tell mdast-util-to-hast to render this as a <div> with our classes
      n.data = n.data ?? {};
      n.data.hName = "div";
      n.data.hProperties = {
        className: `callout callout-${type}`,
        "data-callout-type": type,
        ...(title ? { "data-callout-title": title } : {}),
      };
    });
  };
}
