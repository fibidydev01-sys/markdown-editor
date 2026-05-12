"use client";

/**
 * Workspace info card — shows the public URL preview + display name editor.
 *
 * The username editor is rendered separately (UsernameEditor component) so
 * this card focuses on:
 *   - Public URL preview (with copy button)
 *   - Display name editing
 *   - Workspace metadata (created date)
 */

import { useEffect, useState } from "react";
import { Globe, Copy, Check, ExternalLink, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useWorkspace } from "@/hooks/use-workspace";
import { DISPLAY_NAME_LIMITS } from "@/types/workspace";
import { cn } from "@/lib/utils";

interface WorkspaceInfoCardProps {
  className?: string;
}

export function WorkspaceInfoCard({ className }: WorkspaceInfoCardProps) {
  const {
    workspace,
    publicUrl,
    updateWorkspace,
    isUpdating,
  } = useWorkspace();

  const [displayName, setDisplayName] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync local state with workspace
  useEffect(() => {
    if (workspace) {
      setDisplayName(workspace.display_name ?? "");
      setIsDirty(false);
    }
  }, [workspace?.display_name]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDisplayNameChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const next = e.target.value;
    setDisplayName(next);
    setIsDirty(next !== (workspace?.display_name ?? ""));
  };

  const handleSaveDisplayName = async () => {
    if (!isDirty || !workspace) return;
    try {
      await updateWorkspace({
        display_name: displayName.trim() || null,
      });
      toast.success("Display name updated");
      setIsDirty(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update";
      toast.error(message);
    }
  };

  const handleCopyUrl = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast.success("URL copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy URL");
    }
  };

  // ── Render ────────────────────────────────────────────────

  if (!workspace) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
          Loading workspace…
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Globe className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-base">Public workspace</CardTitle>
            <CardDescription className="text-xs">
              This is where your published notebooks live
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Public URL preview */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Public URL</Label>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-md border bg-muted/30 px-3 py-2 text-sm font-mono truncate">
              {publicUrl}
            </code>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleCopyUrl}
              className="h-9 w-9 flex-shrink-0"
              aria-label="Copy URL"
              title="Copy URL"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              asChild
              className="h-9 w-9 flex-shrink-0"
              aria-label="Open in new tab"
              title="Open"
            >
              <a
                href={publicUrl ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Visitors will see your published notebooks here.
          </p>
        </div>

        {/* Display name */}
        <div className="space-y-2">
          <Label htmlFor="display-name-input" className="text-sm font-medium">
            Display name{" "}
            <span className="text-muted-foreground font-normal">
              (optional)
            </span>
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="display-name-input"
              value={displayName}
              onChange={handleDisplayNameChange}
              placeholder="Your name or brand"
              maxLength={DISPLAY_NAME_LIMITS.MAX_LENGTH}
              disabled={isUpdating}
              className="flex-1"
            />
            {isDirty && (
              <Button
                type="button"
                size="sm"
                onClick={handleSaveDisplayName}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  "Save"
                )}
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Shown on your workspace landing page. Leave empty to use just the
            username.
          </p>
        </div>

        {/* Created date */}
        <div className="pt-3 border-t border-border/50 text-xs text-muted-foreground">
          Workspace created on{" "}
          <strong className="text-foreground">
            {new Date(workspace.created_at).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </strong>
        </div>
      </CardContent>
    </Card>
  );
}
