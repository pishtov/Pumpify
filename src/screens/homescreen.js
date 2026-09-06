import { useEffect, useRef, useState } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';

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

      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>{activeTab}</Text>
      </View>

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