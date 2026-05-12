/**
 * Zod validators for notebook input forms.
 *
 * Used by Phase B-G UI forms (create notebook, create section, etc.).
 */

import { z } from "zod";
import { NOTEBOOK_LIMITS } from "@/constants/notebook";

// ============================================================
// Notebook
// ============================================================

export const createNotebookSchema = z.object({
  name: z
    .string()
    .min(1, "Notebook name is required")
    .max(
      NOTEBOOK_LIMITS.MAX_NOTEBOOK_NAME_LENGTH,
      `Name must be ${NOTEBOOK_LIMITS.MAX_NOTEBOOK_NAME_LENGTH} characters or less`
    )
    .trim(),
  description: z
    .string()
    .max(
      NOTEBOOK_LIMITS.MAX_DESCRIPTION_LENGTH,
      `Description must be ${NOTEBOOK_LIMITS.MAX_DESCRIPTION_LENGTH} characters or less`
    )
    .optional()
    .nullable(),
  icon: z.string().max(50).optional().nullable(),
  tagIds: z.array(z.string()).optional(),
});

export const updateNotebookSchema = createNotebookSchema.partial();

export type CreateNotebookFormData = z.infer<typeof createNotebookSchema>;
export type UpdateNotebookFormData = z.infer<typeof updateNotebookSchema>;

// ============================================================
// Section
// ============================================================

export const createSectionSchema = z.object({
  name: z
    .string()
    .min(1, "Section name is required")
    .max(
      NOTEBOOK_LIMITS.MAX_SECTION_NAME_LENGTH,
      `Name must be ${NOTEBOOK_LIMITS.MAX_SECTION_NAME_LENGTH} characters or less`
    )
    .trim(),
  parentId: z.string().nullable().optional(),
});

export const updateSectionSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(NOTEBOOK_LIMITS.MAX_SECTION_NAME_LENGTH)
    .trim()
    .optional(),
  parentId: z.string().nullable().optional(),
  order: z.number().optional(),
});

export type CreateSectionFormData = z.infer<typeof createSectionSchema>;
export type UpdateSectionFormData = z.infer<typeof updateSectionSchema>;

// ============================================================
// Page
// ============================================================

export const createPageSchema = z.object({
  title: z
    .string()
    .max(
      NOTEBOOK_LIMITS.MAX_PAGE_TITLE_LENGTH,
      `Title must be ${NOTEBOOK_LIMITS.MAX_PAGE_TITLE_LENGTH} characters or less`
    )
    .trim()
    .optional(),
  content: z.string().optional(),
  sectionId: z.string().nullable().optional(),
});

export const updatePageSchema = z.object({
  title: z
    .string()
    .max(NOTEBOOK_LIMITS.MAX_PAGE_TITLE_LENGTH)
    .trim()
    .optional(),
  content: z.string().optional(),
  sectionId: z.string().nullable().optional(),
  order: z.number().optional(),
});

export type CreatePageFormData = z.infer<typeof createPageSchema>;
export type UpdatePageFormData = z.infer<typeof updatePageSchema>;

// ============================================================
// Tag
// ============================================================

export const createTagSchema = z.object({
  name: z
    .string()
    .min(1, "Tag name is required")
    .max(
      NOTEBOOK_LIMITS.MAX_TAG_NAME_LENGTH,
      `Tag name must be ${NOTEBOOK_LIMITS.MAX_TAG_NAME_LENGTH} characters or less`
    )
    .trim(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a valid hex code")
    .optional(),
});

export const updateTagSchema = createTagSchema.partial();

export type CreateTagFormData = z.infer<typeof createTagSchema>;
export type UpdateTagFormData = z.infer<typeof updateTagSchema>;

// ============================================================
// Settings
// ============================================================

export const updateSettingsSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).optional(),
  onboardingDismissed: z.boolean().optional(),
  lastOpenedNotebookId: z.string().nullable().optional(),
  lastOpenedPageId: z.string().nullable().optional(),
  showWordCount: z.boolean().optional(),
  defaultEditorMode: z.enum(["visual", "source"]).optional(),
  sidebarWidth: z
    .number()
    .min(NOTEBOOK_LIMITS.MIN_SIDEBAR_WIDTH)
    .max(NOTEBOOK_LIMITS.MAX_SIDEBAR_WIDTH)
    .optional(),
});

export type UpdateSettingsFormData = z.infer<typeof updateSettingsSchema>;
