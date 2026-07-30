import React, { useState } from 'react';
import { View, Image, StyleSheet, StyleProp, ViewStyle, ImageStyle } from 'react-native';
import { User } from 'lucide-react-native';
import { useColor } from '@/hooks/useColor';

interface AvatarProps {
  uri?: string | null;
  size?: number;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
}

export function Avatar({ uri, size = 100, style, imageStyle }: AvatarProps) {
  const [hasError, setHasError] = useState(false);
  const border = useColor('border');
  const muted = useColor('textMuted');

  const showFallback = !uri || hasError;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 4,
          backgroundColor: border,
        },
        style,
      ]}
    >
      {showFallback ? (
        <User size={size * 0.5} color={muted} />
      ) : (
        <Image
          source={{ uri }}
          style={[
            styles.image,
            { width: size, height: size, borderRadius: size / 4 },
            imageStyle,
          ]}
          onError={() => setHasError(true)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'cover',
  },
});
