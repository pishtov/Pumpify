import * as SQLite from 'expo-sqlite';

const DB_NAME = 'pumpify.db';

let dbInstance = null;

async function getDb() {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
  }
  return dbInstance;
}

// Call this once on app startup, before any screen tries to read/write.
// Creates tables if they don't exist yet — safe to call every launch.
export async function initDatabase() {
  const db = await getDb();
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS workout_logs (
      date TEXT PRIMARY KEY NOT NULL,
      split_id TEXT,
      logged_at TEXT NOT NULL
    );
  `);
}

// date is a 'YYYY-MM-DD' string. splitId is optional for now since splits
// don't exist yet — pass null until that feature exists.
export async function markWorkoutDone(date, splitId = null) {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO workout_logs (date, split_id, logged_at) VALUES (?, ?, ?)`,
    [date, splitId, new Date().toISOString()]
  );
}

export async function unmarkWorkout(date) {
  const db = await getDb();
  await db.runAsync(`DELETE FROM workout_logs WHERE date = ?`, [date]);
}

// Returns an array of 'YYYY-MM-DD' strings for every completed day between
// startDate and endDate (inclusive). This is what the calendar will call
// once per visible month, instead of guessing with a placeholder function.
export async function getWorkoutDaysInRange(startDate, endDate) {
  const db = await getDb();
  const rows = await db.getAllAsync(
    `SELECT date FROM workout_logs WHERE date >= ? AND date <= ? ORDER BY date`,
    [startDate, endDate]
  );
  return rows.map((row) => row.date);
}

// Returns every row in the table, unfiltered — used by the export feature to
// back up the full history, not just what the visible calendar range needs.
export async function getAllWorkoutLogs() {
  const db = await getDb();
  return db.getAllAsync(`SELECT date, split_id, logged_at FROM workout_logs ORDER BY date`);
}

// Bulk-inserts rows from an imported backup file. Uses INSERT OR REPLACE so
// re-importing the same backup twice is safe (no duplicate-key errors), and
// wraps everything in one transaction so a mid-import crash can't leave the
// database half-restored.
export async function restoreWorkoutLogs(rows) {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    for (const row of rows) {
      await db.runAsync(
        `INSERT OR REPLACE INTO workout_logs (date, split_id, logged_at) VALUES (?, ?, ?)`,
        [row.date, row.split_id ?? null, row.logged_at]
      );
    }
  });
}