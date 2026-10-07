import React, { useEffect, useState, useRef, memo } from 'react';
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

export const Avatar = memo(function Avatar({
  uri,
  size = 100,
  rounded = false,
  style,
  imageStyle,
}: AvatarProps) {
  const [hasError, setHasError] = useState(false);
  const border = useColor('border');
  const muted = useColor('textMuted');

  const baseUrl = uri ? uri.split('?')[0] : null;

  useEffect(() => {
    setHasError(false);
  }, [baseUrl]);

  // Keep a stable object reference for expo-image source as long as the base URL is unchanged.
  // This prevents expo-image from interpreting refreshed presigned query params (e.g. AWS timestamps)
  // as a brand new image, avoiding unnecessary image unloads and flickers.
  const prevBaseUrlRef = useRef<string | null>(null);
  const sourceRef = useRef<{ uri: string; cacheKey?: string } | null>(null);

  if (baseUrl !== prevBaseUrlRef.current) {
    prevBaseUrlRef.current = baseUrl;
    sourceRef.current = uri ? { uri, cacheKey: baseUrl ?? undefined } : null;
  }

  const showFallback = !uri || hasError;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: rounded ? size / 2 : size / 4,
          backgroundColor: showFallback ? border : 'transparent',
        },
        style,
      ]}
    >
      {showFallback ? (
        <User size={size * 0.5} color={muted} />
      ) : (
        <Image
          source={sourceRef.current}
          recyclingKey={baseUrl ?? undefined}
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
});

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

