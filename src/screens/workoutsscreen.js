import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { createSplit, deleteSplit, getSplitDetail, getSplits } from '../db/db';

function emptyDay() {
  return { label: '', exercises: [''] };
}

function SplitBuilder({ onCancel, onSaved }) {
  const [splitName, setSplitName] = useState('');
  const [days, setDays] = useState([emptyDay()]);

  function updateDayLabel(dayIndex, text) {
    setDays((prev) => prev.map((day, i) => (i === dayIndex ? { ...day, label: text } : day)));
  }

  function addDay() {
    setDays((prev) => [...prev, emptyDay()]);
  }

  function removeDay(dayIndex) {
    setDays((prev) => prev.filter((_, i) => i !== dayIndex));
  }

  function updateExercise(dayIndex, exIndex, text) {
    setDays((prev) =>
      prev.map((day, i) =>
        i === dayIndex
          ? { ...day, exercises: day.exercises.map((ex, j) => (j === exIndex ? text : ex)) }
          : day
      )
    );
  }

  function addExercise(dayIndex) {
    setDays((prev) =>
      prev.map((day, i) => (i === dayIndex ? { ...day, exercises: [...day.exercises, ''] } : day))
    );
  }

  function removeExercise(dayIndex, exIndex) {
    setDays((prev) =>
      prev.map((day, i) =>
        i === dayIndex ? { ...day, exercises: day.exercises.filter((_, j) => j !== exIndex) } : day
      )
    );
  }

  async function handleSave() {
    const name = splitName.trim();
    if (!name) {
      Alert.alert('Name your split', 'Give this split a name, like "PPL" or "Arnold".');
      return;
    }

    const cleanedDays = days
      .map((day) => ({
        label: day.label.trim(),
        exercises: day.exercises.map((ex) => ex.trim()).filter(Boolean),
      }))
      .filter((day) => day.label);

    if (cleanedDays.length === 0) {
      Alert.alert('Add a day', 'Give at least one day a focus, like "Push" or "Back and Biceps".');
      return;
    }

    try {
      await createSplit(name, cleanedDays);
      onSaved();
    } catch (error) {
      Alert.alert('Could not save split', error.message);
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>New split</Text>

      <TextInput
        onChangeText={setSplitName}
        placeholder="Split name (e.g. PPL, Arnold)"
        placeholderTextColor="#6A6A6A"
        style={styles.input}
        value={splitName}
      />

      {days.map((day, dayIndex) => (
        <View key={dayIndex} style={styles.dayBlock}>
          <View style={styles.dayBlockHeader}>
            <Text style={styles.dayBlockTitle}>Day {dayIndex + 1}</Text>
            {days.length > 1 && (
              <Pressable hitSlop={8} onPress={() => removeDay(dayIndex)}>
                <Text style={styles.removeText}>Remove day</Text>
              </Pressable>
            )}
          </View>

          <TextInput
            onChangeText={(text) => updateDayLabel(dayIndex, text)}
            placeholder="What are you training? (e.g. Chest and Triceps)"
            placeholderTextColor="#6A6A6A"
            style={styles.input}
            value={day.label}
          />

          {day.exercises.map((exercise, exIndex) => (
            <View key={exIndex} style={styles.exerciseRow}>
              <TextInput
                onChangeText={(text) => updateExercise(dayIndex, exIndex, text)}
                placeholder="Exercise name"
                placeholderTextColor="#6A6A6A"
                style={[styles.input, styles.exerciseInput]}
                value={exercise}
              />
              {day.exercises.length > 1 && (
                <Pressable hitSlop={8} onPress={() => removeExercise(dayIndex, exIndex)}>
                  <Text style={styles.removeText}>✕</Text>
                </Pressable>
              )}
            </View>
          ))}

          <Pressable onPress={() => addExercise(dayIndex)} style={styles.addExerciseButton}>
            <Text style={styles.addExerciseText}>+ Add exercise</Text>
          </Pressable>
        </View>
      ))}

      <Pressable onPress={addDay} style={styles.addDayButton}>
        <Text style={styles.addDayText}>+ Add day</Text>
      </Pressable>

      <Pressable onPress={handleSave} style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>Save split</Text>
      </Pressable>

      <Pressable onPress={onCancel} style={styles.secondaryButton}>
        <Text style={styles.secondaryButtonText}>Cancel</Text>
      </Pressable>
    </View>
  );
}

function SplitDetail({ split, onBack, onDeleted }) {
  async function handleDelete() {
    Alert.alert('Delete split', `Delete "${split.name}"? This can't be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteSplit(split.id);
          onDeleted();
        },
      },
    ]);
  }

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{split.name}</Text>

      {split.days.map((day) => (
        <View key={day.id} style={styles.dayBlock}>
          <Text style={styles.dayBlockTitle}>{day.label}</Text>
          {day.exercises.length === 0 ? (
            <Text style={styles.emptyExerciseText}>No exercises yet</Text>
          ) : (
            day.exercises.map((exercise) => (
              <Text key={exercise.id} style={styles.exerciseText}>
                • {exercise.name}
              </Text>
            ))
          )}
        </View>
      ))}

      <Pressable onPress={onBack} style={styles.secondaryButton}>
        <Text style={styles.secondaryButtonText}>Back</Text>
      </Pressable>

      <Pressable onPress={handleDelete} style={styles.deleteButton}>
        <Text style={styles.deleteButtonText}>Delete split</Text>
      </Pressable>
    </View>
  );
}

export default function WorkoutsScreen() {
  const [view, setView] = useState('list');
  const [splits, setSplits] = useState([]);
  const [selectedSplit, setSelectedSplit] = useState(null);

  const loadSplits = useCallback(async () => {
    const rows = await getSplits();
    setSplits(rows);
  }, []);

  useEffect(() => {
    loadSplits();
  }, [loadSplits]);

  async function openSplit(split) {
    const days = await getSplitDetail(split.id);
    setSelectedSplit({ ...split, days });
    setView('detail');
  }

  if (view === 'builder') {
    return (
      <SplitBuilder
        onCancel={() => setView('list')}
        onSaved={() => {
          loadSplits();
          setView('list');
        }}
      />
    );
  }

  if (view === 'detail' && selectedSplit) {
    return (
      <SplitDetail
        onBack={() => setView('list')}
        onDeleted={() => {
          loadSplits();
          setView('list');
        }}
        split={selectedSplit}
      />
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Your splits</Text>

      {splits.length === 0 ? (
        <Text style={styles.emptyText}>You haven't created a split yet.</Text>
      ) : (
        splits.map((split) => (
          <Pressable key={split.id} onPress={() => openSplit(split)} style={styles.splitRow}>
            <Text style={styles.splitRowText}>{split.name}</Text>
            <Text style={styles.splitRowArrow}>›</Text>
          </Pressable>
        ))
      )}

      <Pressable onPress={() => setView('builder')} style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>Create a split</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#161616',
    borderRadius: 24,
    padding: 16,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F5F5F5',
    marginBottom: 16,
  },

  emptyText: {
    fontSize: 13,
    color: '#8A8A8A',
    marginBottom: 20,
  },

  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1F1F1F',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
  },

  splitRowText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F5F5F5',
  },

  splitRowArrow: {
    fontSize: 18,
    color: '#8A8A8A',
  },

  input: {
    backgroundColor: '#1F1F1F',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#F5F5F5',
    marginBottom: 10,
  },

  dayBlock: {
    backgroundColor: '#141414',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },

  dayBlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  dayBlockTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#CFFF3D',
  },

  removeText: {
    fontSize: 12,
    color: '#8A8A8A',
  },

  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  exerciseInput: {
    flex: 1,
  },

  exerciseText: {
    fontSize: 13,
    color: '#D0D0D0',
    marginBottom: 4,
  },

  emptyExerciseText: {
    fontSize: 12,
    color: '#6A6A6A',
    fontStyle: 'italic',
  },

  addExerciseButton: {
    paddingVertical: 6,
  },

  addExerciseText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8A8A8A',
  },

  addDayButton: {
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },

  addDayText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#CFFF3D',
  },

  primaryButton: {
    backgroundColor: '#CFFF3D',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
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
    marginBottom: 12,
  },

  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F5F5F5',
  },

  deleteButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },

  deleteButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF6B6B',
  },
});
