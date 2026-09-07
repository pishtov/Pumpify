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
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS workout_logs (
      date TEXT PRIMARY KEY NOT NULL,
      split_id TEXT,
      logged_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS splits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS split_days (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      split_id INTEGER NOT NULL REFERENCES splits(id) ON DELETE CASCADE,
      day_order INTEGER NOT NULL,
      label TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      split_day_id INTEGER NOT NULL REFERENCES split_days(id) ON DELETE CASCADE,
      exercise_order INTEGER NOT NULL,
      name TEXT NOT NULL
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
  // Exclusive transaction: locks out other queries (e.g. the calendar re-loading
  // mid-import) that could otherwise interleave into this transaction and corrupt
  // its native state. Statements must go through `txn`, not `db`, while inside it.
  await db.withExclusiveTransactionAsync(async (txn) => {
    for (const row of rows) {
      await txn.runAsync(
        `INSERT OR REPLACE INTO workout_logs (date, split_id, logged_at) VALUES (?, ?, ?)`,
        [row.date, row.split_id ?? null, row.logged_at]
      );
    }
  });
}

// days is [{ label, exercises: [exerciseName, ...] }, ...], already in the
// order the user built them in — day_order/exercise_order just mirror that.
export async function createSplit(name, days) {
  const db = await getDb();
  // Exclusive transaction — see note in restoreWorkoutLogs above.
  await db.withExclusiveTransactionAsync(async (txn) => {
    const splitResult = await txn.runAsync(
      `INSERT INTO splits (name, created_at) VALUES (?, ?)`,
      [name, new Date().toISOString()]
    );
    const splitId = splitResult.lastInsertRowId;

    for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
      const day = days[dayIndex];
      const dayResult = await txn.runAsync(
        `INSERT INTO split_days (split_id, day_order, label) VALUES (?, ?, ?)`,
        [splitId, dayIndex, day.label]
      );
      const dayId = dayResult.lastInsertRowId;

      for (let exIndex = 0; exIndex < day.exercises.length; exIndex++) {
        await txn.runAsync(
          `INSERT INTO exercises (split_day_id, exercise_order, name) VALUES (?, ?, ?)`,
          [dayId, exIndex, day.exercises[exIndex]]
        );
      }
    }
  });
}

export async function getSplits() {
  const db = await getDb();
  return db.getAllAsync(`SELECT id, name, created_at FROM splits ORDER BY created_at DESC`);
}

// Returns the split's days in order, each with its exercises in order —
// everything the Workouts screen needs to render one split's detail view.
export async function getSplitDetail(splitId) {
  const db = await getDb();
  const days = await db.getAllAsync(
    `SELECT id, day_order, label FROM split_days WHERE split_id = ? ORDER BY day_order`,
    [splitId]
  );
  const exercises = await db.getAllAsync(
    `SELECT id, split_day_id, exercise_order, name FROM exercises
     WHERE split_day_id IN (SELECT id FROM split_days WHERE split_id = ?)
     ORDER BY exercise_order`,
    [splitId]
  );
  return days.map((day) => ({
    ...day,
    exercises: exercises.filter((exercise) => exercise.split_day_id === day.id),
  }));
}

// Cascades to split_days and exercises via the ON DELETE CASCADE foreign keys.
export async function deleteSplit(splitId) {
  const db = await getDb();
  await db.runAsync(`DELETE FROM splits WHERE id = ?`, [splitId]);
}