import { useState } from 'react';
import { Alert, Image, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { addCustomExercise } from '../db/db';
import { BODY_PART_COLORS } from '../data/bodyParts';
import AnimatedButton from '../components/AnimatedButton';
import AnimatedIconButton from '../components/AnimatedIconButton';

const EXERCISE_TYPES = [
  {
    key: 'strength',
    label: 'Strength',
    description: 'Logged as weight lifted, with option to add reps and sets.',
    iconOn: require('../../assets/icons/checkmark_on.png'),
    iconOff: require('../../assets/icons/checkmark_off.png'),
  },
  {
    key: 'hold',
    label: 'Hold',
    description: 'Logged as time held, with option to add weight.',
    iconOn: require('../../assets/icons/timer_on.png'),
    iconOff: require('../../assets/icons/timer_off.png'),
  },
  {
    key: 'cardio',
    label: 'Cardio',
    description: 'Logged as distance (or floors) covered in a time.',
    iconOn: require('../../assets/icons/energy_on.png'),
    iconOff: require('../../assets/icons/energy_off.png'),
  },
];

// Cardio exercises log distance/floors, not a muscle group, so "Cardio"
// itself isn't offered as a body part choice for Strength/Hold exercises.
const BODY_PARTS = BODY_PART_COLORS.filter(({ label }) => label !== 'Cardio');

function emptyState() {
  return { selectedType: null, name: '', bodyPart: null };
}

export default function CreateCustomExerciseModal({ onClose, onCreated, visible }) {
  const [state, setState] = useState(emptyState);
  const [saving, setSaving] = useState(false);
  const { selectedType, name, bodyPart } = state;

  function reset() {
    setState(emptyState());
  }

  function handleClose() {
    reset();
    onClose();
  }

  function selectType(key) {
    setState((prev) => ({ ...prev, selectedType: key, bodyPart: key === 'cardio' ? null : prev.bodyPart }));
  }

  const activeType = EXERCISE_TYPES.find((type) => type.key === selectedType);
  const needsBodyPart = selectedType === 'strength' || selectedType === 'hold';
  const canCreate = name.trim().length > 0 && selectedType != null && (!needsBodyPart || bodyPart != null);

  async function handleCreate() {
    if (!canCreate || saving) return;
    setSaving(true);
    try {
      await addCustomExercise({
        name: name.trim(),
        type: selectedType,
        bodyPart: needsBodyPart ? bodyPart : null,
      });
      onCreated?.({ name: name.trim(), type: selectedType, bodyPart: needsBodyPart ? bodyPart : null });
      reset();
      onClose();
    } catch (error) {
      Alert.alert(
        'Could not create exercise',
        error.message?.includes('UNIQUE')
          ? 'An exercise with this name already exists.'
          : error.message
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal animationType="none" onRequestClose={handleClose} transparent visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Create Custom Exercise</Text>
            <AnimatedIconButton accessibilityLabel="Close" hitSlop={10} onPress={handleClose}>
              <Text style={styles.closeIcon}>✕</Text>
            </AnimatedIconButton>
          </View>

          <Text style={styles.sectionLabel}>Exercise Type</Text>
          <View style={styles.typeRow}>
            {EXERCISE_TYPES.map((type) => {
              const isActive = selectedType === type.key;
              return (
                <Pressable
                  key={type.key}
                  onPress={() => selectType(type.key)}
                  style={[styles.typeButton, isActive && styles.typeButtonActive]}
                >
                  <Image
                    source={isActive ? type.iconOn : type.iconOff}
                    style={styles.typeButtonIcon}
                  />
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

          {needsBodyPart && (
            <>
              <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>Body Part</Text>
              <View style={styles.bodyPartGrid}>
                {BODY_PARTS.map(({ label, color }) => {
                  const isActive = bodyPart === label;
                  return (
                    <Pressable
                      key={label}
                      onPress={() => setState((prev) => ({ ...prev, bodyPart: label }))}
                      style={[styles.bodyPartButton, isActive && styles.bodyPartButtonActive]}
                    >
                      <View style={[styles.bodyPartDot, { backgroundColor: color }]} />
                      <Text
                        style={[
                          styles.bodyPartButtonText,
                          isActive && styles.bodyPartButtonTextActive,
                        ]}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}

          <AnimatedButton
            disabled={!canCreate || saving}
            onPress={handleCreate}
            style={[styles.createExerciseButton, (!canCreate || saving) && styles.createExerciseButtonDisabled]}
          >
            <Text
              style={[
                styles.createExerciseButtonText,
                (!canCreate || saving) && styles.createExerciseButtonTextDisabled,
              ]}
            >
              {saving ? 'Creating...' : 'Create Exercise'}
            </Text>
          </AnimatedButton>
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
    flexDirection: 'row',
    backgroundColor: '#1F1F1F',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },

  typeButtonIcon: {
    width: 16,
    height: 16,
    resizeMode: 'contain',
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

  bodyPartGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  bodyPartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1F1F1F',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },

  bodyPartButtonActive: {
    backgroundColor: '#2A331A',
    borderColor: '#CFFF3D',
  },

  bodyPartDot: {
    width: 12,
    height: 12,
    borderRadius: 5,
  },

  bodyPartButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D0D0D0',
  },

  bodyPartButtonTextActive: {
    color: '#CFFF3D',
  },

  createExerciseButton: {
    backgroundColor: '#CFFF3D',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },

  createExerciseButtonDisabled: {
    backgroundColor: '#2A2A2A',
  },

  createExerciseButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0A0A0A',
  },

  createExerciseButtonTextDisabled: {
    color: '#6A6A6A',
  },
});
