import { useThemeContext } from '@/providers/theme-context';

export function useColorScheme() {
  const { colorScheme } = useThemeContext();
  return colorScheme;
}
