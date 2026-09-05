import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

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
              <Image
                source={isActive ? tab.iconOn : tab.iconOff}
                style={styles.navIcon}
              />
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
    backgroundColor: '#0C0C0C',
  },

  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  placeholderText: {
    fontSize: 16,
    color: '#8E8E93',
  },

  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#242424',
    backgroundColor: '#0C0C0C',
  },

  navItem: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },

  navIcon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },

  navLabel: {
    fontSize: 10,
    color: '#8E8E93',
  },

  navActiveText: {
    color: '#D2FF00',
    fontWeight: '700',
  },

  pressed: {
    opacity: 0.7,
  },
});