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
      <View style={styles.header}>
        <View style={styles.logoBar} />
        <Text style={styles.logoText}>PUMPIFY</Text>
      </View>

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
    backgroundColor: '#0A0A0A',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 56,
    paddingHorizontal: 20,
  },

  logoBar: {
    width: 4,
    height: 20,
    borderRadius: 2,
    backgroundColor: '#CFFF3D',
  },

  logoText: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#F5F5F5',
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