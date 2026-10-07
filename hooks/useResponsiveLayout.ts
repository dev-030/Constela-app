import { useCallback } from "react";
import { useWindowDimensions } from "react-native";

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(Math.max(value, minimum), maximum);

/** Window-aware layout values for shared UI on narrow phones, foldables, and tablets. */
export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();
  const isCompact = width < 380 || height < 800;
  const isShortScreen = height < 840 || isCompact;
  const isNarrow = width < 340;
  const scale = clamp(width / 390, 0.82, 1.1);
  const fontScale = clamp(width / 390, 0.84, 1.05);

  const scaleFont = useCallback(
    (fontSize: number, minimum = 10) => {
      if (!isCompact) return fontSize;
      return Math.max(minimum, Math.round(fontSize * fontScale));
    },
    [isCompact, fontScale]
  );

  return {
    width,
    height,
    isCompact,
    isShortScreen,
    isNarrow,
    horizontalPadding: isCompact ? (isNarrow ? 10 : 12) : Math.round(clamp(width * 0.06, 16, 24)),
    controlHeight: Math.max(40, Math.round(48 * scale)),
    scale,
    fontScale,
    size: (value: number, minimum = 0) => Math.max(minimum, Math.round(value * scale)),
    fontSize: scaleFont,
    scaleFont,
  };
}
