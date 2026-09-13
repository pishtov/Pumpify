import { useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet } from 'react-native';

const PRESS_SCALE = 0.96;
const DARKEN_OPACITY = 0.18;

// Generic press feedback for every button in the app: a slight scale-down plus
// a dark overlay while pressed/held, so it works on top of any button color
// without needing to know the underlying background.
export default function AnimatedButton({ children, disabled, onPress, style, ...pressableProps }) {
  const scale = useRef(new Animated.Value(1)).current;
  const darken = useRef(new Animated.Value(0)).current;

  function handlePressIn(event) {
    onPress?.(event);
    Animated.parallel([
      Animated.timing(scale, {
        toValue: PRESS_SCALE,
        duration: 40,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(darken, {
        toValue: 1,
        duration: 40,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }

  function handlePressOut() {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 1,
        duration: 80,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(darken, {
        toValue: 0,
        duration: 80,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }

  return (
    <Pressable
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      {...pressableProps}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: '#000000',
              opacity: darken.interpolate({
                inputRange: [0, 1],
                outputRange: [0, DARKEN_OPACITY],
              }),
              borderRadius: style?.borderRadius,
            },
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}
