/**
 * IndexedDB setup for the notebook feature.
 *
 * Database: notebook-db (v1)
 * Stores:
 *   - notebooks    (key: id, indexes: by-updated)
 *   - sections     (key: id, indexes: by-notebook, by-parent)
 *   - pages        (key: id, indexes: by-notebook, by-section, by-updated)
 *   - tags         (key: id)
 *   - settings     (key: id, single record with id='app')
 *
 * Uses `idb` for promise-based API.
 */

import { openDB, type IDBPDatabase, type DBSchema } from "idb";
import {
  NOTEBOOK_DB_NAME,
  NOTEBOOK_DB_VERSION,
} from "@/constants/notebook";
import type {
  Notebook,
  NotebookPage,
  NotebookSection,
  NotebookSettings,
  NotebookTag,
} from "@/types/notebook";

// ============================================================
// Schema
// ============================================================

export interface NotebookDB extends DBSchema {
  notebooks: {
    key: string;
    value: Notebook;
    indexes: {
      "by-updated": number;
    };
  };
  sections: {
    key: string;
    value: NotebookSection;
    indexes: {
      "by-notebook": string;
      "by-parent": string;
    };
  };
  pages: {
    key: string;
    value: NotebookPage;
    indexes: {
      "by-notebook": string;
      "by-section": string;
      "by-updated": number;
    };
  };
  tags: {
    key: string;
    value: NotebookTag;
  };
  settings: {
    key: string;
    value: NotebookSettings & { id: string };
  };
}

// ============================================================
// Singleton DB instance
// ============================================================

let dbPromise: Promise<IDBPDatabase<NotebookDB>> | null = null;

/**
 * Get the IndexedDB instance (singleton).
 * Creates the DB and stores on first call.
 */
export function getDB(): Promise<IDBPDatabase<NotebookDB>> {
  if (typeof window === "undefined") {
    throw new Error(
      "[notebook/db] IndexedDB is not available on the server. " +
        "Call this only from client components or 'use client' boundaries."
    );
  }

  if (!dbPromise) {
    dbPromise = openDB<NotebookDB>(NOTEBOOK_DB_NAME, NOTEBOOK_DB_VERSION, {
      upgrade(db) {
        // notebooks
        const notebookStore = db.createObjectStore("notebooks", {
          keyPath: "id",
        });
        notebookStore.createIndex("by-updated", "updatedAt");

        // sections
        const sectionStore = db.createObjectStore("sections", {
          keyPath: "id",
        });
        sectionStore.createIndex("by-notebook", "notebookId");
        sectionStore.createIndex("by-parent", "parentId");

        // pages
        const pageStore = db.createObjectStore("pages", { keyPath: "id" });
        pageStore.createIndex("by-notebook", "notebookId");
        pageStore.createIndex("by-section", "sectionId");
        pageStore.createIndex("by-updated", "updatedAt");

        // tags
        db.createObjectStore("tags", { keyPath: "id" });

        // settings (single record)
        db.createObjectStore("settings", { keyPath: "id" });
      },
    });
  }

  return dbPromise;
}

/**
 * Delete the entire database (for testing or nuclear reset).
 * Use with extreme caution.
 */
export async function deleteDB(): Promise<void> {
  if (typeof window === "undefined") return;

  // Close existing connection first
  if (dbPromise) {
    const db = await dbPromise;
    db.close();
    dbPromise = null;
  }

  const { deleteDB: idbDeleteDB } = await import("idb");
  await idbDeleteDB(NOTEBOOK_DB_NAME);
}

/**
 * Clear all data from all stores (without deleting the DB structure).
 */
export async function clearAllData(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(
    ["notebooks", "sections", "pages", "tags", "settings"],
    "readwrite"
  );
  await Promise.all([
    tx.objectStore("notebooks").clear(),
    tx.objectStore("sections").clear(),
    tx.objectStore("pages").clear(),
    tx.objectStore("tags").clear(),
    tx.objectStore("settings").clear(),
    tx.done,
  ]);
}
