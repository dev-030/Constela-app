import React, { useState, useEffect } from 'react';
import { StyleSheet, View, LayoutChangeEvent } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  runOnJS,
  clamp,
} from 'react-native-reanimated';
import { useColor } from '@/hooks/useColor';

type RangeSliderProps = {
  min: number;
  max: number;
  low?: number;
  high?: number;
  onValueChanged: (low: number, high?: number) => void;
  single?: boolean;
};

const THUMB_SIZE = 24;

export function RangeSlider({ min, max, low = min, high = max, onValueChanged, single = false }: RangeSliderProps) {
  const primary = useColor('primary');
  const border = useColor('border');

  const [width, setWidth] = useState(0);

  // Shared values
  const lowValue = useSharedValue(low);
  const highValue = useSharedValue(high);

  const lowX = useSharedValue(0);
  const highX = useSharedValue(0);
  
  const lowStartX = useSharedValue(0);
  const highStartX = useSharedValue(0);

  // Initialize positions based on values when layout is known
  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width - THUMB_SIZE;
    setWidth(w);
    lowX.value = ((low - min) / (max - min)) * w;
    lowValue.value = low;
    if (!single) {
      highX.value = ((high - min) / (max - min)) * w;
      highValue.value = high;
    }
  };

  // Re-derive thumb positions whenever props change (e.g. parent state update, reset)
  useEffect(() => {
    if (width === 0) return;
    lowX.value = ((low - min) / (max - min)) * width;
    lowValue.value = low;
    if (!single) {
      highX.value = ((high - min) / (max - min)) * width;
      highValue.value = high;
    }
  }, [low, high, width, min, max, single]);

  const updateValues = (isLow: boolean, x: number) => {
    const percentage = x / width;
    const value = min + percentage * (max - min);
    if (isLow) {
      onValueChanged(Math.round(value), single ? undefined : Math.round(highValue.value));
    } else {
      onValueChanged(Math.round(lowValue.value), Math.round(value));
    }
  };

  const lowPan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onBegin(() => {
      lowStartX.value = lowX.value;
    })
    .onUpdate((e) => {
      if (width === 0) return;
      const newX = clamp(
        lowStartX.value + e.translationX,
        0,
        width
      );
      lowX.value = newX;
      lowValue.value = min + (newX / width) * (max - min);
      runOnJS(updateValues)(true, newX);
    })
    .onEnd(() => {
      runOnJS(updateValues)(true, lowX.value);
    });

  const highPan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onBegin(() => {
      highStartX.value = highX.value;
    })
    .onUpdate((e) => {
      if (width === 0 || single) return;
      const newX = clamp(
        highStartX.value + e.translationX,
        lowX.value + THUMB_SIZE,
        width
      );
      highX.value = newX;
      highValue.value = min + (newX / width) * (max - min);
      runOnJS(updateValues)(false, newX);
    })
    .onEnd(() => {
      runOnJS(updateValues)(false, highX.value);
    });

  const lowAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: lowX.value }],
  }));

  const highAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: highX.value }],
  }));

  const trackAnimatedStyle = useAnimatedStyle(() => {
    if (single) {
      return {
        left: 0,
        width: lowX.value + THUMB_SIZE / 2,
      };
    }
    return {
      left: lowX.value + THUMB_SIZE / 2,
      width: highX.value - lowX.value,
    };
  });

  return (
    <View style={styles.container} onLayout={onLayout}>
      {/* Background Track */}
      <View style={[styles.trackBackground, { backgroundColor: border }]} />

      {/* Active Track */}
      <Animated.View style={[styles.trackActive, { backgroundColor: primary }, trackAnimatedStyle]} />

      {/* Low Thumb */}
      <GestureDetector gesture={lowPan}>
        <Animated.View hitSlop={20} style={[styles.thumb, { backgroundColor: primary }, lowAnimatedStyle]} />
      </GestureDetector>

      {/* High Thumb */}
      {!single && (
        <GestureDetector gesture={highPan}>
          <Animated.View hitSlop={20} style={[styles.thumb, { backgroundColor: primary }, highAnimatedStyle]} />
        </GestureDetector>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: THUMB_SIZE,
    justifyContent: 'center',
    marginVertical: 16,
  },
  trackBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 8,
    borderRadius: 4,
  },
  trackActive: {
    position: 'absolute',
    height: 8,
    borderRadius: 4,
  },
  thumb: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 2,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
});
