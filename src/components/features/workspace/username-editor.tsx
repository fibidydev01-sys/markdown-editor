"use client";

/**
 * Username editor — inline editable field with live availability check.
 *
 * Features:
 *   - 500ms debounce on availability check (no DB hammering)
 *   - Visual states: idle, checking, valid+available, invalid, taken
 *   - Cooldown enforcement (disabled if username was changed <30 days ago)
 *   - Save button only enabled when validation passes
 *   - Cancel resets to original value
 *
 * Layout:
 *   ┌─────────────────────────────────────────────┐
 *   │ vibesdoc.com/@ [username-input]  ✓  [Save] │
 *   │ [helper text or error]                      │
 *   └─────────────────────────────────────────────┘
 */

import { useEffect, useRef, useState } from "react";
import {
  Check,
  Loader2,
  AlertCircle,
  Pencil,
  X,
  Lock,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  validateUsernameFormat,
  checkUsernameAvailable,
} from "@/lib/workspace";
import { useWorkspace } from "@/hooks/use-workspace";
import { cn } from "@/lib/utils";

const DEBOUNCE_MS = 500;

type ValidationState =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "valid" }
  | { kind: "invalid"; message: string }
  | { kind: "unchanged" };

interface UsernameEditorProps {
  className?: string;
}

export function UsernameEditor({ className }: UsernameEditorProps) {
  const {
    workspace,
    updateWorkspace,
    isUpdating,
    canChangeUsername,
    nextUsernameChangeDate,
  } = useWorkspace();

  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState("");
  const [validation, setValidation] = useState<ValidationState>({
    kind: "idle",
  });

  // Track latest debounce timer + request to handle race conditions
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  // Reset state when entering edit mode
  useEffect(() => {
    if (isEditing && workspace) {
      setValue(workspace.username);
      setValidation({ kind: "unchanged" });
    }
  }, [isEditing, workspace]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // ── Validation pipeline ──────────────────────────────────

  const runValidation = (candidate: string) => {
    if (!workspace) return;

    const normalized = candidate.trim().toLowerCase();

    // Unchanged from current — no need to validate
    if (normalized === workspace.username) {
      setValidation({ kind: "unchanged" });
      return;
    }

    // Format check (instant)
    const formatCheck = validateUsernameFormat(normalized);
    if (!formatCheck.isValid) {
      setValidation({
        kind: "invalid",
        message: formatCheck.error ?? "Invalid username",
      });
      return;
    }

    // Format OK → check availability with debounce
    setValidation({ kind: "checking" });

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const reqId = ++requestIdRef.current;
      try {
        const isAvailable = await checkUsernameAvailable(
          normalized,
          workspace.user_id
        );

        // Stale response check — discard if newer request fired
        if (reqId !== requestIdRef.current) return;

        if (isAvailable) {
          setValidation({ kind: "valid" });
        } else {
          setValidation({
            kind: "invalid",
            message: "This username is already taken",
          });
        }
      } catch (err) {
        if (reqId !== requestIdRef.current) return;
        console.error("[UsernameEditor] availability check error:", err);
        setValidation({
          kind: "invalid",
          message: "Couldn't check availability — try again",
        });
      }
    }, DEBOUNCE_MS);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setValue(next);
    runValidation(next);
  };

  // ── Save / Cancel ─────────────────────────────────────────

  const canSave =
    validation.kind === "valid" && !isUpdating;

  const handleSave = async () => {
    if (!canSave || !workspace) return;
    const normalized = value.trim().toLowerCase();

    try {
      await updateWorkspace({ username: normalized });
      toast.success("Username updated");
      setIsEditing(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update username";
      toast.error(message);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setValue("");
    setValidation({ kind: "idle" });
    if (debounceRef.current) clearTimeout(debounceRef.current);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && canSave) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  // ── Render ────────────────────────────────────────────────

  if (!workspace) {
    return (
      <div
        className={cn(
          "rounded-lg border border-dashed p-4 text-sm text-muted-foreground",
          className
        )}
      >
        Loading workspace…
      </div>
    );
  }

  // Locked state — within 30-day cooldown
  const isLocked = !canChangeUsername && !isEditing;

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor="username-input" className="text-sm font-medium">
        Username
      </Label>

      {!isEditing ? (
        // ─── Display mode ───
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-1.5 rounded-md border bg-muted/30 px-3 py-2 font-mono text-sm">
            <span className="text-muted-foreground select-none">@</span>
            <span className="font-medium">{workspace.username}</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            disabled={isLocked}
          >
            {isLocked ? (
              <>
                <Lock className="mr-1.5 h-3.5 w-3.5" />
                Locked
              </>
            ) : (
              <>
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                Edit
              </>
            )}
          </Button>
        </div>
      ) : (
        // ─── Edit mode ───
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <div className="flex items-center rounded-md border focus-within:ring-2 focus-within:ring-ring focus-within:border-ring transition-shadow">
              <span className="pl-3 pr-1 text-muted-foreground font-mono text-sm select-none">
                @
              </span>
              <Input
                id="username-input"
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                disabled={isUpdating}
                autoFocus
                autoComplete="off"
                spellCheck={false}
                className="border-0 focus-visible:ring-0 font-mono text-sm pl-0"
                placeholder="your-username"
                maxLength={30}
              />
              <div className="pr-3 flex items-center">
                <ValidationIcon validation={validation} />
              </div>
            </div>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={!canSave}
          >
            {isUpdating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              "Save"
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            disabled={isUpdating}
            className="h-8 w-8"
            aria-label="Cancel"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Helper / error text */}
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
        {isEditing ? (
          <ValidationMessage validation={validation} />
        ) : isLocked && nextUsernameChangeDate ? (
          <>
            Next change available on{" "}
            <strong>
              {nextUsernameChangeDate.toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </strong>
          </>
        ) : (
          <>3–30 chars, lowercase, letters, numbers, and hyphens only.</>
        )}
      </p>
    </div>
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
      return <>Username is available</>;
    case "invalid":
      return <>{validation.message}</>;
    case "unchanged":
      return <>This is your current username</>;
    case "idle":
    default:
      return <>3–30 chars, lowercase, letters, numbers, and hyphens only.</>;
  }
}
