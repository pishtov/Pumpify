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
  await db.execAsync(`PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;`);

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
    CREATE TABLE IF NOT EXISTS exercise_sets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_exercise_id INTEGER NOT NULL REFERENCES session_exercises(id) ON DELETE CASCADE,
      set_order INTEGER NOT NULL,
      weight REAL,
      reps INTEGER,
      rpe REAL,
      logged_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_exercise_sets_session_exercise_id ON exercise_sets(session_exercise_id);
    CREATE TABLE IF NOT EXISTS custom_exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL,
      body_part TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // metric was added after the table above shipped — add it for anyone
  // upgrading from an older install where custom_exercises already exists.
  const customExerciseColumns = await db.getAllAsync(`PRAGMA table_info(custom_exercises)`);
  if (!customExerciseColumns.some((column) => column.name === 'metric')) {
    await db.execAsync(`ALTER TABLE custom_exercises ADD COLUMN metric TEXT`);
  }
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

// Same as getSessionExercises, but each exercise also carries its logged
// sets (in order) — what the session screen renders per exercise's dropdown.
export async function getExercisesWithSets(date) {
  const db = await getDb();
  const exercises = await db.getAllAsync(
    `SELECT id, name FROM session_exercises WHERE date = ? ORDER BY exercise_order`,
    [date]
  );
  const sets = await db.getAllAsync(
    `SELECT id, session_exercise_id, set_order, weight, reps, rpe
     FROM exercise_sets
     WHERE session_exercise_id IN (SELECT id FROM session_exercises WHERE date = ?)
     ORDER BY set_order`,
    [date]
  );
  return exercises.map((exercise) => ({
    ...exercise,
    sets: sets.filter((set) => set.session_exercise_id === exercise.id),
  }));
}

// values is { weight, reps, rpe } — rpe may be null. Appends as the next set
// for this exercise instance.
export async function logSet(sessionExerciseId, { weight, reps, rpe }) {
  const db = await getDb();
  const countRow = await db.getFirstAsync(
    `SELECT COUNT(*) AS count FROM exercise_sets WHERE session_exercise_id = ?`,
    [sessionExerciseId]
  );
  await db.runAsync(
    `INSERT INTO exercise_sets (session_exercise_id, set_order, weight, reps, rpe, logged_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [sessionExerciseId, countRow.count, weight, reps, rpe, new Date().toISOString()]
  );
}

// values is { weight, reps } — corrects a set logged with the wrong numbers.
export async function updateSet(setId, { weight, reps }) {
  const db = await getDb();
  await db.runAsync(`UPDATE exercise_sets SET weight = ?, reps = ? WHERE id = ?`, [
    weight,
    reps,
    setId,
  ]);
}

export async function deleteSet(setId) {
  const db = await getDb();
  await db.runAsync(`DELETE FROM exercise_sets WHERE id = ?`, [setId]);
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

// orderedIds is every exercise id for a session, in the new display order —
// what the session screen calls after a drag-to-reorder.
export async function reorderExercises(orderedIds) {
  const db = await getDb();
  await db.withExclusiveTransactionAsync(async (txn) => {
    for (let i = 0; i < orderedIds.length; i++) {
      await txn.runAsync(`UPDATE session_exercises SET exercise_order = ? WHERE id = ?`, [
        i,
        orderedIds[i],
      ]);
    }
  });
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

// Returns every user-created exercise, so the picker can list them alongside
// the built-in catalog.
export async function getCustomExercises() {
  const db = await getDb();
  return db.getAllAsync(
    `SELECT id, name, type, body_part, metric FROM custom_exercises ORDER BY name`
  );
}

// type is 'strength' | 'hold' | 'cardio'; bodyPart is required for strength
// and hold, null for cardio. metric is 'distance' | 'floors' for cardio,
// null otherwise. Throws if an exercise with this name already exists
// (built-in names aren't checked here — the picker does that).
export async function addCustomExercise({ name, type, bodyPart, metric }) {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO custom_exercises (name, type, body_part, metric, created_at) VALUES (?, ?, ?, ?, ?)`,
    [name, type, bodyPart ?? null, metric ?? null, new Date().toISOString()]
  );
}

export async function deleteCustomExercise(name) {
  const db = await getDb();
  await db.runAsync(`DELETE FROM custom_exercises WHERE name = ?`, [name]);
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
