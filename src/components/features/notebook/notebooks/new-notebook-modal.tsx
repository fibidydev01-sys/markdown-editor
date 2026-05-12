"use client";

/**
 * New Notebook Modal — create form with name, description, icon, tags.
 *
 * Used from:
 *   - Notebooks dashboard ("New Notebook" button)
 *   - Empty state
 *
 * For a more elaborate full-page create flow (with ZIP import option),
 * see /notebooks/new page.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, BookOpen } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  createNotebookSchema,
  type CreateNotebookFormData,
} from "@/lib/notebook/validators";
import { useNotebooks } from "@/hooks/notebook/use-notebooks";
import { ROUTES, DEFAULT_NOTEBOOK_ICON } from "@/constants";
import { cn } from "@/lib/utils";

/**
 * Curated icon shortcuts — emojis that fit "knowledge / notebook" vibe.
 */
const ICON_OPTIONS = [
  "📓", "📔", "📕", "📗", "📘", "📙",
  "📚", "📖", "📝", "🗒️", "🗂️", "📂",
  "💡", "🧠", "🎯", "⚡", "🔥", "✨",
  "🚀", "🌟", "🎨", "🛠️", "🔬", "🧪",
] as const;

interface NewNotebookModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after successful creation. If not provided, navigates to the new notebook. */
  onCreated?: (notebookId: string) => void;
}

export function NewNotebookModal({
  open,
  onOpenChange,
  onCreated,
}: NewNotebookModalProps) {
  const router = useRouter();
  const { createNotebook } = useNotebooks();
  const [selectedIcon, setSelectedIcon] = useState<string>(DEFAULT_NOTEBOOK_ICON);

  const form = useForm<CreateNotebookFormData>({
    resolver: zodResolver(createNotebookSchema),
    defaultValues: {
      name: "",
      description: "",
      icon: DEFAULT_NOTEBOOK_ICON,
      tagIds: [],
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  const onSubmit = async (data: CreateNotebookFormData) => {
    try {
      const nb = await createNotebook({
        name: data.name,
        description: data.description?.trim() || null,
        icon: selectedIcon,
        tagIds: data.tagIds ?? [],
      });

      toast.success(`Notebook "${nb.name}" created`);

      // Reset form
      form.reset();
      setSelectedIcon(DEFAULT_NOTEBOOK_ICON);
      onOpenChange(false);

      // Navigate or callback
      if (onCreated) {
        onCreated(nb.id);
      } else {
        router.push(ROUTES.NOTEBOOK_DETAIL(nb.id));
      }
    } catch (err) {
      console.error("[NewNotebookModal] create error:", err);
      toast.error("Failed to create notebook");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Create notebook</DialogTitle>
              <DialogDescription className="text-xs">
                A notebook is a workspace for related docs
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 pt-2"
          >
            {/* Icon picker */}
            <FormItem>
              <FormLabel>Icon</FormLabel>
              <div className="grid grid-cols-8 gap-1.5">
                {ICON_OPTIONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setSelectedIcon(icon)}
                    className={cn(
                      "h-9 rounded-md text-lg flex items-center justify-center border transition-colors",
                      selectedIcon === icon
                        ? "border-primary bg-primary/10 ring-1 ring-primary"
                        : "border-transparent hover:bg-muted"
                    )}
                    aria-label={`Use icon ${icon}`}
                    aria-pressed={selectedIcon === icon}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </FormItem>

            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="My Docs"
                      autoFocus
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Description{" "}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What's this notebook for?"
                      rows={2}
                      disabled={isSubmitting}
                      className="resize-none"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create notebook
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
