import { useRef } from 'react';
import { Animated, Pressable } from 'react-native';

const PRESS_SCALE = 0.8;
const PRESS_OPACITY = 0.5;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Press feedback tuned for small glyph buttons (✕ close, ‹ › arrows) rather
// than full-size buttons: dips scale and opacity instantly on touch, then
// springs back with a little overshoot bounce on release.
export default function AnimatedIconButton({ children, disabled, onPress, style, ...pressableProps }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  function handlePressIn() {
    scale.stopAnimation();
    opacity.stopAnimation();
    scale.setValue(PRESS_SCALE);
    opacity.setValue(PRESS_OPACITY);
  }

  function handlePressOut() {
    Animated.spring(scale, {
      toValue: 1,
      friction: 4,
      tension: 200,
      useNativeDriver: true,
    }).start();
    Animated.spring(opacity, {
      toValue: 1,
      friction: 6,
      tension: 200,
      useNativeDriver: true,
    }).start();
  }

  return (
    <AnimatedPressable
      disabled={disabled}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[style, { transform: [{ scale }], opacity }]}
      {...pressableProps}
    >
      {children}
    </AnimatedPressable>
  );
}
