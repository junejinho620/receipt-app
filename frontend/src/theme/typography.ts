import {
  Syne_400Regular,
  Syne_700Bold,
  Syne_800ExtraBold,
} from '@expo-google-fonts/syne';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';
import { SpaceMono_400Regular } from '@expo-google-fonts/space-mono';

export const customFonts = {
  Syne_400Regular,
  Syne_700Bold,
  Syne_800ExtraBold,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_700Bold,
  SpaceMono_400Regular,
};

export const typography = {
  families: {
    // Manrope is a great variable font effectively installed
    regular: 'Manrope_400Regular',
    medium: 'Manrope_500Medium',
    bold: 'Manrope_700Bold',
    display: 'Manrope_700Bold', // Changed to Manrope for consistency
    mono: 'SpaceMono_400Regular', // Keep SpaceMono for "receipt" data details
  },
  sizes: {
    h1: 32,
    h2: 24,
    h3: 20,
    body: 16,
    small: 14,
    caption: 12,
  },
  lineHeights: {
    h1: 40,
    h2: 32,
    h3: 28,
    body: 24,
    small: 20,
    caption: 16,
  },
} as const;
