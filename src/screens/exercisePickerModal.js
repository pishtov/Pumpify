import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, SectionList, StyleSheet, Text, TextInput, View } from 'react-native';
import { EXERCISE_CATEGORIES } from '../data/exercises';
import { deleteCustomExercise, getCustomExercises } from '../db/db';
import AnimatedButton from '../components/AnimatedButton';
import CreateCustomExerciseModal from './createCustomExerciseModal';

function emptyState() {
  return { checked: new Set(), search: '', activeFilter: 'All' };
}

// onConfirm receives an array of checked exercise names.
export default function ExercisePickerModal({ visible, onClose, onConfirm }) {
  const [state, setState] = useState(emptyState);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [customExercises, setCustomExercises] = useState([]);
  const { checked, search, activeFilter } = state;

  const loadCustomExercises = useCallback(async () => {
    setCustomExercises(await getCustomExercises());
  }, []);

  useEffect(() => {
    if (visible) loadCustomExercises();
  }, [visible, loadCustomExercises]);

  // Built-in categories plus any user-created exercises, grouped in with the
  // matching body part (or a "Cardio" category for cardio-type exercises).
  const mergedCategories = useMemo(() => {
    const categories = EXERCISE_CATEGORIES.map((category) => ({
      name: category.name,
      exercises: [...category.exercises],
    }));
    for (const custom of customExercises) {
      const categoryName = custom.type === 'cardio' ? 'Cardio' : custom.body_part;
      let category = categories.find((c) => c.name === categoryName);
      if (!category) {
        category = { name: categoryName, exercises: [] };
        categories.push(category);
      }
      if (!category.exercises.includes(custom.name)) {
        category.exercises.push(custom.name);
      }
    }
    return categories;
  }, [customExercises]);

  const filters = useMemo(
    () => ['All', ...mergedCategories.map((category) => category.name)],
    [mergedCategories]
  );

  const customExerciseNames = useMemo(
    () => new Set(customExercises.map((exercise) => exercise.name)),
    [customExercises]
  );

  function handleLongPressExercise(name) {
    if (!customExerciseNames.has(name)) return;
    Alert.alert('Delete Exercise', `Delete "${name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteCustomExercise(name);
          setState((prev) => {
            const next = new Set(prev.checked);
            next.delete(name);
            return { ...prev, checked: next };
          });
          loadCustomExercises();
        },
      },
    ]);
  }

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

  function handleConfirm() {
    onConfirm([...checked]);
    reset();
  }

  const categoriesForFilter =
    activeFilter === 'All'
      ? mergedCategories
      : mergedCategories.filter((category) => category.name === activeFilter);

  const query = search.trim().toLowerCase();
  const visibleCategories = categoriesForFilter
    .map((category) => ({
      ...category,
      exercises: query
        ? category.exercises.filter((name) => name.toLowerCase().includes(query))
        : category.exercises,
    }))
    .filter((category) => category.exercises.length > 0);

  const selectedCount = checked.size;
  const sections = visibleCategories.map((category) => ({
    title: category.name,
    data: category.exercises,
  }));

  return (
    <Modal animationType="none" onRequestClose={handleClose} transparent visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Choose an Exercise</Text>
            <Pressable accessibilityLabel="Close" hitSlop={10} onPress={handleClose}>
              <Text style={styles.closeIcon}>✕</Text>
            </Pressable>
          </View>

          <AnimatedButton onPress={() => setCreateModalVisible(true)} style={styles.createButton}>
            <Text style={styles.createButtonText}>+ Create New Exercise</Text>
          </AnimatedButton>

          <TextInput
            onChangeText={(text) => setState((prev) => ({ ...prev, search: text }))}
            placeholder="Search exercises..."
            placeholderTextColor="#6A6A6A"
            style={styles.searchInput}
            value={search}
          />

          <Text style={styles.filterLabel}>Filter by Body Part:</Text>
          <View style={styles.filterRow}>
            {filters.map((filter) => {
              const isActive = activeFilter === filter;
              return (
                <Pressable
                  key={filter}
                  onPress={() => setState((prev) => ({ ...prev, activeFilter: filter }))}
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                >
                  <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                    {filter}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <SectionList
            ListEmptyComponent={
              <Text style={styles.mutedText}>No exercises match "{search}".</Text>
            }
            initialNumToRender={16}
            keyExtractor={(name) => name}
            renderItem={({ item: name }) => {
              const isChecked = checked.has(name);
              return (
                <Pressable
                  onLongPress={() => handleLongPressExercise(name)}
                  onPress={() => toggleExercise(name)}
                  style={[styles.exerciseRow, isChecked && styles.exerciseRowChecked]}
                >
                  <Text style={styles.exerciseText}>{'+ ' + name}</Text>
                  <Text style={styles.checkmark}>{isChecked ? '✓' : ''}</Text>
                </Pressable>
              );
            }}
            renderSectionHeader={({ section }) =>
              activeFilter === 'All' ? (
                <Text style={styles.categoryTitle}>{section.title}</Text>
              ) : null
            }
            sections={sections}
            showsVerticalScrollIndicator={false}
            style={styles.list}
          />

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
      </View>

      <CreateCustomExerciseModal
        onClose={() => setCreateModalVisible(false)}
        onCreated={loadCustomExercises}
        visible={createModalVisible}
      />
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
    maxHeight: '85%',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F5F5F5',
  },

  closeIcon: {
    fontSize: 18,
    color: '#8A8A8A',
  },

  createButton: {
    backgroundColor: '#1F1F1F',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#CFFF3D',
  },

  createButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#CFFF3D',
  },

  searchInput: {
    backgroundColor: '#1F1F1F',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#F5F5F5',
    marginBottom: 14,
  },

  filterLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8A8A8A',
    marginBottom: 8,
  },

  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },

  filterChip: {
    backgroundColor: '#1F1F1F',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  filterChipActive: {
    backgroundColor: '#CFFF3D',
  },

  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D0D0D0',
  },

  filterChipTextActive: {
    color: '#0A0A0A',
  },

  list: {
    marginBottom: 8,
  },

  mutedText: {
    fontSize: 13,
    color: '#8A8A8A',
    marginTop: 12,
  },

  categoryTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#CFFF3D',
    marginTop: 4,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1F1F1F',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 14,
  },

  exerciseRowChecked: {
    backgroundColor: '#2A331A',
  },

  exerciseText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F5F5F5',
    flex: 1,
    marginRight: 8,
    textAlign: 'center', 
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
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
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
