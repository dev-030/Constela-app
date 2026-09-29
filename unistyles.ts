import { StyleSheet } from 'react-native-unistyles';

const breakpoints = {
  xs: 0,
  compact: 360,
  phone: 480,
  tablet: 768,
} as const;

type AppBreakpoints = typeof breakpoints;

declare module 'react-native-unistyles' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface UnistylesBreakpoints extends AppBreakpoints {}
}

StyleSheet.configure({
  breakpoints,
  settings: { nativeBreakpointsMode: 'points' },
});
