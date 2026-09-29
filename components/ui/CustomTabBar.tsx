import React from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColor } from '@/hooks/useColor';
import { useColorScheme } from '@/hooks/useColorScheme';

const SCREEN_CORNER_RADIUS = 44;
const GAP = 4;

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const primary = useColor('primary');
  const inactiveColor = useColor('tabIconDefault');
  const { width } = useWindowDimensions();
  const isCompact = width < 375;
  const iconCircleSize = isCompact ? 44 : 52;

  // Active icon circle background — matches reference image exactly
  const activeCircleBg = isDark ? '#3A3A3C' : '#F0F0F0';

  const safeBottom = insets.bottom;

  return (
    <View
      style={[
        styles.outerWrapper,
        {
          width: width - GAP * 2,
          marginHorizontal: GAP,
          marginBottom: GAP,
          backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          borderBottomLeftRadius: SCREEN_CORNER_RADIUS,
          borderBottomRightRadius: SCREEN_CORNER_RADIUS,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: isDark ? 0.5 : 0.1,
          shadowRadius: 12,
          elevation: 20,
          ...(isDark && {
            borderWidth: 0.5,
            borderColor: '#38383A',
          }),
        },
      ]}
    >
      {/* Tab icons + labels row */}
      <View style={[styles.tabRow, isCompact && styles.compactTabRow]}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? (options.tabBarLabel as string)
              : options.title !== undefined
              ? options.title
              : route.name;

          const isFocused = state.index === index;
          const iconColor = isFocused ? primary : inactiveColor;
          const labelColor = isFocused ? primary : inactiveColor;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({ type: 'tabLongPress', target: route.key });
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              onLongPress={onLongPress}
              style={[styles.tab, isCompact && styles.compactTab]}
            >
              {/* Circle highlight only for active tab */}
              <View
                style={[
                  styles.iconCircle,
                  { width: iconCircleSize, height: iconCircleSize, borderRadius: iconCircleSize / 2 },
                  isFocused && { backgroundColor: activeCircleBg },
                ]}
              >
                {options.tabBarIcon &&
                  options.tabBarIcon({ focused: isFocused, color: iconColor, size: isCompact ? 21 : 24 })}
              </View>
              <Text
                style={[
                  styles.label,
                  { color: labelColor },
                  isFocused && styles.labelActive,
                  isCompact && styles.compactLabel,
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Safe area spacer (home indicator on iOS) */}
      {safeBottom > 0 && <View style={{ height: safeBottom * 0.5 }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    position: 'absolute',
    bottom: 0,
    overflow: 'hidden',
  },
  tabRow: {
    flexDirection: 'row',
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  compactTabRow: {
    paddingTop: 7,
    paddingBottom: 7,
  },
  compactTab: {
    gap: 3,
  },
  // Perfect circle — width === height, borderRadius = half
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  labelActive: {
    fontWeight: '700',
  },
  compactLabel: {
    fontSize: 10,
  },
});
