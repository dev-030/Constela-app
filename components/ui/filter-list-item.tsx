import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColor } from '@/hooks/useColor';
import { BORDER_RADIUS } from '@/theme/globals';

type FilterListItemProps = {
  title: string;
  subtitle?: string;
  selected?: boolean;
  onPress?: () => void;
};

export function FilterListItem({ title, subtitle, selected, onPress }: FilterListItemProps) {
  const primary = useColor('primary');
  const text = useColor('text');
  const muted = useColor('textMuted');
  const border = useColor('border');

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.container,
        {
          borderColor: selected ? primary + '30' : border,
          backgroundColor: selected ? `${primary}15` : 'transparent',
        },
      ]}
    >
      <Text style={[styles.title, { color: selected ? primary : text }]}>
        {title}
      </Text>
      {subtitle && (
        <Text style={[styles.subtitle, { color: muted }]}>
          {subtitle}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: BORDER_RADIUS,
    borderWidth: 1,
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 4,
  },
});
