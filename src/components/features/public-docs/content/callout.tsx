"use client";

/**
 * Callout component — rendered from `:::tip`/`:::info`/`:::warning`/`:::danger`
 * markdown directives via our `remarkCallouts` plugin.
 *
 * The remark plugin transforms directive blocks into `<div class="callout callout-<type>">`,
 * which our markdown renderer's `components.div` override forwards here.
 *
 * Styles live in `src/styles/docs.css` (.callout, .callout-tip, etc).
 */

import {
  Lightbulb,
  Info,
  AlertTriangle,
  ShieldAlert,
  FileText,
  AlertCircle,
  type LucideIcon,
} from "lucide-react";

export type CalloutType =
  | "tip"
  | "info"
  | "note"
  | "warning"
  | "caution"
  | "danger";

interface CalloutProps {
  type: CalloutType;
  title?: string;
  children: React.ReactNode;
}

const ICON_MAP: Record<CalloutType, LucideIcon> = {
  tip: Lightbulb,
  info: Info,
  note: FileText,
  warning: AlertTriangle,
  caution: AlertCircle,
  danger: ShieldAlert,
};

const DEFAULT_TITLE: Record<CalloutType, string> = {
  tip: "Tip",
  info: "Info",
  note: "Note",
  warning: "Warning",
  caution: "Caution",
  danger: "Danger",
};

export function Callout({ type, title, children }: CalloutProps) {
  const Icon = ICON_MAP[type] ?? Info;
  const displayTitle = title || DEFAULT_TITLE[type];

  return (
    <div className={`callout callout-${type}`} data-callout-type={type}>
      <div className="callout-title">
        <Icon className="h-4 w-4 flex-shrink-0" />
        <span>{displayTitle}</span>
      </div>
      {children}
    </div>
  );
}
