import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { saveProfile } from '../db/db';
import { EXPERIENCE_OPTIONS, GOAL_OPTIONS, SEX_OPTIONS } from '../data/profile';
import AnimatedButton from '../components/AnimatedButton';
import AnimatedIconButton from '../components/AnimatedIconButton';

const CURRENT_YEAR = new Date().getFullYear();

// Ranges are generous on purpose — they only exist to catch typos like an
// extra digit, not to judge anyone's numbers.
const NUMBER_FIELDS = {
  birthYear: { min: 1900, max: CURRENT_YEAR, integer: true, error: `Birth year must be 1900–${CURRENT_YEAR}.` },
  heightCm: { min: 50, max: 280, error: 'Height must be 50–280 cm.' },
  weightKg: { min: 20, max: 400, error: 'Weight must be 20–400 kg.' },
};

function formFromProfile(profile) {
  return {
    name: profile?.name ?? '',
    sex: profile?.sex ?? null,
    birthYear: profile?.birth_year != null ? String(profile.birth_year) : '',
    heightCm: profile?.height_cm != null ? String(profile.height_cm) : '',
    weightKg: profile?.weight_kg != null ? String(profile.weight_kg) : '',
    goal: profile?.goal ?? null,
    experience: profile?.experience ?? null,
  };
}

// Blank → null (field left empty), unparseable or out of range → undefined.
function parseNumberField(text, { min, max, integer }) {
  const trimmed = text.trim().replace(',', '.');
  if (trimmed === '') return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < min || value > max) return undefined;
  if (integer && !Number.isInteger(value)) return undefined;
  return value;
}

function OptionChips({ options, selected, onSelect }) {
  return (
    <View style={styles.chipGrid}>
      {options.map(({ key, label }) => {
        const isActive = selected === key;
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            key={key}
            // Tapping the active chip clears it, since every field is optional.
            onPress={() => onSelect(isActive ? null : key)}
            style={[styles.chip, isActive && styles.chipActive]}
          >
            <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function NumberInput({ label, unit, value, onChangeText, placeholder, invalid }) {
  return (
    <View style={styles.numberField}>
      <Text style={styles.numberLabel}>{label}</Text>
      <View style={[styles.numberInputRow, invalid && styles.numberInputRowInvalid]}>
        <TextInput
          keyboardType="decimal-pad"
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#6A6A6A"
          style={styles.numberInput}
          value={value}
        />
        {unit && <Text style={styles.numberUnit}>{unit}</Text>}
      </View>
    </View>
  );
}

export default function EditProfileModal({ onClose, onSaved, profile, visible }) {
  const [form, setForm] = useState(() => formFromProfile(profile));
  const [saving, setSaving] = useState(false);

  // Re-seed from the saved profile every time the modal opens, so cancelled
  // edits don't linger into the next open.
  useEffect(() => {
    if (visible) setForm(formFromProfile(profile));
  }, [visible, profile]);

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const parsed = Object.fromEntries(
    Object.entries(NUMBER_FIELDS).map(([key, rules]) => [key, parseNumberField(form[key], rules)])
  );
  const errors = Object.keys(NUMBER_FIELDS)
    .filter((key) => parsed[key] === undefined)
    .map((key) => NUMBER_FIELDS[key].error);
  const canSave = errors.length === 0 && !saving;

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    try {
      await saveProfile({
        name: form.name.trim() || null,
        sex: form.sex,
        birthYear: parsed.birthYear,
        heightCm: parsed.heightCm,
        weightKg: parsed.weightKg,
        goal: form.goal,
        experience: form.experience,
      });
      onSaved?.();
      onClose();
    } catch (error) {
      Alert.alert('Could not save profile', error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal animationType="none" onRequestClose={onClose} transparent visible={visible}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{profile ? 'Edit Profile' : 'Create Profile'}</Text>
            <AnimatedIconButton accessibilityLabel="Close" hitSlop={10} onPress={onClose}>
              <Text style={styles.closeIcon}>✕</Text>
            </AnimatedIconButton>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionLabel}>Name</Text>
            <TextInput
              onChangeText={(text) => setField('name', text)}
              placeholder="What should we call you?"
              placeholderTextColor="#6A6A6A"
              style={styles.nameInput}
              value={form.name}
            />

            <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>Body Stats</Text>
            <View style={styles.numberRow}>
              <NumberInput
                invalid={parsed.birthYear === undefined}
                label="Birth year"
                onChangeText={(text) => setField('birthYear', text)}
                placeholder="1998"
                value={form.birthYear}
              />
              <NumberInput
                invalid={parsed.heightCm === undefined}
                label="Height"
                onChangeText={(text) => setField('heightCm', text)}
                placeholder="180"
                unit="cm"
                value={form.heightCm}
              />
              <NumberInput
                invalid={parsed.weightKg === undefined}
                label="Weight"
                onChangeText={(text) => setField('weightKg', text)}
                placeholder="80"
                unit="kg"
                value={form.weightKg}
              />
            </View>
            {errors.map((error) => (
              <Text key={error} style={styles.errorText}>{error}</Text>
            ))}

            <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>Sex</Text>
            <OptionChips
              onSelect={(key) => setField('sex', key)}
              options={SEX_OPTIONS}
              selected={form.sex}
            />

            <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>Goal</Text>
            <OptionChips
              onSelect={(key) => setField('goal', key)}
              options={GOAL_OPTIONS}
              selected={form.goal}
            />

            <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>Experience</Text>
            <OptionChips
              onSelect={(key) => setField('experience', key)}
              options={EXPERIENCE_OPTIONS}
              selected={form.experience}
            />

            <Text style={styles.hint}>Every field is optional. Stored only on this device.</Text>
          </ScrollView>

          <AnimatedButton
            disabled={!canSave}
            onPress={handleSave}
            style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
          >
            <Text style={[styles.saveButtonText, !canSave && styles.saveButtonTextDisabled]}>
              {saving ? 'Saving...' : 'Save Profile'}
            </Text>
          </AnimatedButton>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#000000B0',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 48,
  },

  card: {
    backgroundColor: '#161616',
    borderRadius: 24,
    padding: 20,
    maxHeight: '100%',
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

  sectionLabelSpaced: {
    marginTop: 20,
  },

  nameInput: {
    backgroundColor: '#1F1F1F',
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 14,
    fontSize: 14,
    textAlign: 'center',
    color: '#F5F5F5',
  },

  numberRow: {
    flexDirection: 'row',
    gap: 8,
  },

  numberField: {
    flex: 1,
  },

  numberLabel: {
    fontSize: 12,
    color: '#8A8A8A',
    marginBottom: 6,
  },

  numberInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F1F1F',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },

  numberInputRowInvalid: {
    borderColor: '#FF6B5B',
  },

  numberInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 14,
    color: '#F5F5F5',
  },

  numberUnit: {
    fontSize: 12,
    color: '#6A6A6A',
    marginLeft: 4,
  },

  errorText: {
    fontSize: 12,
    color: '#FF6B5B',
    marginTop: 8,
  },

  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  chip: {
    backgroundColor: '#1F1F1F',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },

  chipActive: {
    backgroundColor: '#2A331A',
    borderColor: '#CFFF3D',
  },

  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D0D0D0',
  },

  chipTextActive: {
    color: '#CFFF3D',
  },

  hint: {
    fontSize: 12,
    color: '#8a8a8aa1',
    marginTop: 20,
  },

  saveButton: {
    backgroundColor: '#CFFF3D',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },

  saveButtonDisabled: {
    backgroundColor: '#2A2A2A',
  },

  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0A0A0A',
  },

  saveButtonTextDisabled: {
    color: '#6A6A6A',
  },
});
