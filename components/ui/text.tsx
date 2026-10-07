import { useColor } from '@/hooks/useColor';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import React, { forwardRef, useMemo } from 'react';
import {
  StyleSheet,
  Text as RNText,
  TextProps as RNTextProps,
  TextStyle,
} from 'react-native';

type TextVariant =
  | 'body'
  | 'title'
  | 'subtitle'
  | 'caption'
  | 'heading'
  | 'link';

interface TextProps extends RNTextProps {
  variant?: TextVariant;
  lightColor?: string;
  darkColor?: string;
  children: React.ReactNode;
}

export const Text = forwardRef<RNText, TextProps>(
  (
    { variant = 'body', lightColor, darkColor, style, children, ...props },
    ref
  ) => {
    const textColor = useColor('text', { light: lightColor, dark: darkColor });
    const mutedColor = useColor('textMuted');
    const { isCompact, scaleFont } = useResponsiveLayout();

    const getBaseStyle = (): TextStyle => {
      const baseStyle: TextStyle = {
        color: textColor,
      };

      switch (variant) {
        case 'heading':
          return {
            ...baseStyle,
            fontSize: scaleFont(26),
            fontWeight: '800',
          };
        case 'title':
          return {
            ...baseStyle,
            fontSize: scaleFont(22),
            fontWeight: '700',
          };
        case 'subtitle':
          return {
            ...baseStyle,
            fontSize: scaleFont(18),
            fontWeight: '600',
          };
        case 'caption':
          return {
            ...baseStyle,
            fontSize: scaleFont(13),
            fontWeight: '400',
            color: mutedColor,
          };
        case 'link':
          return {
            ...baseStyle,
            fontSize: scaleFont(15),
            fontWeight: '500',
            textDecorationLine: 'underline',
          };
        default: // 'body'
          return {
            ...baseStyle,
            fontSize: scaleFont(15),
            fontWeight: '400',
          };
      }
    };

    const resolvedStyle = useMemo(() => {
      const base = getBaseStyle();
      if (!style) return base;
      if (!isCompact) return [base, style];

      const flat = StyleSheet.flatten(style);
      if (!flat?.fontSize) return [base, style];

      const scaledSize = scaleFont(flat.fontSize);
      const scaledLineHeight = flat.lineHeight
        ? Math.round(flat.lineHeight * (scaledSize / flat.fontSize))
        : undefined;

      return [
        base,
        style,
        {
          fontSize: scaledSize,
          ...(scaledLineHeight ? { lineHeight: scaledLineHeight } : {}),
        },
      ];
    }, [textColor, mutedColor, variant, style, isCompact, scaleFont]);

    return (
      <RNText ref={ref} style={resolvedStyle} allowFontScaling={false} {...props}>
        {children}
      </RNText>
    );
  }
);

Text.displayName = 'Text';

