import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { EXERCISE_CATEGORIES } from '../data/exercises';

function emptyState() {
  return { checked: new Set(), customList: [], customText: '', search: '' };
}

// onConfirm receives an array of exercise names (checked catalog picks plus
// any custom entries), already deduped.
export default function ExercisePickerModal({ visible, onClose, onConfirm }) {
  const [state, setState] = useState(emptyState);
  const { checked, customList, customText, search } = state;

  function reset() {
    setState(emptyState());
  }

  function handleClose() {
    reset();
    onClose();
  }

  function toggleExercise(name) {
    setState((prev) => {
      const next = new Set(prev.checked);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return { ...prev, checked: next };
    });
  }

  function handleAddCustom() {
    const name = customText.trim();
    if (!name) return;
    setState((prev) => ({
      ...prev,
      customList: prev.customList.includes(name) ? prev.customList : [...prev.customList, name],
      customText: '',
    }));
  }

  function removeCustom(name) {
    setState((prev) => ({ ...prev, customList: prev.customList.filter((n) => n !== name) }));
  }

  function handleConfirm() {
    onConfirm([...checked, ...customList]);
    reset();
  }

  const query = search.trim().toLowerCase();
  const visibleCategories = EXERCISE_CATEGORIES.map((category) => ({
    ...category,
    exercises: query
      ? category.exercises.filter((name) => name.toLowerCase().includes(query))
      : category.exercises,
  })).filter((category) => category.exercises.length > 0);

  const selectedCount = checked.size + customList.length;

  return (
    <Modal animationType="slide" onRequestClose={handleClose} visible={visible}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Add Exercises</Text>
          <Pressable accessibilityLabel="Close" hitSlop={10} onPress={handleClose}>
            <Text style={styles.closeIcon}>✕</Text>
          </Pressable>
        </View>

        <TextInput
          onChangeText={(text) => setState((prev) => ({ ...prev, search: text }))}
          placeholder="Search exercises"
          placeholderTextColor="#6A6A6A"
          style={styles.searchInput}
          value={search}
        />

        <View style={styles.customRow}>
          <TextInput
            onChangeText={(text) => setState((prev) => ({ ...prev, customText: text }))}
            onSubmitEditing={handleAddCustom}
            placeholder="Add a custom exercise"
            placeholderTextColor="#6A6A6A"
            returnKeyType="done"
            style={styles.customInput}
            value={customText}
          />
          <Pressable onPress={handleAddCustom} style={styles.customAddButton}>
            <Text style={styles.customAddButtonText}>Add</Text>
          </Pressable>
        </View>

        {customList.length > 0 && (
          <View style={styles.chipRow}>
            {customList.map((name) => (
              <Pressable key={name} onPress={() => removeCustom(name)} style={styles.chip}>
                <Text style={styles.chipText}>{name} ✕</Text>
              </Pressable>
            ))}
          </View>
        )}

        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {visibleCategories.length === 0 ? (
            <Text style={styles.mutedText}>No exercises match "{search}".</Text>
          ) : (
            visibleCategories.map((category) => (
              <View key={category.name} style={styles.categoryBlock}>
                <Text style={styles.categoryTitle}>{category.name}</Text>
                {category.exercises.map((name) => {
                  const isChecked = checked.has(name);
                  return (
                    <Pressable
                      key={name}
                      onPress={() => toggleExercise(name)}
                      style={[styles.exerciseRow, isChecked && styles.exerciseRowChecked]}
                    >
                      <Text style={styles.exerciseText}>{name}</Text>
                      <Text style={styles.checkmark}>{isChecked ? '✓' : ''}</Text>
                    </Pressable>
                  );
                })}
              </View>
            ))
          )}
        </ScrollView>

        <Pressable
          disabled={selectedCount === 0}
          onPress={handleConfirm}
          style={[styles.confirmButton, selectedCount === 0 && styles.confirmButtonDisabled]}
        >
          <Text
            style={[styles.confirmButtonText, selectedCount === 0 && styles.confirmButtonTextDisabled]}
          >
            {selectedCount === 0 ? 'Select exercises' : `Add ${selectedCount} exercise${selectedCount === 1 ? '' : 's'}`}
          </Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    paddingTop: 56,
    paddingHorizontal: 20,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F5F5F5',
  },

  closeIcon: {
    fontSize: 18,
    color: '#8A8A8A',
  },

  searchInput: {
    backgroundColor: '#161616',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#F5F5F5',
    marginBottom: 10,
  },

  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },

  customInput: {
    flex: 1,
    backgroundColor: '#161616',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#F5F5F5',
  },

  customAddButton: {
    backgroundColor: '#242424',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  customAddButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F5F5F5',
  },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },

  chip: {
    backgroundColor: '#CFFF3D',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0A0A0A',
  },

  list: {
    flex: 1,
  },

  mutedText: {
    fontSize: 13,
    color: '#8A8A8A',
    marginTop: 12,
  },

  categoryBlock: {
    marginBottom: 18,
  },

  categoryTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#CFFF3D',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#161616',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
  },

  exerciseRowChecked: {
    backgroundColor: '#2A331A',
  },

  exerciseText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F5F5F5',
    flex: 1,
    marginRight: 8,
  },

  checkmark: {
    fontSize: 14,
    fontWeight: '700',
    color: '#CFFF3D',
    width: 16,
  },

  confirmButton: {
    backgroundColor: '#CFFF3D',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginVertical: 16,
  },

  confirmButtonDisabled: {
    backgroundColor: '#2A2A2A',
  },

  confirmButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0A0A0A',
  },

  confirmButtonTextDisabled: {
    color: '#6A6A6A',
  },
});
