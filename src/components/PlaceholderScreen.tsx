import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, spacing } from '../constants/theme';

type PlaceholderScreenProps = {
  title: string;
};

export const PlaceholderScreen = ({ title }: PlaceholderScreenProps) => (
  <View style={styles.container}>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.subtitle}>Έρχεται σύντομα</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: 80,
    gap: spacing.xs,
  },
  title: { color: colors.text, fontSize: 30, fontFamily: fonts.semibold, letterSpacing: -0.5 },
  subtitle: { color: colors.textMuted, fontSize: 15, fontFamily: fonts.regular },
});
