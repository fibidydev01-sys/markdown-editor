"use client";

/**
 * Publish modal — main publish flow UI.
 *
 * Two modes:
 *   1. First-time publish: shows form (slug + preview URL)
 *   2. Re-publish (already published): shows form pre-filled with current
 *      slug. Warns if slug is being changed.
 *
 * Validation:
 *   - 500ms debounced slug availability check (mirrors UsernameEditor)
 *   - Race-condition guard via monotonic requestIdRef
 *   - Reserved characters caught instantly
 *
 * Free tier:
 *   - If publish API returns FREE_TIER_LIMIT, show inline upgrade CTA
 *     (still inside the modal — no extra navigation)
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Globe,
  Loader2,
  AlertCircle,
  Check,
  Crown,
  AlertTriangle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import { usePublishAction } from "@/hooks/notebook/use-publish-action";
import {
  validateSlugFormat,
  checkSlugAvailable,
  suggestSlugFromName,
  buildPublicUrl,
} from "@/lib/notebook/publish";
import { PublishError } from "@/lib/notebook/publish/publisher";
import { ROUTES } from "@/constants";
import type { Notebook } from "@/types/notebook";
import type { PublishStatus, PublishResult } from "@/types/publish";
import { cn } from "@/lib/utils";

const DEBOUNCE_MS = 500;

type ValidationState =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "valid" }
  | { kind: "invalid"; message: string }
  | { kind: "unchanged" };

interface PublishModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notebook: Notebook;
  /** Existing publish status — null for first-time publish. */
  currentStatus: PublishStatus | null;
  /** Called after successful publish — parent should refresh status. */
  onSuccess?: (result: PublishResult) => void;
}

export function PublishModal({
  open,
  onOpenChange,
  notebook,
  currentStatus,
  onSuccess,
}: PublishModalProps) {
  const workspace = useAuthStore((s) => s.workspace);
  const { publish, isPublishing } = usePublishAction();

  const isRePublish = currentStatus?.isPublished ?? false;
  const originalSlug = currentStatus?.notebookSlug ?? "";

  const [slug, setSlug] = useState("");
  const [validation, setValidation] = useState<ValidationState>({
    kind: "idle",
  });
  const [paywall, setPaywall] = useState<{
    show: boolean;
    currentCount?: number;
    limit?: number;
  }>({ show: false });

  // Debounce + stale-response guard
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  // ── Reset state when modal opens ───────────────────────
  useEffect(() => {
    if (open) {
      const initialSlug = isRePublish
        ? originalSlug
        : suggestSlugFromName(notebook.name);
      setSlug(initialSlug);
      setValidation({ kind: "unchanged" });
      setPaywall({ show: false });
    } else {
      // Cleanup
      if (debounceRef.current) clearTimeout(debounceRef.current);
    }
  }, [open, isRePublish, originalSlug, notebook.name]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // ── Slug validation pipeline ───────────────────────────

  const runValidation = (candidate: string) => {
    if (!workspace) return;

    const normalized = candidate.trim().toLowerCase();

    // Unchanged from current publish — no need to validate
    if (isRePublish && normalized === originalSlug) {
      setValidation({ kind: "unchanged" });
      return;
    }

    // Instant format check
    const formatCheck = validateSlugFormat(normalized);
    if (!formatCheck.isValid) {
      setValidation({
        kind: "invalid",
        message: formatCheck.error ?? "Invalid slug",
      });
      return;
    }

    // Format OK → debounced availability check
    setValidation({ kind: "checking" });

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const reqId = ++requestIdRef.current;
      try {
        const isAvailable = await checkSlugAvailable(
          workspace.id,
          normalized,
          notebook.id // exclude this notebook's own slug
        );

        if (reqId !== requestIdRef.current) return; // stale

        if (isAvailable) {
          setValidation({ kind: "valid" });
        } else {
          setValidation({
            kind: "invalid",
            message: "This slug is already used by another notebook",
          });
        }
      } catch (err) {
        if (reqId !== requestIdRef.current) return;
        console.error("[PublishModal] availability check error:", err);
        setValidation({
          kind: "invalid",
          message: "Couldn't check availability — try again",
        });
      }
    }, DEBOUNCE_MS);
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setSlug(next);
    runValidation(next);
  };

  // ── Submit ─────────────────────────────────────────────

  const canSubmit =
    !isPublishing &&
    (validation.kind === "valid" || validation.kind === "unchanged");

  const handleSubmit = async () => {
    if (!canSubmit || !workspace) return;

    setPaywall({ show: false });

    try {
      const result = await publish({
        notebookId: notebook.id,
        slug: slug.trim().toLowerCase(),
      });

      toast.success(
        result.isUpdate
          ? "Notebook re-published successfully"
          : "Notebook published successfully"
      );

      onSuccess?.(result);
      onOpenChange(false);
    } catch (err) {
      if (err instanceof PublishError) {
        // Special handling for paywall
        if (err.code === "FREE_TIER_LIMIT") {
          setPaywall({
            show: true,
            currentCount: err.details?.currentCount as number | undefined,
            limit: err.details?.limit as number | undefined,
          });
          return;
        }

        // Slug taken — surface inline
        if (err.code === "SLUG_TAKEN" || err.code === "INVALID_SLUG") {
          setValidation({ kind: "invalid", message: err.message });
          return;
        }

        toast.error(err.message);
      } else {
        toast.error("Failed to publish — please try again");
      }
    }
  };

  // ── Preview URL ────────────────────────────────────────

  const previewUrl =
    workspace && slug.trim()
      ? buildPublicUrl(workspace.username, slug.trim().toLowerCase())
      : null;

  const slugChanged =
    isRePublish && slug.trim().toLowerCase() !== originalSlug;

  // ── Render ─────────────────────────────────────────────

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (isPublishing && !next) return; // block close during publish
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <DialogTitle>
                {isRePublish ? "Update published notebook" : "Publish notebook"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {isRePublish
                  ? "Push your latest changes to the public URL"
                  : "Make this notebook publicly accessible"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Notebook preview */}
          <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2.5">
            <span className="text-2xl leading-none select-none">
              {notebook.icon || "📓"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm truncate">{notebook.name}</p>
              {notebook.description && (
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {notebook.description}
                </p>
              )}
            </div>
          </div>

          {/* Slug input */}
          <div className="space-y-2">
            <Label htmlFor="slug-input" className="text-sm font-medium">
              URL slug
            </Label>
            <div className="flex items-center rounded-md border focus-within:ring-2 focus-within:ring-ring focus-within:border-ring transition-shadow">
              <span className="pl-3 pr-1 text-muted-foreground font-mono text-xs select-none truncate max-w-[140px] sm:max-w-none">
                /@{workspace?.username ?? "..."}/
              </span>
              <Input
                id="slug-input"
                value={slug}
                onChange={handleSlugChange}
                disabled={isPublishing}
                autoComplete="off"
                spellCheck={false}
                className="border-0 focus-visible:ring-0 font-mono text-sm pl-0"
                placeholder="notebook-slug"
                maxLength={100}
              />
              <div className="pr-3 flex items-center">
                <ValidationIcon validation={validation} />
              </div>
            </div>
            <p
              className={cn(
                "text-xs min-h-[1rem]",
                validation.kind === "invalid"
                  ? "text-destructive"
                  : validation.kind === "valid"
                  ? "text-green-600"
                  : "text-muted-foreground"
              )}
            >
              <ValidationMessage validation={validation} />
            </p>
          </div>

          {/* Slug-change warning */}
          {slugChanged && validation.kind !== "invalid" && (
            <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-900/40 py-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
              <AlertDescription className="text-xs text-yellow-900 dark:text-yellow-200">
                Changing the slug will <strong>break the old URL</strong>{" "}
                (<code className="font-mono">/@{workspace?.username}/{originalSlug}</code>).
                Anyone with the old link will get a 404.
              </AlertDescription>
            </Alert>
          )}

          {/* Public URL preview */}
          {previewUrl && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Public URL preview
              </Label>
              <code className="block text-xs font-mono break-all rounded-md bg-muted/50 px-3 py-2 border">
                {previewUrl}
              </code>
            </div>
          )}

          {/* Paywall */}
          {paywall.show && (
            <Alert className="border-primary/30 bg-primary/5">
              <Crown className="h-4 w-4 text-primary" />
              <AlertDescription>
                <p className="font-medium text-sm">Free tier limit reached</p>
                <p className="text-xs text-muted-foreground mt-1">
                  You've published {paywall.currentCount ?? 1}{" "}
                  {paywall.currentCount === 1 ? "notebook" : "notebooks"} on
                  the free plan (max {paywall.limit ?? 1}). Upgrade to
                  publish unlimited notebooks.
                </p>
                <Button asChild size="sm" className="mt-3">
                  <Link href={ROUTES.PAY}>
                    <Crown className="mr-1.5 h-3.5 w-3.5" />
                    View plans
                  </Link>
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Stats */}
          {!paywall.show && (
            <div className="grid grid-cols-2 gap-2 pt-1 text-xs text-muted-foreground">
              <div className="rounded-md bg-muted/30 px-3 py-1.5">
                <span className="block text-[10px] uppercase tracking-wider">
                  Sections
                </span>
                <span className="text-foreground font-medium">snapshot</span>
              </div>
              <div className="rounded-md bg-muted/30 px-3 py-1.5">
                <span className="block text-[10px] uppercase tracking-wider">
                  Pages
                </span>
                <span className="text-foreground font-medium">snapshot</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isPublishing}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || paywall.show}
          >
            {isPublishing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Globe className="mr-2 h-4 w-4" />
            )}
            {isPublishing
              ? "Publishing…"
              : isRePublish
              ? "Update"
              : "Publish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Sub-components
// ============================================================

function ValidationIcon({
  validation,
}: {
  validation: ValidationState;
}) {
  switch (validation.kind) {
    case "checking":
      return (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      );
    case "valid":
      return <Check className="h-4 w-4 text-green-600" />;
    case "invalid":
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    case "unchanged":
    case "idle":
    default:
      return null;
  }
}

function ValidationMessage({
  validation,
}: {
  validation: ValidationState;
}) {
  switch (validation.kind) {
    case "checking":
      return <>Checking availability…</>;
    case "valid":
      return <>Slug is available</>;
    case "invalid":
      return <>{validation.message}</>;
    case "unchanged":
      return <>Re-publish with the same URL</>;
    case "idle":
    default:
      return <>Lowercase letters, numbers, and hyphens.</>;
  }
}
