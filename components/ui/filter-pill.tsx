import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useColor } from '@/hooks/useColor';
import { BORDER_RADIUS } from '@/theme/globals';

type FilterPillProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: React.ReactNode;
};

export function FilterPill({ label, selected, onPress, icon }: FilterPillProps) {
  const primary = useColor('primary');
  const text = useColor('text');
  const border = useColor('border');
  const background = useColor('background');

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.container,
        {
          backgroundColor: selected ? primary : 'transparent',
          borderColor: selected ? primary : border,
        },
      ]}
    >
      {icon}
      <Text
        style={[
          styles.label,
          {
            color: selected ? '#FFF' : text,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
});
