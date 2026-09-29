import React, { useEffect, useState } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, ImageStyle } from 'react-native';
import { Image } from 'expo-image';
import { User } from 'lucide-react-native';
import { useColor } from '@/hooks/useColor';

interface AvatarProps {
  uri?: string | null;
  size?: number;
  rounded?: boolean;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
}

export function Avatar({ uri, size = 100, rounded = false, style, imageStyle }: AvatarProps) {
  const [hasError, setHasError] = useState(false);
  const border = useColor('border');
  const muted = useColor('textMuted');

  useEffect(() => setHasError(false), [uri]);

  const showFallback = !uri || hasError;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: rounded ? size / 2 : size / 4,
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
            { width: size, height: size, borderRadius: rounded ? size / 2 : size / 4 },
            imageStyle as any,
          ]}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={0}
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
    width: '100%',
    height: '100%',
  },
});
