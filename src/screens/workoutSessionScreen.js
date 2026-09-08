import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  addExercise,
  copyPreviousWorkout,
  getPreviousSessionDate,
  getSessionExercises,
  removeExercise,
} from '../db/db';
import { formatDateHeading, shiftDateStr, todayDateStr } from '../utils/date';

// date is a 'YYYY-MM-DD' string for the day currently being viewed.
// onChangeDate lets the ‹ › arrows move to an adjacent day without leaving
// this screen; onBack returns to the calendar.
export default function WorkoutSessionScreen({ date, onBack, onChangeDate }) {
  const [exercises, setExercises] = useState([]);
  const [previousDate, setPreviousDate] = useState(null);
  const [adding, setAdding] = useState(false);
  const [newExerciseText, setNewExerciseText] = useState('');

  useEffect(() => {
    setAdding(false);
    setNewExerciseText('');
    reload();
    getPreviousSessionDate(date).then(setPreviousDate);
  }, [date]);

  async function reload() {
    setExercises(await getSessionExercises(date));
  }

  async function handleAddExercise() {
    const name = newExerciseText.trim();
    if (!name) return;
    await addExercise(date, name);
    setNewExerciseText('');
    await reload();
  }

  async function handleRemoveExercise(id) {
    await removeExercise(id);
    await reload();
  }

  async function handleCopyPrevious() {
    await copyPreviousWorkout(date);
    await reload();
  }

  const nextDate = shiftDateStr(date, 1);
  const canGoNext = nextDate <= todayDateStr();

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Back" hitSlop={10} onPress={onBack}>
          <Text style={styles.headerArrow}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Today's Workout</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.dateNavRow}>
        <Pressable
          accessibilityLabel="Previous day"
          hitSlop={10}
          onPress={() => onChangeDate(shiftDateStr(date, -1))}
        >
          <Text style={styles.dateNavArrow}>‹</Text>
        </Pressable>
        <Text style={styles.dateLabel}>{formatDateHeading(date)}</Text>
        <Pressable
          accessibilityLabel="Next day"
          disabled={!canGoNext}
          hitSlop={10}
          onPress={() => onChangeDate(nextDate)}
        >
          <Text style={[styles.dateNavArrow, !canGoNext && styles.dateNavArrowDisabled]}>›</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {exercises.length === 0 ? (
            <Text style={styles.mutedText}>No exercises logged for this day yet.</Text>
          ) : (
            exercises.map((exercise) => (
              <View key={exercise.id} style={styles.exerciseRow}>
                <Text style={styles.exerciseText}>{exercise.name}</Text>
                <Pressable hitSlop={8} onPress={() => handleRemoveExercise(exercise.id)}>
                  <Text style={styles.removeText}>✕</Text>
                </Pressable>
              </View>
            ))
          )}

          {adding && (
            <View style={styles.addRow}>
              <TextInput
                autoFocus
                onChangeText={setNewExerciseText}
                onSubmitEditing={handleAddExercise}
                placeholder="Exercise name"
                placeholderTextColor="#6A6A6A"
                returnKeyType="done"
                style={styles.input}
                value={newExerciseText}
              />
              <Pressable onPress={handleAddExercise} style={styles.addConfirmButton}>
                <Text style={styles.addConfirmButtonText}>Add</Text>
              </Pressable>
            </View>
          )}

          <Pressable onPress={() => setAdding((prev) => !prev)} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>{adding ? 'Done adding' : '+ Add Exercise'}</Text>
          </Pressable>

          {previousDate && (
            <Pressable onPress={handleCopyPrevious} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Copy Previous Workout</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },

  headerArrow: {
    fontSize: 28,
    color: '#F5F5F5',
    width: 28,
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#CFFF3D',
  },

  headerSpacer: {
    width: 28,
  },

  dateNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },

  dateNavArrow: {
    fontSize: 20,
    color: '#CFFF3D',
    paddingHorizontal: 8,
  },

  dateNavArrowDisabled: {
    color: '#3A3A3A',
  },

  dateLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8A8A8A',
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },

  card: {
    backgroundColor: '#161616',
    borderRadius: 24,
    padding: 16,
  },

  mutedText: {
    fontSize: 13,
    color: '#8A8A8A',
    marginBottom: 12,
  },

  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1F1F1F',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
  },

  exerciseText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F5F5F5',
  },

  removeText: {
    fontSize: 13,
    color: '#8A8A8A',
  },

  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    marginBottom: 8,
  },

  input: {
    flex: 1,
    backgroundColor: '#1F1F1F',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#F5F5F5',
  },

  addConfirmButton: {
    backgroundColor: '#CFFF3D',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  addConfirmButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0A0A0A',
  },

  primaryButton: {
    backgroundColor: '#CFFF3D',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },

  primaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0A0A0A',
  },

  secondaryButton: {
    backgroundColor: '#242424',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },

  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F5F5F5',
  },
});
