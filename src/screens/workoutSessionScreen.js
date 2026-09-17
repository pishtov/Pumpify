import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import AnimatedButton from '../components/AnimatedButton';
import AnimatedIconButton from '../components/AnimatedIconButton';
import {
  addExercises,
  copyPreviousWorkout,
  deleteSet,
  getExercisesWithSets,
  getPreviousSessionDate,
  logSet,
  removeExercise,
  reorderExercises,
  updateSet,
} from '../db/db';
import { formatDateHeading, shiftDateStr, todayDateStr } from '../utils/date';
import ExercisePickerModal from './exercisePickerModal';

const PANEL_MAX_HEIGHT = 600;

const SET_EDIT_MAX_HEIGHT = 150;

const MAX_WEIGHT_KG = 3000;
const MAX_REPS = 99;

// Strips invalid characters and clamps to `max` as the user types, so a
// runaway number of digits can never reach the UI (which breaks layout for
// very large values) — used for the weight inputs (decimal allowed). Returns
// whether this keystroke actually got clamped, so callers can warn the user.
function clampDecimalText(text, max) {
  let cleaned = text.replace(/[^0-9.]/g, '');
  const firstDot = cleaned.indexOf('.');
  if (firstDot !== -1) {
    cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '');
  }
  if (cleaned === '' || cleaned === '.') return { text: cleaned, hitMax: false };
  const value = parseFloat(cleaned);
  if (!Number.isNaN(value) && value > max) return { text: String(max), hitMax: true };
  return { text: cleaned, hitMax: false };
}

// Same idea as clampDecimalText, but integer-only — used for the reps inputs.
function clampIntegerText(text, max) {
  const cleaned = text.replace(/[^0-9]/g, '');
  if (cleaned === '') return { text: cleaned, hitMax: false };
  const value = parseInt(cleaned, 10);
  if (value > max) return { text: String(max), hitMax: true };
  return { text: cleaned, hitMax: false };
}

const LIMIT_MESSAGE_DURATION = 1800;

// Shows `message` under a set's input row for a couple seconds, so hitting a
// cap gives feedback instead of just silently refusing more digits.
function useLimitMessage() {
  const [message, setMessage] = useState(null);
  const timeoutRef = useRef(null);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  function show(text) {
    setMessage(text);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setMessage(null), LIMIT_MESSAGE_DURATION);
  }

  return [message, show];
}

function SetRow({ index, onDelete, onSave, set }) {
  const [editing, setEditing] = useState(false);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [limitMessage, showLimitMessage] = useLimitMessage();
  const anim = useRef(new Animated.Value(0)).current;

  function toggleEditing() {
    const next = !editing;
    if (next) {
      setWeight(set.weight != null ? String(set.weight) : '');
      setReps(set.reps != null ? String(set.reps) : '');
    }
    setEditing(next);
    Animated.timing(anim, {
      duration: 200,
      toValue: next ? 1 : 0,
      useNativeDriver: false,
    }).start();
  }

  function handleSave() {
    const parsedReps = reps.trim() ? parseInt(reps, 10) : null;
    if (!parsedReps) return;
    const parsedWeight = weight.trim() ? parseFloat(weight) : null;
    onSave(set.id, { weight: parsedWeight, reps: parsedReps });
    toggleEditing();
  }

  return (
    <View style={styles.setCard}>
      <Text style={styles.setIndexLabel}>Set {index + 1}:</Text>
      <View style={styles.setDetailRow}>
        <Text style={styles.setText}>
          {set.weight != null ? `${set.weight} kg` : '—'} x {set.reps != null ? `${set.reps} reps` : '—'}
        </Text>
        <View style={styles.setActions}>
          <Pressable hitSlop={8} onPress={toggleEditing}>
            <Image
              source={
                editing
                  ? require('../../assets/icons/pencil_on.png')
                  : require('../../assets/icons/pencil_off.png')
              }
              style={styles.setActionIcon}
            />
          </Pressable>
          <Pressable hitSlop={8} onPress={() => onDelete(set.id, index)}>
            <Image source={require('../../assets/icons/trash.png')} style={styles.setActionIcon} />
          </Pressable>
        </View>
      </View>

      <Animated.View
        style={{
          maxHeight: anim.interpolate({ inputRange: [0, 1], outputRange: [0, SET_EDIT_MAX_HEIGHT] }),
          opacity: anim,
          overflow: 'hidden',
        }}
      >
        <View style={styles.setEditPanel}>
          <View style={styles.setEditInputRow}>
            <TextInput
              keyboardType="decimal-pad"
              maxLength={7}
              onChangeText={(text) => {
                const result = clampDecimalText(text, MAX_WEIGHT_KG);
                setWeight(result.text);
                if (result.hitMax) showLimitMessage(`Max weight is ${MAX_WEIGHT_KG} kg`);
              }}
              placeholder="Weight (kg)"
              placeholderTextColor="#6A6A6A"
              style={styles.setEditInput}
              value={weight}
            />
            <TextInput
              keyboardType="number-pad"
              maxLength={3}
              onChangeText={(text) => {
                const result = clampIntegerText(text, MAX_REPS);
                setReps(result.text);
                if (result.hitMax) showLimitMessage(`Max reps is ${MAX_REPS}`);
              }}
              placeholder="Reps"
              placeholderTextColor="#6A6A6A"
              style={styles.setEditInput}
              value={reps}
            />
          </View>
          {limitMessage && <Text style={styles.limitMessageText}>{limitMessage}</Text>}
          <View style={styles.setEditActionsRow}>
            <AnimatedButton onPress={toggleEditing} style={styles.setCancelButton}>
              <Text style={styles.setCancelButtonText}>Cancel</Text>
            </AnimatedButton>
            <AnimatedButton onPress={handleSave} style={styles.setSaveButton}>
              <Text style={styles.setSaveButtonText}>Save</Text>
            </AnimatedButton>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

function ExerciseRow({
  dragStyle,
  exercise,
  isActive,
  onDeleteSet,
  onDragEnd,
  onDragStart,
  onDragUpdate,
  onLogSet,
  onMeasure,
  onRemove,
  onUpdateSet,
}) {
  const [expanded, setExpanded] = useState(false);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [limitMessage, showLimitMessage] = useLimitMessage();
  const anim = useRef(new Animated.Value(0)).current;

  const dragGesture = useMemo(
    () =>
      Gesture.Pan()
        .activateAfterLongPress(300)
        .hitSlop(10)
        .onStart(() => {
          scheduleOnRN(onDragStart, exercise.id);
        })
        .onUpdate((event) => {
          scheduleOnRN(onDragUpdate, exercise.id, event.translationY);
        })
        .onEnd(() => {
          scheduleOnRN(onDragEnd);
        }),
    [exercise.id, onDragEnd, onDragStart, onDragUpdate]
  );

  function handleLayout(event) {
    const { height, y } = event.nativeEvent.layout;
    onMeasure(exercise.id, { height, y });
  }

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

  function handleDeleteSet(setId, index) {
    Alert.alert('Delete this set?', `Set ${index + 1} will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDeleteSet(setId) },
    ]);
  }

  return (
    <Animated.View
      onLayout={handleLayout}
      style={[styles.exerciseCard, isActive && styles.exerciseCardActive, dragStyle]}
    >
      <View style={styles.exerciseRow}>
        <GestureDetector gesture={dragGesture}>
          <View style={styles.dragHandle}>
            <Text style={styles.dragHandleIcon}>⠿</Text>
          </View>
        </GestureDetector>
        <Pressable disabled={isActive} onPress={toggleExpanded} style={styles.exerciseNameArea}>
          <Text style={styles.exerciseText}>{exercise.name}</Text>
        </Pressable>
        <Pressable disabled={isActive} hitSlop={8} onPress={() => onRemove(exercise.id, exercise.name)}>
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
          <View style={styles.setPanelDivider} />
          {exercise.sets.map((set, index) => (
            <SetRow
              index={index}
              key={set.id}
              onDelete={handleDeleteSet}
              onSave={onUpdateSet}
              set={set}
            />
          ))}

          <View style={styles.setInputRow}>
            <TextInput
              keyboardType="decimal-pad"
              maxLength={7}
              onChangeText={(text) => {
                const result = clampDecimalText(text, MAX_WEIGHT_KG);
                setWeight(result.text);
                if (result.hitMax) showLimitMessage(`Max weight is ${MAX_WEIGHT_KG} kg`);
              }}
              placeholder="Weight (kg)"
              placeholderTextColor="#6A6A6A"
              style={styles.setInput}
              value={weight}
            />
            <TextInput
              keyboardType="number-pad"
              maxLength={3}
              onChangeText={(text) => {
                const result = clampIntegerText(text, MAX_REPS);
                setReps(result.text);
                if (result.hitMax) showLimitMessage(`Max reps is ${MAX_REPS}`);
              }}
              placeholder="Reps"
              placeholderTextColor="#6A6A6A"
              style={styles.setInput}
              value={reps}
            />
            <AnimatedButton onPress={handleLogSet} style={styles.logButton}>
              <Text style={styles.logButtonText}>Log</Text>
            </AnimatedButton>
          </View>
          {limitMessage && <Text style={styles.limitMessageText}>{limitMessage}</Text>}
        </View>
      </Animated.View>
    </Animated.View>
  );
}

// date is a 'YYYY-MM-DD' string for the day currently being viewed.
// onChangeDate lets the ‹ › arrows move to an adjacent day without leaving
// this screen; onBack returns to the calendar.
export default function WorkoutSessionScreen({ date, onBack, onChangeDate }) {
  const [exercises, setExercises] = useState([]);
  const [previousDate, setPreviousDate] = useState(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [draggingId, setDraggingId] = useState(null);

  const exercisesRef = useRef(exercises);
  const rowLayoutsRef = useRef({});
  const dragStartYRef = useRef(0);
  const dragTranslateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    exercisesRef.current = exercises;
  }, [exercises]);

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

  async function handleUpdateSet(setId, { weight, reps }) {
    await updateSet(setId, { weight, reps });
    await reload();
  }

  async function handleDeleteSet(setId) {
    await deleteSet(setId);
    await reload();
  }

  // Stable identities (empty deps, everything mutable read via refs) — these
  // get passed into each row's useMemo-built Gesture, which must not be
  // recreated mid-drag or the native gesture recognizer would be torn down.
  const handleMeasureRow = useCallback((id, layout) => {
    rowLayoutsRef.current[id] = layout;
  }, []);

  const handleDragStart = useCallback((id) => {
    const layout = rowLayoutsRef.current[id];
    dragStartYRef.current = layout ? layout.y : 0;
    dragTranslateY.setValue(0);
    setDraggingId(id);
  }, []);

  const handleDragUpdate = useCallback((id, translationY) => {
    dragTranslateY.setValue(translationY);

    const layout = rowLayoutsRef.current[id];
    if (!layout) return;
    const draggedCenter = dragStartYRef.current + layout.height / 2 + translationY;

    let hoverId = null;
    for (const exercise of exercisesRef.current) {
      if (exercise.id === id) continue;
      const rowLayout = rowLayoutsRef.current[exercise.id];
      if (!rowLayout) continue;
      if (draggedCenter >= rowLayout.y && draggedCenter < rowLayout.y + rowLayout.height) {
        hoverId = exercise.id;
        break;
      }
    }
    if (hoverId == null) return;

    setExercises((prev) => {
      const fromIndex = prev.findIndex((exercise) => exercise.id === id);
      const toIndex = prev.findIndex((exercise) => exercise.id === hoverId);
      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, []);

  const handleDragEnd = useCallback(async () => {
    setDraggingId(null);
    dragTranslateY.setValue(0);
    await reorderExercises(exercisesRef.current.map((exercise) => exercise.id));
  }, []);

  const nextDate = shiftDateStr(date, 1);
  const canGoNext = nextDate <= todayDateStr();

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <AnimatedIconButton accessibilityLabel="Back" hitSlop={10} onPress={onBack}>
          <Text style={styles.headerArrow}>‹</Text>
        </AnimatedIconButton>
        <Text style={styles.headerTitle}>Today's Workout</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.dateNavRow}>
        <AnimatedIconButton
          accessibilityLabel="Previous day"
          hitSlop={10}
          onPress={() => onChangeDate(shiftDateStr(date, -1))}
        >
          <Text style={styles.dateNavArrow}>‹</Text>
        </AnimatedIconButton>
        <Text style={styles.dateLabel}>{formatDateHeading(date)}</Text>
        <AnimatedIconButton
          accessibilityLabel="Next day"
          disabled={!canGoNext}
          hitSlop={10}
          onPress={() => onChangeDate(nextDate)}
        >
          <Text style={[styles.dateNavArrow, !canGoNext && styles.dateNavArrowDisabled]}>›</Text>
        </AnimatedIconButton>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.exerciseListArea}>
          {exercises.length === 0 ? (
            <Text style={styles.mutedText}>Add your first exercise to begin your workout.</Text>
          ) : (
            exercises.map((exercise) => (
              <ExerciseRow
                dragStyle={
                  exercise.id === draggingId
                    ? [
                        styles.exerciseCardDragging,
                        { top: dragStartYRef.current, transform: [{ translateY: dragTranslateY }] },
                      ]
                    : null
                }
                exercise={exercise}
                isActive={exercise.id === draggingId}
                key={exercise.id}
                onDeleteSet={handleDeleteSet}
                onDragEnd={handleDragEnd}
                onDragStart={handleDragStart}
                onDragUpdate={handleDragUpdate}
                onLogSet={handleLogSet}
                onMeasure={handleMeasureRow}
                onRemove={handleRemoveExercise}
                onUpdateSet={handleUpdateSet}
              />
            ))
          )}
        </View>

        <AnimatedButton onPress={() => setPickerVisible(true)} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Add Exercise</Text>
        </AnimatedButton>

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

  exerciseListArea: {
    position: 'relative',
  },

  mutedText: {
    fontSize: 13,
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
    fontWeight: '900',
    fontSize: 16,
  },

  exerciseCard: {
    backgroundColor: '#1F1F1F',
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },

  exerciseCardActive: {
    backgroundColor: '#2A2A2A',
    boxShadow: '0px 4px 12px #000000A0',
  },

  exerciseCardDragging: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
    elevation: 10,
  },

  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },

  dragHandle: {
    paddingRight: 10,
  },

  dragHandleIcon: {
    fontSize: 18,
    color: '#6A6A6A',
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
    paddingBottom: 18,
  },

  setPanelDivider: {
    height: 2,
    backgroundColor: '#474747',
    marginBottom: 20,
  },

  setCard: {
    backgroundColor: '#161616',
    borderRadius: 10,
    padding: 10,
    marginBottom: 16, 
  },

  setIndexLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8A8A8A',
    marginBottom: 6,
  },

  setDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  setText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#D0D0D0',
  },

  setActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },

  setActionIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
  },

  setEditPanel: {
    backgroundColor: '#0A0A0A',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },

  setEditInputRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },

  setEditInput: {
    flex: 1,
    backgroundColor: '#1F1F1F',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: '#F5F5F5',
  },

  limitMessageText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF6B6B',
    marginBottom: 8,
  },

  setEditActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },

  setCancelButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#242424',
  },

  setCancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F5F5F5',
  },

  setSaveButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#CFFF3D',
  },

  setSaveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0A0A0A',
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
    fontSize: 14,
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
