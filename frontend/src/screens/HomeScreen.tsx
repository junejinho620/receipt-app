import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../styles';

export function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>The Receipt</Text>
      <Text style={styles.subtitle}>Your daily proof of life</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 8,
  },
});
