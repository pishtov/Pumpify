import { useRef } from 'react';
import { Animated, Easing, Pressable } from 'react-native';

const PRESS_SCALE = 0.94;
const RELEASE_DURATION = 100;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Simple press feedback: scales down instantly on touch, eases back on release.
export default function AnimatedButton({ children, disabled, onPress, style, ...pressableProps }) {
  const scale = useRef(new Animated.Value(1)).current;

  function handlePressIn() {
    scale.stopAnimation();
    scale.setValue(PRESS_SCALE);
  }

  function handlePressOut() {
    Animated.timing(scale, {
      toValue: 1,
      duration: RELEASE_DURATION,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }

  return (
    <AnimatedPressable
      disabled={disabled}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[style, { transform: [{ scale }] }]}
      {...pressableProps}
    >
      {children}
    </AnimatedPressable>
  );
}
