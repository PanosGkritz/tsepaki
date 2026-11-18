import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, spacing } from '../constants/theme';
export default function Home() {
  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Καλημέρα, Πάνο</Text>
      <Text style={styles.title}>Το Τσεπάκι μου</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: 80,
    gap: spacing.xs,
  },
 greeting: { color: colors.textMuted, fontSize: 15, fontFamily: fonts.regular },
 title: { color: colors.text, fontSize: 30, fontFamily: fonts.semibold, letterSpacing: -0.5 },
});
