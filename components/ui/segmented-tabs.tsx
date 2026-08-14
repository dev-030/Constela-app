import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useColor } from '@/hooks/useColor';

type SegmentedTabsProps = {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
};

function TabItem({ tab, isActive, onPress, muted }: { tab: string; isActive: boolean; onPress: () => void; muted: string }) {
  const animatedTextStyle = useAnimatedStyle(() => {
    return {
      color: withTiming(isActive ? '#FFF' : muted, {
        duration: 250,
        easing: Easing.out(Easing.ease),
      }),
    };
  }, [isActive, muted]);

  return (
    <Pressable style={styles.tabButton} onPress={onPress}>
      <Animated.Text style={[styles.tabText, animatedTextStyle]}>
        {tab}
      </Animated.Text>
    </Pressable>
  );
}

export function SegmentedTabs({ tabs, activeTab, onTabChange }: SegmentedTabsProps) {
  const primary = useColor('primary');
  const muted = useColor('textMuted');
  const background = useColor('card');

  const activeIndex = tabs.indexOf(activeTab);
  const translateX = useSharedValue(activeIndex * 100);

  useEffect(() => {
    translateX.value = withTiming(activeIndex * 100, {
      duration: 250,
      easing: Easing.out(Easing.ease),
    });
  }, [activeIndex]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: `${translateX.value}%` }],
      width: `${100 / tabs.length}%`,
    };
  });

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      <Animated.View
        style={[
          styles.activeIndicator,
          { backgroundColor: primary },
          animatedStyle,
        ]}
      />
      {tabs.map((tab) => (
        <TabItem
          key={tab}
          tab={tab}
          isActive={activeTab === tab}
          onPress={() => onTabChange(tab)}
          muted={muted}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 24,
    padding: 4,
    position: 'relative',
    marginHorizontal: 16,
  },
  activeIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    bottom: 4,
    borderRadius: 20,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  tabText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
