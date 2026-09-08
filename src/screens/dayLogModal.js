import { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { clearWorkoutLog, getAllSplitDays, getWorkoutLogDetail, logWorkoutDay } from '../db/db';

function formatDateHeading(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

// date is a 'YYYY-MM-DD' string or null (modal hidden). onChange fires after
// a log is created/changed/cleared so the calendar can refresh its dots.
export default function DayLogModal({ date, onChange, onClose, onCreateSplit }) {
  const [logDetail, setLogDetail] = useState(undefined); // undefined = loading, null = no log
  const [splitDays, setSplitDays] = useState([]);
  const [mode, setMode] = useState('detail'); // 'detail' | 'picker'

  useEffect(() => {
    if (!date) return;
    setMode('detail');
    setLogDetail(undefined);
    getWorkoutLogDetail(date).then(setLogDetail);
  }, [date]);

  useEffect(() => {
    if (!date || logDetail !== null) return;
    getAllSplitDays().then(setSplitDays);
  }, [date, logDetail]);

  function handleClear() {
    Alert.alert('Clear this log?', "This day will go back to not logged. This can't be undone.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          await clearWorkoutLog(date);
          onChange();
          onClose();
        },
      },
    ]);
  }

  async function handlePick(dayId) {
    await logWorkoutDay(date, dayId);
    onChange();
    onClose();
  }

  const showPicker = mode === 'picker' || logDetail === null;

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={!!date}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {date && <Text style={styles.heading}>{formatDateHeading(date)}</Text>}

          {logDetail === undefined ? (
            <Text style={styles.mutedText}>Loading…</Text>
          ) : showPicker ? (
            <>
              <Text style={styles.subheading}>What did you train?</Text>
              {splitDays.length === 0 ? (
                <>
                  <Text style={styles.mutedText}>
                    You haven't created a split yet. Create one first so you can log which
                    workout you did.
                  </Text>
                  <Pressable
                    onPress={() => {
                      onClose();
                      onCreateSplit();
                    }}
                    style={styles.primaryButton}
                  >
                    <Text style={styles.primaryButtonText}>Create a split</Text>
                  </Pressable>
                </>
              ) : (
                <ScrollView style={styles.optionList}>
                  {splitDays.map((option) => (
                    <Pressable
                      key={option.day_id}
                      onPress={() => handlePick(option.day_id)}
                      style={styles.optionRow}
                    >
                      <Text style={styles.optionText}>
                        {option.split_name} — {option.day_label}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
              {logDetail !== null && (
                <Pressable onPress={() => setMode('detail')} style={styles.secondaryButton}>
                  <Text style={styles.secondaryButtonText}>Back</Text>
                </Pressable>
              )}
            </>
          ) : (
            <>
              {logDetail.dayLabel ? (
                <>
                  <Text style={styles.subheading}>
                    {logDetail.splitName} — {logDetail.dayLabel}
                  </Text>
                  {logDetail.exercises.length === 0 ? (
                    <Text style={styles.mutedText}>No exercises in this day.</Text>
                  ) : (
                    logDetail.exercises.map((exercise) => (
                      <Text key={exercise.id} style={styles.exerciseText}>
                        • {exercise.name}
                      </Text>
                    ))
                  )}
                </>
              ) : (
                <Text style={styles.mutedText}>Marked as done — no specific workout selected.</Text>
              )}

              <Pressable onPress={() => setMode('picker')} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Change workout</Text>
              </Pressable>

              <Pressable onPress={handleClear} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonTextDestructive}>Clear log</Text>
              </Pressable>
            </>
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
    fontSize: 14,
    fontWeight: '700',
    color: '#CFFF3D',
    marginBottom: 12,
  },

  mutedText: {
    fontSize: 13,
    color: '#8A8A8A',
    marginBottom: 16,
    lineHeight: 18,
  },

  exerciseText: {
    fontSize: 13,
    color: '#D0D0D0',
    marginBottom: 6,
  },

  optionList: {
    marginBottom: 8,
  },

  optionRow: {
    backgroundColor: '#1F1F1F',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
  },

  optionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F5F5F5',
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
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },

  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8A8A8A',
  },

  secondaryButtonTextDestructive: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF6B6B',
  },

  closeButton: {
    alignItems: 'center',
    paddingTop: 8,
  },

  closeButtonText: {
    fontSize: 12,
    color: '#5A5A5A',
  },
});
