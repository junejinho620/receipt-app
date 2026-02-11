import { Dimensions } from 'react-native';

export const layout = {
  spacing: {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    s: 4,
    m: 8,
    l: 16,
    xl: 24,
    pill: 9999,
  },
  iconSize: {
    s: 16,
    m: 24,
    l: 32,
    xl: 48,
  },
  screenPadding: 20,
  window: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
} as const;
