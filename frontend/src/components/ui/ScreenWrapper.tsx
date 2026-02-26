import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../context/ThemeContext';

interface ScreenWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
  withSafeArea?: boolean;
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  style,
  withSafeArea = true
}) => {
  const { colors, appearance } = useTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  const Container = withSafeArea ? SafeAreaView : View;

  // Derive status bar style from true appearance mode
  const statusBarStyle = appearance === 'dark' ? 'light' : 'dark';

  return (
    <View style={styles.background}>
      <StatusBar style={statusBarStyle} backgroundColor={colors.background} />
      <Container style={[styles.container, style]}>
        {children}
      </Container>
    </View>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
});
