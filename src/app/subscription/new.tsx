import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, spacing } from '../../constants/theme';
import { services } from '../../data/services';

export default function NewSubscription() {
  const { serviceId } = useLocalSearchParams<{ serviceId?: string }>();
  const service = services.find((item) => item.id === serviceId);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{service ? service.name : 'Χειροκίνητη προσθήκη'}</Text>
      <Text style={styles.subtitle}>Εδώ θα μπει η φόρμα (Βήμα 11)</Text>

      <Pressable onPress={() => router.back()} style={styles.button} accessibilityRole="button">
        <Text style={styles.buttonText}>Κλείσιμο</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.sm,
  },
  title: { color: colors.text, fontSize: 26, fontFamily: fonts.semibold },
  subtitle: { color: colors.textMuted, fontSize: 15, fontFamily: fonts.regular },
  button: {
    marginTop: spacing.lg,
    height: 50,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: colors.text, fontSize: 15, fontFamily: fonts.medium },
});
