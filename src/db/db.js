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
  await db.execAsync(`PRAGMA journal_mode = WAL;`);

  // One-time migration away from the old splits/workout_logs schema.
  const legacyTables = await db.getAllAsync(
    `SELECT name FROM sqlite_master WHERE type = 'table'
     AND name IN ('splits', 'split_days', 'exercises', 'workout_logs')`
  );
  if (legacyTables.length > 0) {
    await db.execAsync(`
      DROP TABLE IF EXISTS exercises;
      DROP TABLE IF EXISTS split_days;
      DROP TABLE IF EXISTS splits;
      DROP TABLE IF EXISTS workout_logs;
    `);
  }

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS session_exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      exercise_order INTEGER NOT NULL,
      name TEXT NOT NULL,
      logged_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_session_exercises_date ON session_exercises(date);
  `);
}

// Returns an array of 'YYYY-MM-DD' strings for every date with at least one
// logged exercise between startDate and endDate (inclusive) — what the
// calendar calls once per visible month to know which days to light up.
export async function getWorkoutDaysInRange(startDate, endDate) {
  const db = await getDb();
  const rows = await db.getAllAsync(
    `SELECT DISTINCT date FROM session_exercises WHERE date >= ? AND date <= ? ORDER BY date`,
    [startDate, endDate]
  );
  return rows.map((row) => row.date);
}

// date is a 'YYYY-MM-DD' string. Returns the exercises logged for that date,
// in the order they were added.
export async function getSessionExercises(date) {
  const db = await getDb();
  return db.getAllAsync(
    `SELECT id, name FROM session_exercises WHERE date = ? ORDER BY exercise_order`,
    [date]
  );
}

// names is an array of exercise names (from the picker's catalog checks
// and/or custom entries), appended in order after whatever's already logged.
export async function addExercises(date, names) {
  if (names.length === 0) return;
  const db = await getDb();
  // Exclusive transaction — see note in copyPreviousWorkout below.
  await db.withExclusiveTransactionAsync(async (txn) => {
    const countRow = await txn.getFirstAsync(
      `SELECT COUNT(*) AS count FROM session_exercises WHERE date = ?`,
      [date]
    );
    let order = countRow.count;
    const now = new Date().toISOString();
    for (const name of names) {
      await txn.runAsync(
        `INSERT INTO session_exercises (date, exercise_order, name, logged_at) VALUES (?, ?, ?, ?)`,
        [date, order, name, now]
      );
      order++;
    }
  });
}

export async function removeExercise(exerciseId) {
  const db = await getDb();
  await db.runAsync(`DELETE FROM session_exercises WHERE id = ?`, [exerciseId]);
}

// Most recent date before `beforeDate` that has any logged exercises, or
// null if there isn't one — used to decide whether "Copy Previous Workout"
// should be offered.
export async function getPreviousSessionDate(beforeDate) {
  const db = await getDb();
  const row = await db.getFirstAsync(
    `SELECT DISTINCT date FROM session_exercises WHERE date < ? ORDER BY date DESC LIMIT 1`,
    [beforeDate]
  );
  return row ? row.date : null;
}

// Appends every exercise from the most recent earlier session onto `date`'s
// session. No-ops if there's no earlier session.
export async function copyPreviousWorkout(date) {
  const db = await getDb();
  const previousDate = await getPreviousSessionDate(date);
  if (!previousDate) return;

  // Exclusive transaction: locks out other queries that could otherwise
  // interleave into this transaction and corrupt its native state.
  await db.withExclusiveTransactionAsync(async (txn) => {
    const previousExercises = await txn.getAllAsync(
      `SELECT name FROM session_exercises WHERE date = ? ORDER BY exercise_order`,
      [previousDate]
    );
    const countRow = await txn.getFirstAsync(
      `SELECT COUNT(*) AS count FROM session_exercises WHERE date = ?`,
      [date]
    );

    let order = countRow.count;
    const now = new Date().toISOString();
    for (const exercise of previousExercises) {
      await txn.runAsync(
        `INSERT INTO session_exercises (date, exercise_order, name, logged_at) VALUES (?, ?, ?, ?)`,
        [date, order, exercise.name, now]
      );
      order++;
    }
  });
}

// Returns every logged exercise, unfiltered — used by the export feature to
// back up the full history, not just what the visible calendar range needs.
export async function getAllSessionExercises() {
  const db = await getDb();
  return db.getAllAsync(
    `SELECT date, exercise_order, name, logged_at FROM session_exercises ORDER BY date, exercise_order`
  );
}

// Fully replaces the local history with the contents of an imported backup
// file — simplest correct behavior since exercise ids won't match across
// devices, so there's nothing meaningful to merge row-by-row.
export async function restoreSessionExercises(rows) {
  const db = await getDb();
  // Exclusive transaction — see note in copyPreviousWorkout above.
  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync(`DELETE FROM session_exercises`);
    for (const row of rows) {
      await txn.runAsync(
        `INSERT INTO session_exercises (date, exercise_order, name, logged_at) VALUES (?, ?, ?, ?)`,
        [row.date, row.exercise_order, row.name, row.logged_at]
      );
    }
  });
}
