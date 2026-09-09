import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  addExercises,
  copyPreviousWorkout,
  getExercisesWithSets,
  getPreviousSessionDate,
  logSet,
  removeExercise,
} from '../db/db';
import { formatDateHeading, shiftDateStr, todayDateStr } from '../utils/date';
import ExercisePickerModal from './exercisePickerModal';

const PANEL_MAX_HEIGHT = 600;

function ExerciseRow({ exercise, onLogSet, onRemove }) {
  const [expanded, setExpanded] = useState(false);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const anim = useRef(new Animated.Value(0)).current;

  function toggleExpanded() {
    const next = !expanded;
    setExpanded(next);
    Animated.timing(anim, {
      duration: 220,
      toValue: next ? 1 : 0,
      useNativeDriver: false,
    }).start();
  }

  function handleLogSet() {
    const parsedReps = reps.trim() ? parseInt(reps, 10) : null;
    if (!parsedReps) return;
    const parsedWeight = weight.trim() ? parseFloat(weight) : null;
    onLogSet(exercise.id, { weight: parsedWeight, reps: parsedReps });
    setWeight('');
    setReps('');
  }

  return (
    <View style={styles.exerciseCard}>
      <View style={styles.exerciseRow}>
        <Pressable onPress={toggleExpanded} style={styles.exerciseNameArea}>
          <Text style={styles.exerciseText}>{'⠿ ' + exercise.name}</Text>
        </Pressable>
        <Pressable hitSlop={8} onPress={() => onRemove(exercise.id, exercise.name)}>
          <Image source={require('../../assets/icons/trash.png')} style={styles.removeIcon} />
        </Pressable>
      </View>

      <Animated.View
        style={{
          maxHeight: anim.interpolate({ inputRange: [0, 1], outputRange: [0, PANEL_MAX_HEIGHT] }),
          opacity: anim,
          overflow: 'hidden',
        }}
      >
        <View style={styles.setPanel}>
          {exercise.sets.map((set, index) => (
            <Text key={set.id} style={styles.setText}>
              Set {index + 1}: {set.weight != null ? `${set.weight} kg` : '—'} ×{' '}
              {set.reps != null ? `${set.reps} reps` : '—'}
            </Text>
          ))}

          <View style={styles.setInputRow}>
            <TextInput
              keyboardType="decimal-pad"
              onChangeText={setWeight}
              placeholder="Weight (kg)"
              placeholderTextColor="#6A6A6A"
              style={styles.setInput}
              value={weight}
            />
            <TextInput
              keyboardType="number-pad"
              onChangeText={setReps}
              placeholder="Reps"
              placeholderTextColor="#6A6A6A"
              style={styles.setInput}
              value={reps}
            />
            <Pressable onPress={handleLogSet} style={styles.logButton}>
              <Text style={styles.logButtonText}>Log</Text>
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

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
    setExercises(await getExercisesWithSets(date));
  }

  async function handleConfirmExercises(names) {
    setPickerVisible(false);
    await addExercises(date, names);
    await reload();
  }

  function handleRemoveExercise(id, name) {
    Alert.alert('Delete this exercise?', `"${name}" and its logged sets will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await removeExercise(id);
          await reload();
        },
      },
    ]);
  }

  async function handleCopyPrevious() {
    await copyPreviousWorkout(date);
    await reload();
  }

  async function handleLogSet(exerciseId, { weight, reps }) {
    await logSet(exerciseId, { weight, reps, rpe: null });
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
              <ExerciseRow
                exercise={exercise}
                key={exercise.id}
                onLogSet={handleLogSet}
                onRemove={handleRemoveExercise}
              />
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
  },

  exerciseCard: {
    backgroundColor: '#1F1F1F',
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },

  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },

  exerciseNameArea: {
    flex: 1,
  },

  exerciseText: {
    fontSize: 18,
    flex: 1,
    fontWeight: '600',
    color: '#F5F5F5',
  },

  removeIcon: {
    width: 16,
    height: 16,
    resizeMode: 'contain',
  },

  setPanel: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },

  setText: {
    fontSize: 18,
    color: '#D0D0D0',
    marginBottom: 4,
  },

  setInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },

  setInput: {
    flex: 1,
    backgroundColor: '#161616',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 18,
    color: '#F5F5F5',
  },

  logButton: {
    backgroundColor: '#CFFF3D',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  logButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A0A0A',
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
