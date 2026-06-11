import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColor } from '@/hooks/useColor';
import { BORDER_RADIUS } from '@/theme/globals';

type FilterCardProps = {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  selected?: boolean;
  onPress?: () => void;
};

export function FilterCard({ title, subtitle, icon, selected, onPress }: FilterCardProps) {
  const primary = useColor('primary');
  const text = useColor('text');
  const muted = useColor('textMuted');
  const border = useColor('border');
  const background = useColor('card');

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.container,
        {
          backgroundColor: selected ? primary : background,
          borderColor: selected ? primary : border,
        },
      ]}
    >
      <View style={styles.iconContainer}>
        {React.isValidElement(icon)
          ? React.cloneElement(icon as React.ReactElement<any>, {
              color: selected ? '#FFF' : primary,
            })
          : icon}
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: selected ? '#FFF' : text }]}>
          {title}
        </Text>
        <Text style={[styles.subtitle, { color: selected ? 'rgba(255,255,255,0.8)' : muted }]}>
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 11,
  },
});
