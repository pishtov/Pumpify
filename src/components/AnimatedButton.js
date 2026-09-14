import { useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet } from 'react-native';

const PRESS_SCALE = 0.96;
const RELEASE_DURATION = 100;

const DARKEN_OPACITY = 0.2;

const DEFAULT_GLOW_COLOR = '#CFFF3D';
const GLOW_SPREAD = 5;
const GLOW_BORDER_WIDTH = 2;

// Generic press feedback for every button in the app: a slight scale-down,
// a dark overlay, and a glow ring while pressed/held. The pressed state
// snaps in instantly (no animation) so it reacts the moment a finger
// touches down, then eases back out smoothly on release.
export default function AnimatedButton({
  children,
  disabled = false,
  glowColor = DEFAULT_GLOW_COLOR,
  onPress,
  style,
  ...pressableProps
}) {
  const flatStyle = StyleSheet.flatten(style) ?? {};
  const buttonRadius = flatStyle.borderRadius ?? 0;

  const scale = useRef(new Animated.Value(1)).current;
  const pressed = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;

  function handlePressIn() {
    scale.stopAnimation();
    pressed.stopAnimation();
    glow.stopAnimation();

    // Snap straight to the pressed state, no easing, no delay.
    scale.setValue(PRESS_SCALE);
    pressed.setValue(1);
    glow.setValue(1);
  }

  function handlePressOut() {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 1,
        duration: RELEASE_DURATION,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(pressed, {
        toValue: 0,
        duration: RELEASE_DURATION,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(glow, {
        toValue: 0,
        duration: RELEASE_DURATION,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      {...pressableProps}
    >
      <Animated.View
        style={[
          styles.container,
          style,
          {
            transform: [{ scale }],
          },
        ]}
      >
        {/* Glow */}
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              top: -GLOW_SPREAD,
              bottom: -GLOW_SPREAD,
              left: -GLOW_SPREAD,
              right: -GLOW_SPREAD,

              borderRadius: buttonRadius + GLOW_SPREAD,
              borderWidth: GLOW_BORDER_WIDTH,
              borderColor: glowColor,

              opacity: glow.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.9],
              }),

              shadowColor: glowColor,
              shadowOffset: {
                width: 0,
                height: 0,
              },
              shadowOpacity: glow.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.8],
              }),
              shadowRadius: glow.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 15],
              }),

              elevation: glow.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 8],
              }),
            },
          ]}
        />

        {/* Content */}
        {children}

        {/* Dark pressed overlay */}
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: '#000000',
              borderRadius: buttonRadius,
              opacity: pressed.interpolate({
                inputRange: [0, 1],
                outputRange: [0, DARKEN_OPACITY],
              }),
            },
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'visible',
  },
});
