import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  addExercises,
  copyPreviousWorkout,
  getPreviousSessionDate,
  getSessionExercises,
  removeExercise,
} from '../db/db';
import { formatDateHeading, shiftDateStr, todayDateStr } from '../utils/date';
import ExercisePickerModal from './exercisePickerModal';

// date is a 'YYYY-MM-DD' string for the day currently being viewed.
// onChangeDate lets the ‹ › arrows move to an adjacent day without leaving
// this screen; onBack returns to the calendar.
export default function WorkoutSessionScreen({ date, onBack, onChangeDate }) {
  const [exercises, setExercises] = useState([]);
  const [previousDate, setPreviousDate] = useState(null);
  const [pickerVisible, setPickerVisible] = useState(false);

  useEffect(() => {
    setPickerVisible(false);
    reload();
    getPreviousSessionDate(date).then(setPreviousDate);
  }, [date]);

  async function reload() {
    setExercises(await getSessionExercises(date));
  }

  async function handleConfirmExercises(names) {
    setPickerVisible(false);
    await addExercises(date, names);
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
                <Text style={styles.exerciseText}>{'⠿ ' + exercise.name}</Text>
                <Pressable hitSlop={8} onPress={() => handleRemoveExercise(exercise.id)}>
                  <Text style={styles.removeText}>✕</Text>
                </Pressable>
              </View>
            ))
          )}
        </View>

        <Pressable onPress={() => setPickerVisible(true)} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>+ Add Exercise</Text>
        </Pressable>

        {previousDate && (
          <Pressable onPress={handleCopyPrevious} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Copy Previous Workout</Text>
          </Pressable>
        )}
      </ScrollView>

      <ExercisePickerModal
        onClose={() => setPickerVisible(false)}
        onConfirm={handleConfirmExercises}
        visible={pickerVisible}
      />
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
    fontSize: 18,
    flex: 1,
    fontWeight: '600',
    color: '#F5F5F5',
  },

  removeText: {
    fontSize: 13,
    color: '#8A8A8A',
  },

  primaryButton: {
    backgroundColor: '#CFFF3D',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },

  primaryButtonText: {
    fontSize: 18,
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
