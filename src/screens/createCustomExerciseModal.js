import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

const EXERCISE_TYPES = [
  {
    key: 'strength',
    label: 'Strength',
    description: 'Logged as weight lifted, with option to add reps and sets.',
  },
  {
    key: 'hold',
    label: 'Hold',
    description: 'Logged as time held, with option to add weight.',
  },
  {
    key: 'cardio',
    label: 'Cardio',
    description: 'Logged as distance (or floors) covered in a time.',
  },
];

function emptyState() {
  return { selectedType: null, name: '' };
}

export default function CreateCustomExerciseModal({ visible, onClose }) {
  const [state, setState] = useState(emptyState);
  const { selectedType, name } = state;

  function reset() {
    setState(emptyState());
  }

  function handleClose() {
    reset();
    onClose();
  }

  const activeType = EXERCISE_TYPES.find((type) => type.key === selectedType);

  return (
    <Modal animationType="none" onRequestClose={handleClose} transparent visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Create Custom Exercise</Text>
            <Pressable accessibilityLabel="Close" hitSlop={10} onPress={handleClose}>
              <Text style={styles.closeIcon}>✕</Text>
            </Pressable>
          </View>

          <Text style={styles.sectionLabel}>Exercise Type</Text>
          <View style={styles.typeRow}>
            {EXERCISE_TYPES.map((type) => {
              const isActive = selectedType === type.key;
              return (
                <Pressable
                  key={type.key}
                  onPress={() => setState((prev) => ({ ...prev, selectedType: type.key }))}
                  style={[styles.typeButton, isActive && styles.typeButtonActive]}
                >
                  <Text style={[styles.typeButtonText, isActive && styles.typeButtonTextActive]}>
                    {type.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {activeType && (
            <Text style={styles.typeDescription}>{activeType.description}</Text>
          )}

          <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>Exercise Name</Text>
          <TextInput
            onChangeText={(text) => setState((prev) => ({ ...prev, name: text }))}
            placeholder="e.g. Bulgarian Split Squat"
            placeholderTextColor="#6A6A6A"
            style={styles.nameInput}
            value={name}
          />
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
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F5F5F5',
  },

  closeIcon: {
    fontSize: 18,
    color: '#8A8A8A',
  },

  sectionLabel: {
    fontSize: 18,
    fontWeight: '400',
    color: '#8A8A8A',
    marginBottom: 12,
  },

  typeRow: {
    flexDirection: 'row',
    gap: 8,
  },

  typeButton: {
    flex: 1,
    backgroundColor: '#1F1F1F',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },

  typeButtonActive: {
    backgroundColor: '#2A331A',
    borderColor: '#CFFF3D',
  },

  typeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D0D0D0',
  },

  typeButtonTextActive: {
    color: '#CFFF3D',
  },

  typeDescription: {
    fontSize: 12,
    color: '#8a8a8aa1',
    lineHeight: 18,
    marginTop: 14,
  },

  sectionLabelSpaced: {
    marginTop: 20,
  },

  nameInput: {
    backgroundColor: '#1F1F1F',
    borderRadius: 12,
    paddingTop: 18,
    paddingBottom: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    textAlign: 'center',
    color: '#F5F5F5',
  },
});
