import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { getDb } from "../db/service";

export interface ExportData {
  version: string;
  exportedAt: string;
  [table: string]: any[];
}

const VERSION = "1.0.0";

export async function exportToJSON(): Promise<string | null> {
  try {
    const db = getDb();
    const tables = [
      "daily_logs",
      "prayer_logs",
      "gym_logs",
      "nutrition_logs",
      "transactions",
      "timetable",
      "habits",
      "habit_logs",
      "journal_entries",
      "goals",
      "budget_categories",
      "dashboard_widgets",
      "prayer_timings",
      "daily_affirmations",
    ];

    const data: Record<string, any[]> = {};
    for (const table of tables) {
      data[table] = await db.getAllAsync(
        `SELECT * FROM ${table} ORDER BY id`
      );
    }

    const exportData: ExportData = {
      version: VERSION,
      exportedAt: new Date().toISOString(),
      ...data,
    };

    return JSON.stringify(exportData, null, 2);
  } catch (e) {
    console.error("Export failed:", e);
    return null;
  }
}

export async function exportToFile(): Promise<boolean> {
  const json = await exportToJSON();
  if (!json) return false;

  const filename = `arete-backup-${new Date().toISOString().split("T")[0]}.json`;
  const fileUri = FileSystem.documentDirectory + filename;

  await FileSystem.writeAsStringAsync(fileUri, json, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      mimeType: "application/json",
      dialogTitle: "Share Arete Backup",
    });
  }

  return true;
}

export async function importFromJSON(
  jsonString: string
): Promise<boolean> {
  try {
    const data: ExportData = JSON.parse(jsonString);
    if (!data.version || !data.dailyLogs) {
      throw new Error("Invalid backup format");
    }

    const db = getDb();

    // Clear existing data
    await db.execAsync("PRAGMA foreign_keys = OFF");
    const tables = [
      "daily_logs",
      "prayer_logs",
      "gym_logs",
      "nutrition_logs",
      "transactions",
      "timetable",
      "habits",
      "habit_logs",
      "journal_entries",
      "goals",
      "budget_categories",
      "dashboard_widgets",
      "prayer_timings",
      "daily_affirmations",
    ];
    for (const table of tables) {
      try {
        await db.execAsync(`DELETE FROM ${table}`);
      } catch {}
    }
    await db.execAsync("PRAGMA foreign_keys = ON");

    // Restore each table
    const restoreTable = async (
      table: string,
      rows: any[]
    ) => {
      if (!rows || rows.length === 0) return;
      const columns = Object.keys(rows[0]).filter(
        (k) => k !== "id"
      );
      const cols = columns.join(", ");
      const placeholders = columns.map(() => "?").join(", ");

      for (const row of rows) {
        const vals = columns.map((c) => row[c]);
        try {
          await db.runAsync(
            `INSERT INTO ${table} (${cols}) VALUES (${placeholders
              .replace(/\?/g, "?")
              .replace(/,/g, ", ")})`,
            ...vals
          );
        } catch (e) {
          console.warn(`Failed to insert into ${table}:`, e);
        }
      }
    };

    // Restore in order (respecting FK constraints)
    const restoreOrder = [
      "daily_logs",
      "prayer_logs",
      "gym_logs",
      "nutrition_logs",
      "transactions",
      "timetable",
      "habits",
      "habit_logs",
      "journal_entries",
      "goals",
      "budget_categories",
      "dashboard_widgets",
      "prayer_timings",
      "daily_affirmations",
    ];

    for (const table of restoreOrder) {
      if ((data as any)[table]) {
        await restoreTable(table, (data as any)[table]);
      }
    }

    return true;
  } catch (e) {
    console.error("Import failed:", e);
    return false;
  }
}

export async function shareBackup(): Promise<boolean> {
  const json = await exportToJSON();
  if (!json) return false;

  const filename = `arete-backup-${new Date().toISOString().split("T")[0]}.json`;
  const fileUri = FileSystem.documentDirectory + filename;

  await FileSystem.writeAsStringAsync(fileUri, json, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      mimeType: "application/json",
      dialogTitle: "Share Arete Backup",
    });
  }

  return true;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}