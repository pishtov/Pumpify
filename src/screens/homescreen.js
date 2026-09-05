import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const TABS = [
  { label: 'Home', icon: '⌂' },
  { label: 'Workouts', icon: '▤' },
  { label: 'Progress', icon: '▲' },
  { label: 'Profile', icon: '◉' },
];

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState('Home');

  return (
    <View style={styles.screen}>
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>{activeTab}</Text>
      </View>

      <View style={styles.bottomNav}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.label;

          return (
            <Pressable
              accessibilityLabel={tab.label}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              hitSlop={6}
              key={tab.label}
              onPress={() => setActiveTab(tab.label)}
              style={({ pressed }) => [styles.navItem, pressed && styles.pressed]}
            >
              <Text style={[styles.navIcon, isActive && styles.navActiveText]}>
                {tab.icon}
              </Text>
              <Text style={[styles.navLabel, isActive && styles.navActiveText]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },

  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  placeholderText: {
    fontSize: 16,
    color: '#8A8A8A',
  },

  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#242424',
    backgroundColor: '#0A0A0A',
  },

  navItem: {
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },

  navIcon: {
    fontSize: 18,
    color: '#8A8A8A',
  },

  navLabel: {
    fontSize: 10,
    color: '#8A8A8A',
  },

  navActiveText: {
    color: '#CFFF3D',
    fontWeight: '700',
  },

  pressed: {
    opacity: 0.7,
  },
});