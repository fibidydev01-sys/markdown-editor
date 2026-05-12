"use client";

/**
 * Hook for managing notebook feature settings.
 *
 * Settings include theme, sidebar width, default editor mode,
 * onboarding dismissed flag, etc.
 */

import { useCallback, useEffect, useState } from "react";
import * as storage from "@/lib/notebook/storage";
import { DEFAULT_NOTEBOOK_SETTINGS } from "@/constants/notebook";
import type { NotebookSettings } from "@/types/notebook";

interface UseNotebookSettingsReturn {
  settings: NotebookSettings;
  isLoading: boolean;
  updateSettings: (
    updates: Partial<NotebookSettings>
  ) => Promise<NotebookSettings>;
  resetSettings: () => Promise<NotebookSettings>;
}

export function useNotebookSettings(): UseNotebookSettingsReturn {
  const [settings, setSettings] = useState<NotebookSettings>(
    DEFAULT_NOTEBOOK_SETTINGS
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    storage
      .getSettings()
      .then(setSettings)
      .catch((err) => {
        console.error("[useNotebookSettings] load error:", err);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const updateSettings = useCallback(
    async (updates: Partial<NotebookSettings>) => {
      const next = await storage.updateSettings(updates);
      setSettings(next);
      return next;
    },
    []
  );

  const resetSettings = useCallback(async () => {
    const next = await storage.resetSettings();
    setSettings(next);
    return next;
  }, []);

  return {
    settings,
    isLoading,
    updateSettings,
    resetSettings,
  };
}
