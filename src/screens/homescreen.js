import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

// TEMPORARY PLACEHOLDER — there are no workout splits or logging yet, so this
// just seeds a plausible on/off pattern per day so the calendar has something
// to render. Once real workout logging exists, replace this with a lookup
// against the actual log (e.g. hasLoggedWorkout(year, month, day)).
function didWorkout(year, month, day) {
  const seed = (day * 31 + month * 7 + (year % 100)) % 9;
  return seed !== 0 && seed !== 4;
}

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

function Calendar() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(today.getDate());

  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();
  const weeks = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  const isFutureDay = (day) =>
    viewYear > today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth > today.getMonth()) ||
    (isCurrentMonth && day > today.getDate());

  const workoutCount = useMemo(() => {
    let count = 0;
    weeks.flat().forEach((day) => {
      if (day && !isFutureDay(day) && didWorkout(viewYear, viewMonth, day)) count++;
    });
    return count;
  }, [weeks, viewYear, viewMonth]);

  function changeMonth(delta) {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setViewMonth(m);
    setViewYear(y);
    setSelectedDay(null);
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
            const done = !isFuture && didWorkout(viewYear, viewMonth, day);
            const isSelected = selectedDay === day;

            return (
              <View key={di} style={styles.dayCell}>
                <Pressable
                  accessibilityLabel={`${MONTH_NAMES[viewMonth]} ${day}`}
                  accessibilityRole="button"
                  onPress={() => setSelectedDay(day)}
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
        duration: 80,
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
        <Image source={isActive ? tab.iconOn : tab.iconOff} style={styles.navIcon} />
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

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState('Home');

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.logoBar} />
        <Text style={styles.logoText}>PUMPIFY</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Calendar />
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
    fontSize: 12,
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
    fontSize: 11,
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
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3A3A3A',
  },

  dayPipDone: {
    backgroundColor: '#CFFF3D',
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
    fontSize: 12,
    fontWeight: '700',
  },

  dayTextDone: {
    color: '#0A0A0A',
  },

  dayTextFuture: {
    color: '#8A8A8A',
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