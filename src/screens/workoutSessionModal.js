import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  addExercise,
  copyPreviousWorkout,
  getPreviousSessionDate,
  getSessionExercises,
  removeExercise,
} from '../db/db';

function formatDateHeading(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

// date is a 'YYYY-MM-DD' string or null (modal hidden). onChange fires
// whenever the session's exercise list changes, so the calendar can refresh
// which days are lit up.
export default function WorkoutSessionModal({ date, onChange, onClose }) {
  const [exercises, setExercises] = useState([]);
  const [previousDate, setPreviousDate] = useState(null);
  const [adding, setAdding] = useState(false);
  const [newExerciseText, setNewExerciseText] = useState('');

  useEffect(() => {
    if (!date) return;
    setAdding(false);
    setNewExerciseText('');
    reload();
    getPreviousSessionDate(date).then(setPreviousDate);
  }, [date]);

  async function reload() {
    const rows = await getSessionExercises(date);
    setExercises(rows);
  }

  async function handleAddExercise() {
    const name = newExerciseText.trim();
    if (!name) return;
    await addExercise(date, name);
    setNewExerciseText('');
    await reload();
    onChange();
  }

  async function handleRemoveExercise(id) {
    await removeExercise(id);
    await reload();
    onChange();
  }

  async function handleCopyPrevious() {
    await copyPreviousWorkout(date);
    await reload();
    onChange();
  }

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={!!date}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {date && <Text style={styles.heading}>{formatDateHeading(date)}</Text>}
          <Text style={styles.subheading}>Workout Session</Text>

          <ScrollView style={styles.exerciseList}>
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
          </ScrollView>

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

          <Pressable
            onPress={() => setAdding((prev) => !prev)}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>{adding ? 'Done adding' : '+ Add Exercise'}</Text>
          </Pressable>

          {previousDate && (
            <Pressable onPress={handleCopyPrevious} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Copy Previous Workout</Text>
            </Pressable>
          )}

          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#000000B0',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  card: {
    backgroundColor: '#161616',
    borderRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },

  heading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F5F5F5',
    marginBottom: 4,
  },

  subheading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#CFFF3D',
    marginBottom: 14,
  },

  mutedText: {
    fontSize: 13,
    color: '#8A8A8A',
    marginBottom: 12,
  },

  exerciseList: {
    marginBottom: 4,
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

  closeButton: {
    alignItems: 'center',
    paddingTop: 12,
  },

  closeButtonText: {
    fontSize: 12,
    color: '#5A5A5A',
  },
});
