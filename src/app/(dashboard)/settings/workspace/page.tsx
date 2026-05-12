"use client";

/**
 * /settings/workspace — workspace settings page.
 *
 * Layout:
 *   - Header with description
 *   - WorkspaceInfoCard (public URL + display name)
 *   - UsernameEditor card (separate — it's the most important setting)
 *   - "What's a workspace?" explainer
 */

import Link from "next/link";
import { ArrowLeft, BookOpen, Globe, AtSign, Info } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  UsernameEditor,
  WorkspaceInfoCard,
} from "@/components/features/workspace";
import { useWorkspace } from "@/hooks/use-workspace";
import { FullPageLoader } from "@/components/shared";
import { ROUTES } from "@/constants";

export default function WorkspaceSettingsPage() {
  const { workspace, isLoading, hasWorkspace } = useWorkspace();

  if (isLoading) {
    return <FullPageLoader text="Loading workspace…" />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back link */}
      <Link
        href={ROUTES.SETTINGS}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to settings
      </Link>

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Globe className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Workspace</h1>
            <p className="text-sm text-muted-foreground">
              Manage your public docs URL and display name
            </p>
          </div>
        </div>
      </div>

      {/* No workspace yet (edge case — user from before Phase H) */}
      {!hasWorkspace && (
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Your workspace hasn't been created yet. This may happen if your
            account was created before this feature was enabled. Try logging
            out and back in, or contact support if the issue persists.
          </AlertDescription>
        </Alert>
      )}

      {hasWorkspace && workspace && (
        <>
          {/* Username card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center flex-shrink-0">
                  <AtSign className="h-5 w-5 text-blue-600 dark:text-blue-500" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-base">Username</CardTitle>
                  <CardDescription className="text-xs">
                    Your unique identifier — used in your public URL
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <UsernameEditor />
            </CardContent>
          </Card>

          {/* Public URL + display name card */}
          <WorkspaceInfoCard />

          {/* Explainer */}
          <Card className="border-dashed bg-muted/30">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <BookOpen className="h-5 w-5 flex-shrink-0 mt-0.5 text-muted-foreground" />
                <div className="space-y-2 text-sm">
                  <p className="font-medium">What's a workspace?</p>
                  <p className="text-muted-foreground leading-relaxed">
                    Your workspace is the container for all your published
                    notebooks. When you publish a notebook (coming in the next
                    update), it becomes accessible at{" "}
                    <code className="text-xs bg-background px-1 py-0.5 rounded font-mono">
                      /@{workspace.username}/notebook-slug
                    </code>
                    . Visitors see your docs site directly — not a generic
                    platform page.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
