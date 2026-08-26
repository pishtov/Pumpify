import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  const [activeSection, setActiveSection] = useState('Calendar');

  const sections = [
    { label: 'Calendar', icon: '▦' },
    { label: 'Heatmap', icon: '♨' },
    { label: 'Summary', icon: '▥' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Pumpify</Text>
        <Pressable
          accessibilityLabel="Open settings"
          accessibilityRole="button"
          hitSlop={10}
          onPress={() => {}}
          style={({ pressed }) => [styles.settingsButton, pressed && styles.pressed]}
        >
        </Pressable>
      </View>

      <View style={styles.sectionRow}>
        {sections.map((section) => {
          const isActive = activeSection === section.label;

          return (
            <Pressable
              accessibilityLabel={`${section.label} section`}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              key={section.label}
              onPress={() => setActiveSection(section.label)}
              style={({ pressed }) => [
                styles.sectionButton,
                isActive && styles.activeSectionButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.sectionIcon, isActive && styles.activeSectionText]}>
                {section.icon}
              </Text>
              <Text style={[styles.sectionText, isActive && styles.activeSectionText]}>
                {section.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#010001',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    paddingTop: 48,
    paddingLeft: 20,
    paddingRight: 20,
  },

  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },

  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#FFF600',
  },

  settingsButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
  },

  sectionRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
  },

  sectionButton: {
    flex: 1,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#202637',
    borderRadius: 8,
    backgroundColor: '#111114',
  },

  activeSectionButton: {
    borderColor: '#ffe600',
    backgroundColor: '#776b00',
  },

  sectionIcon: {
    fontSize: 19,
    color: '#93A0B8',
  },

  sectionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#93A0B8',
  },

  activeSectionText: {
    color: '#353535',
  },

  pressed: {
    opacity: 0.7,
  },
});