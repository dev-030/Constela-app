import { useEffect, useState } from 'react';
import { useThemeContext } from '@/providers/theme-context';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const { colorScheme } = useThemeContext();

  if (hasHydrated) {
    return colorScheme;
  }

  return 'light';
}
