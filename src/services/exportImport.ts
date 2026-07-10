/**
 * Export / Import — backup & restore the entire SQLite database as JSON.
 *
 * What this module does:
 *   • exportToJSON()  — read every seedable + AI table, return JSON string
 *   • exportToFile()  — write that JSON to a file in the app sandbox and
 *                       trigger the system share sheet (so the user can
 *                       AirDrop / email / save to Files / Drive)
 *   • importFromJSON()— wipe all known tables and restore from a JSON string
 *
 * Round-trip guarantees:
 *   • All IDs are preserved on import (INSERT OR REPLACE with explicit ids).
 *   • Foreign keys remain valid because parent rows are inserted before
 *     children, with their original primary keys intact.
 *   • The export payload includes a version stamp so future migrations can
 *     detect incompatible backups.
 *
 * What is NOT included (intentionally):
 *   • The `ai_providers` table is exported but contains user API keys —
 *     import will restore them. If a user wants a clean re-seed they
 *     should use Settings → Test Data → Delete Your Data first.
 *
 * Usage:
 *   import { exportToFile, importFromJSON, shareBackup } from '@/services/exportImport';
 */

import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { initDatabase, getDb } from "../db/service";
import { getDocumentAsync } from "expo-document-picker";
import { readAsStringAsync, EncodingType } from "expo-file-system/legacy";

// ─── Types ─────────────────────────────────────────────────────────────────

interface ExportMeta {
  version: string;
  exportedAt: string;
  appName: string;
}

export interface ExportPayload {
  meta: ExportMeta;
  tables: Record<string, any[]>;
}

export interface ImportResult {
  success: boolean;
  imported: Record<string, number>;
  totalRows: number;
  duration_ms: number;
  error?: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────

const APP_VERSION = "1.1.0";
const APP_NAME = "Arete";

/**
 * Every table the app cares about, listed in INSERT ORDER.
 * Parents (no FK to other tables in this list) come first; children last.
 * This is the single source of truth used by both export and import.
 *
 * FK relationships within this list:
 *   habit_logs        → habits
 *   ai_program_items  → ai_programs
 */
const TABLES: readonly string[] = [
  // ── Parents (no FK dependencies) ──
  "habits",
  "budget_categories",
  "daily_affirmations",
  "dashboard_widgets",
  "daily_logs",
  "transactions",
  "goals",
  "journal_entries",
  "nutrition_logs",
  "gym_logs",
  "prayer_logs",
  "prayer_timings",
  "timetable",
  "ai_providers",
  "focus_sessions",
  "ai_programs",
  // ── Children (FK references above) ──
  "habit_logs",
  "ai_program_items",
];

/**
 * Same list in REVERSE — used to clear tables before import so children
 * are deleted before their parents.
 */
const TABLES_REVERSE: readonly string[] = [...TABLES].reverse();

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Read every tracked table from SQLite into a plain object. */
async function readAllTables(): Promise<Record<string, any[]>> {
  const db = getDb();
  const out: Record<string, any[]> = {};
  for (const table of TABLES) {
    try {
      out[table] = await db.getAllAsync(`SELECT * FROM ${table} ORDER BY id`);
    } catch (e) {
      console.warn(`[exportImport] failed to read ${table}:`, e);
      out[table] = [];
    }
  }
  return out;
}

/** Detect whether a parsed JSON value looks like one of our backups. */
function isExportPayload(value: unknown): value is ExportPayload {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (!v.meta || typeof v.meta !== "object") return false;
  if (!v.tables || typeof v.tables !== "object") return false;
  const meta = v.meta as Record<string, unknown>;
  return typeof meta.version === "string" && typeof meta.exportedAt === "string";
}

/** Format a byte count for display. */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Export ────────────────────────────────────────────────────────────────

/**
 * Build the JSON string that represents a full database backup.
 * Returns null on failure (caller can show an Alert).
 */
export async function exportToJSON(): Promise<string | null> {
  try {
    await initDatabase();
    const tables = await readAllTables();
    const payload: ExportPayload = {
      meta: {
        version: APP_VERSION,
        exportedAt: new Date().toISOString(),
        appName: APP_NAME,
      },
      tables,
    };
    return JSON.stringify(payload, null, 2);
  } catch (e) {
    console.error("[exportImport] exportToJSON failed:", e);
    return null;
  }
}

/**
 * Build the export JSON, write it to a file, and trigger the system
 * share sheet. Returns true if the file was successfully written.
 *
 * Note: returning true does NOT mean the user actually shared the file —
 * it just means the share dialog opened. If `Sharing.isAvailableAsync()`
 * is false (e.g. on web), the file is still written but not shared.
 */
export async function exportToFile(): Promise<boolean> {
  const json = await exportToJSON();
  if (!json) return false;

  const filename = `arete-backup-${new Date().toISOString().split("T")[0]}.json`;
  const baseDir = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;
  if (!baseDir) return false;
  const fileUri = baseDir + filename;

  try {
    await FileSystem.writeAsStringAsync(fileUri, json, {
      encoding: FileSystem.EncodingType.UTF8,
    });
  } catch (e) {
    console.error("[exportImport] writeAsStringAsync failed:", e);
    return false;
  }

  if (await Sharing.isAvailableAsync()) {
    try {
      await Sharing.shareAsync(fileUri, {
        mimeType: "application/json",
        dialogTitle: "Share Arete Backup",
      });
    } catch (e) {
      // User cancelled share dialog — that's fine, file is still written.
      console.log("[exportImport] share dismissed:", e);
    }
  }

  return true;
}

/**
 * Backwards-compatible alias used by SettingsScreen.
 * Equivalent to `exportToFile`.
 */
export async function shareBackup(): Promise<boolean> {
  return exportToFile();
}

// ─── Import ────────────────────────────────────────────────────────────────

/**
 * Restore the database from a JSON string produced by `exportToJSON`.
 *
 * Behavior:
 *   • Validates the payload shape (must have meta + tables).
 *   • Clears every known table in reverse-FK order.
 *   • Re-inserts every row with its original id (INSERT OR REPLACE).
 *   • Parents are inserted before children so foreign keys remain valid.
 *   • Foreign key pragma is re-enabled afterwards and a check is run.
 *
 * The caller is responsible for confirming with the user before calling
 * this — it is destructive.
 */
export async function importFromJSON(jsonString: string): Promise<ImportResult> {
  const t0 = Date.now();
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch (e) {
    return {
      success: false,
      imported: {},
      totalRows: 0,
      duration_ms: Date.now() - t0,
      error: "Invalid JSON — could not parse the input.",
    };
  }

  if (!isExportPayload(parsed)) {
    return {
      success: false,
      imported: {},
      totalRows: 0,
      duration_ms: Date.now() - t0,
      error:
        "Not a recognized Arete backup. Expected { meta, tables } format.",
    };
  }

  await initDatabase();
  const db = getDb();

  try {
    // ── Step 1: Disable FKs + clear all tables (children first) ──
    await db.execAsync("PRAGMA foreign_keys = OFF");
    for (const table of TABLES_REVERSE) {
      try {
        await db.execAsync(`DELETE FROM ${table}`);
      } catch (e) {
        console.warn(`[import] failed to clear ${table}:`, e);
      }
    }

    // ── Step 2: Restore rows (parents first), preserving ids ──
    const imported: Record<string, number> = {};
    let totalRows = 0;

    for (const table of TABLES) {
      const rows = (parsed.tables as Record<string, any[]>)[table];
      if (!Array.isArray(rows) || rows.length === 0) {
        imported[table] = 0;
        continue;
      }

      const columns = Object.keys(rows[0]);
      const colsSql = columns.join(", ");
      const placeholders = columns.map(() => "?").join(", ");

      let count = 0;
      for (const row of rows) {
        const vals = columns.map((c) => row[c]);
        try {
          await db.runAsync(
            `INSERT OR REPLACE INTO ${table} (${colsSql}) VALUES (${placeholders})`,
            ...vals
          );
          count++;
        } catch (e) {
          console.warn(`[import] row insert failed in ${table}:`, e, row);
        }
      }
      imported[table] = count;
      totalRows += count;
    }

    // ── Step 3: Re-enable FKs and verify integrity ──
    await db.execAsync("PRAGMA foreign_keys = ON");
    const violations = await db.getAllAsync<any>("PRAGMA foreign_key_check");
    if (violations.length > 0) {
      console.warn(
        "[import] foreign key violations after import:",
        violations
      );
    }

    return {
      success: true,
      imported,
      totalRows,
      duration_ms: Date.now() - t0,
    };
  } catch (e) {
    console.error("[exportImport] importFromJSON failed:", e);
    return {
      success: false,
      imported: {},
      totalRows: 0,
      duration_ms: Date.now() - t0,
      error: (e as Error).message,
    };
  }
}

/**
 * Format an ImportResult for display in an Alert.
 */
export function formatImportResult(result: ImportResult): string {
  if (!result.success) {
    return result.error ?? "Import failed.";
  }
  const lines: string[] = [];
  lines.push(
    `Restored ${result.totalRows} rows in ${result.duration_ms}ms`
  );
  // Only show tables that actually had rows
  for (const [table, count] of Object.entries(result.imported)) {
    if (count > 0) lines.push(`  ${table}: ${count}`);
  }
  return lines.join("\n");
}

// ─── File Import ────────────────────────────────────────────────────────────

/**
 * Open the system document picker for a `.json` file, read it,
 * and restore the database from its contents. Returns an ImportResult
 * (same shape as importFromJSON).
 *
 * If the user cancels the picker, the result has `{ success: false }`
 * but no error message (the user wasn't committing to anything).
 */
export async function importFromFile(): Promise<ImportResult> {
  const t0 = Date.now();
  try {
    const result = await getDocumentAsync({
      type: ["application/json"],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return {
        success: false,
        imported: {},
        totalRows: 0,
        duration_ms: Date.now() - t0,
        error: "No file selected.",
      };
    }

    const file = result.assets[0];
    const jsonString = await readAsStringAsync(file.uri, {
      encoding: EncodingType.UTF8,
    });

    return await importFromJSON(jsonString);
  } catch (e) {
    console.error("[exportImport] importFromFile failed:", e);
    return {
      success: false,
      imported: {},
      totalRows: 0,
      duration_ms: Date.now() - t0,
      error: (e as Error).message,
    };
  }
}
