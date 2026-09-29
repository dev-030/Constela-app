import { useWindowDimensions } from "react-native";

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(Math.max(value, minimum), maximum);

/** Window-aware layout values for shared UI on narrow phones, foldables, and tablets. */
export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();
  const scale = clamp(width / 390, 0.88, 1);
  const isCompact = width < 375 || height < 720;

  return {
    width,
    height,
    isCompact,
    horizontalPadding: Math.round(clamp(width * 0.06, 16, 24)),
    controlHeight: Math.max(44, Math.round(48 * scale)),
    scale,
    size: (value: number, minimum = 0) => Math.max(minimum, Math.round(value * scale)),
  };
}
