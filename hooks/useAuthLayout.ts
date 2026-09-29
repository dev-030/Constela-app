import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";

/** Shared layout metrics for authentication screens across compact phones and tablets. */
export function useAuthLayout() {
  const { width, isCompact, horizontalPadding } = useResponsiveLayout();

  return {
    isCompact,
    horizontalPadding,
    contentMaxWidth: 480,
    logoWidth: Math.round(Math.min(Math.max(width * 0.68, 180), 280)),
    logoHeight: Math.round(Math.min(Math.max(width * 0.34, 90), 140)),
    logoSectionMinHeight: isCompact ? 150 : 220,
    logoSectionPadding: isCompact ? 20 : 40,
    titleSize: isCompact ? 28 : 32,
    subtitleSize: isCompact ? 15 : 16,
    sectionGap: isCompact ? 16 : 20,
    socialDirection: width < 430 ? ("column" as const) : ("row" as const),
  };
}
