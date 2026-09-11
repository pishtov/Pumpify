import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getAllSessionExercises, getWorkoutDaysInRange, restoreSessionExercises } from '../db/db';
import { toDateStr } from '../utils/date';
import WorkoutSessionScreen from './workoutSessionScreen';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

// Builds a real month grid using JS Date math, so weekday alignment and days-
// in-month (including leap years) are always correct — no hardcoded layouts.
function buildMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (firstDay.getDay() + 6) % 7; // convert Sunday-start to Monday-start
  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

function Calendar({ onSelectDay }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [doneDays, setDoneDays] = useState(new Set());

  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();
  const weeks = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  const isFutureDay = (day) =>
    viewYear > today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth > today.getMonth()) ||
    (isCurrentMonth && day > today.getDate());

  const loadMonth = useCallback(async () => {
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const start = toDateStr(viewYear, viewMonth, 1);
    const end = toDateStr(viewYear, viewMonth, daysInMonth);
    const dates = await getWorkoutDaysInRange(start, end);
    setDoneDays(new Set(dates.map((d) => Number(d.slice(-2)))));
  }, [viewYear, viewMonth]);

  useEffect(() => {
    loadMonth();
  }, [loadMonth]);

  const workoutCount = doneDays.size;

  function changeMonth(delta) {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setViewMonth(m);
    setViewYear(y);
    setSelectedDay(null);
  }

  function handleDayPress(day) {
    setSelectedDay(day);
    if (isFutureDay(day)) return;
    onSelectDay(toDateStr(viewYear, viewMonth, day));
  }

  return (
    <View style={styles.card}>
      <View style={styles.calendarHeaderRow}>
        <View style={styles.monthNavRow}>
          <Pressable accessibilityLabel="Previous month" hitSlop={8} onPress={() => changeMonth(-1)}>
            <Text style={styles.monthNavArrow}>‹</Text>
          </Pressable>
          <Text style={styles.monthTitle}>{MONTH_NAMES[viewMonth]} {viewYear}</Text>
          <Pressable accessibilityLabel="Next month" hitSlop={8} onPress={() => changeMonth(1)}>
            <Text style={styles.monthNavArrow}>›</Text>
          </Pressable>
        </View>
        <Text style={styles.workoutCount}>{workoutCount} WORKOUTS</Text>
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((d, i) => (
          <Text key={i} style={styles.weekdayText}>{d}</Text>
        ))}
      </View>

      {weeks.map((week, wi) => (
        <View key={wi} style={styles.weekRow}>
          {week.map((day, di) => {
            if (!day) return <View key={di} style={styles.dayCell} />;

            const isFuture = isFutureDay(day);
            const isToday = isCurrentMonth && day === today.getDate();
            const done = doneDays.has(day);
            const isSelected = selectedDay === day;

            return (
              <View key={di} style={styles.dayCell}>
                <Pressable
                  accessibilityLabel={`${MONTH_NAMES[viewMonth]} ${day}`}
                  accessibilityRole="button"
                  onPress={() => handleDayPress(day)}
                  style={[
                    styles.dayPip,
                    done && styles.dayPipDone,
                    isFuture && styles.dayPipFuture,
                    isToday && styles.dayPipToday,
                    isSelected && styles.dayPipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      done ? styles.dayTextDone : isFuture ? styles.dayTextFuture : styles.dayTextRest,
                    ]}
                  >
                    {day}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function NavTabButton({ tab, isActive, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  const bgOpacity = useRef(new Animated.Value(isActive ? 1 : 0)).current;
  const liftY = useRef(new Animated.Value(isActive ? -4 : 0)).current;

  useEffect(() => {
    Animated.timing(bgOpacity, {
      toValue: isActive ? 1 : 0,
      duration: 160,
      useNativeDriver: true,
    }).start();

    Animated.spring(liftY, {
      toValue: isActive ? -4 : 0,
      friction: 7,
      tension: 120,
      useNativeDriver: true,
    }).start();
  }, [isActive]);

  function handlePress() {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.85,
        duration: 10,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 20,
        tension: 200,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  }

  return (
    <Pressable
      accessibilityLabel={tab.label}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      hitSlop={6}
      onPress={handlePress}
    >
      <Animated.View
        style={[
          styles.navItem,
          { transform: [{ scale }, { translateY: liftY }] },
        ]}
      >
        <Animated.View style={[styles.navItemBackground, { opacity: bgOpacity }]} />
        <Image
          fadeDuration={0}
          source={isActive ? tab.iconOn : tab.iconOff}
          style={styles.navIcon}
        />
        <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
          {tab.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const TABS = [
  {
    label: 'Home',
    iconOn: require('../../assets/icons/house_on.png'),
    iconOff: require('../../assets/icons/house_off.png'),
  },
  {
    label: 'Workouts',
    iconOn: require('../../assets/icons/dumbbell_on.png'),
    iconOff: require('../../assets/icons/dumbbell_off.png'),
  },
  {
    label: 'Progress',
    iconOn: require('../../assets/icons/chart_on.png'),
    iconOff: require('../../assets/icons/chart_off.png'),
  },
  {
    label: 'Profile',
    iconOn: require('../../assets/icons/profile_on.png'),
    iconOff: require('../../assets/icons/profile_off.png'),
  },
];

// TEMPORARY PLACEHOLDER — Workouts/Progress screens don't exist yet.
function PlaceholderScreen({ label }) {
  return (
    <View style={styles.card}>
      <Text style={styles.placeholderText}>{label}</Text>
    </View>
  );
}

function ProfileScreen() {
  async function handleExport() {
    try {
      const rows = await getAllSessionExercises();
      const payload = JSON.stringify(
        { exportedAt: new Date().toISOString(), sessionExercises: rows },
        null,
        2
      );
      const file = new File(Paths.cache, `pumpify-backup-${Date.now()}.json`);
      file.create();
      file.write(payload);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'application/json',
          dialogTitle: 'Export Pumpify data',
        });
      } else {
        Alert.alert('Export ready', `Saved to ${file.uri}`);
      }
    } catch (error) {
      Alert.alert('Export failed', error.message);
    }
  }

  async function handleImport() {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
      if (result.canceled) return;

      const file = new File(result.assets[0].uri);
      const text = await file.text();
      const data = JSON.parse(text);

      if (!Array.isArray(data.sessionExercises)) {
        throw new Error('This file is not a valid Pumpify backup.');
      }

      await restoreSessionExercises(data.sessionExercises);
      Alert.alert('Import complete', `Restored ${data.sessionExercises.length} logged exercises.`);
    } catch (error) {
      Alert.alert('Import failed', error.message);
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.profileSectionTitle}>Backup & Restore</Text>
      <Text style={styles.profileSectionSubtitle}>
        Your data is stored only on this device. Export it to keep a copy, or import a
        previous backup.
      </Text>

      <Pressable onPress={handleExport} style={styles.profileButton}>
        <Text style={styles.profileButtonText}>Export data</Text>
      </Pressable>

      <Pressable onPress={handleImport} style={[styles.profileButton, styles.profileButtonSecondary]}>
        <Text style={[styles.profileButtonText, styles.profileButtonTextSecondary]}>
          Import data
        </Text>
      </Pressable>
    </View>
  );
}

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState('Home');
  const [viewingDate, setViewingDate] = useState(null);

  if (viewingDate) {
    return (
      <WorkoutSessionScreen
        date={viewingDate}
        onBack={() => setViewingDate(null)}
        onChangeDate={setViewingDate}
      />
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.logoBar} />
        <Text style={styles.logoText}>PUMPIFY</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeTab === 'Home' && <Calendar onSelectDay={setViewingDate} />}
        {activeTab === 'Profile' && <ProfileScreen />}
        {(activeTab === 'Workouts' || activeTab === 'Progress') && (
          <PlaceholderScreen label={activeTab} />
        )}
      </ScrollView>

      <View style={styles.bottomNav}>
        {TABS.map((tab) => (
          <NavTabButton
            isActive={activeTab === tab.label}
            key={tab.label}
            onPress={() => setActiveTab(tab.label)}
            tab={tab}
          />
        ))}
      </View>
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
    gap: 8,
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },

  logoBar: {
    width: 4,
    height: 20,
    borderRadius: 2,
    backgroundColor: '#CFFF3D',
  },

  logoText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#F5F5F5',
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },

  card: {
    backgroundColor: '#161616',
    borderRadius: 24,
    padding: 16,
  },

  placeholderText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8A8A8A',
    textAlign: 'center',
    paddingVertical: 40,
  },

  profileSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F5F5F5',
    marginBottom: 8,
  },

  profileSectionSubtitle: {
    fontSize: 13,
    color: '#8A8A8A',
    lineHeight: 18,
    marginBottom: 20,
  },

  profileButton: {
    backgroundColor: '#CFFF3D',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },

  profileButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0A0A0A',
  },

  profileButtonSecondary: {
    backgroundColor: '#242424',
  },

  profileButtonTextSecondary: {
    color: '#F5F5F5',
  },

  calendarHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  monthNavArrow: {
    fontSize: 18,
    color: '#8A8A8A',
    paddingHorizontal: 4,
  },

  monthTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F5F5F5',
  },

  workoutCount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#CFFF3D',
  },

  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },

  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    color: '#8A8A8A',
  },

  weekRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },

  dayCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },

  dayPip: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3A3A3A',
  },

  dayPipDone: {
    backgroundColor: '#CFFF3D',
    boxShadow: '0px 0px 6px #CFFF3D',
  },

  dayPipFuture: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#242424',
  },

  dayPipToday: {
    borderWidth: 2,
    borderColor: '#CFFF3D',
  },

  dayPipSelected: {
    borderWidth: 2,
    borderColor: '#F5F5F5',
  },

  dayText: {
    fontSize: 16,
    fontWeight: '700',
  },

  dayTextDone: {
    color: '#0A0A0A',
  },

  dayTextFuture: {
    color: '#8A8A8A',
    fontWeight: '400',
  },

  dayTextRest: {
    color: '#9A9A9A',
  },

  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#242424',
    backgroundColor: '#161616',
  },

  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },

  navItemBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 14,
    backgroundColor: '#d0ff0060',
  },

  navIcon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },

  navLabel: {
    fontSize: 10,
    color: '#8A8A8A',
  },

  navLabelActive: {
    color: '#D2FF00',
    fontWeight: '700',
  },
});