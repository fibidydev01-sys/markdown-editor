/**
 * Settings CRUD (single record with id='app').
 */

import { getDB } from "./db";
import { DEFAULT_NOTEBOOK_SETTINGS } from "@/constants/notebook";
import type { NotebookSettings } from "@/types/notebook";

const SETTINGS_ID = "app";

/**
 * Get app settings. Returns defaults if no settings record exists.
 */
export async function getSettings(): Promise<NotebookSettings> {
  const db = await getDB();
  const settings = await db.get("settings", SETTINGS_ID);

  if (!settings) return DEFAULT_NOTEBOOK_SETTINGS;

  // Strip the `id` field used as keyPath
  const { id: _id, ...rest } = settings;
  return rest as NotebookSettings;
}

/**
 * Update app settings (partial update).
 */
export async function updateSettings(
  updates: Partial<NotebookSettings>
): Promise<NotebookSettings> {
  const db = await getDB();
  const current = await getSettings();
  const updated: NotebookSettings = { ...current, ...updates };

  await db.put("settings", { ...updated, id: SETTINGS_ID });
  return updated;
}

/**
 * Reset settings to defaults.
 */
export async function resetSettings(): Promise<NotebookSettings> {
  const db = await getDB();
  await db.put("settings", { ...DEFAULT_NOTEBOOK_SETTINGS, id: SETTINGS_ID });
  return DEFAULT_NOTEBOOK_SETTINGS;
}
