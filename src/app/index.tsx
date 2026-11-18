import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { MonthSummaryCard } from '../components/MonthSummaryCard';
import { UpcomingCharges } from '../components/UpcomingCharges';
import { colors, fonts, spacing } from '../constants/theme';
import { mockSubscriptions } from '../data/mockSubscriptions';

export default function Home() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Καλημέρα, Πάνο</Text>
        <Text style={styles.title}>Το Τσεπάκι μου</Text>
      </View>

      <MonthSummaryCard monthLabel="Νοέμβριος" total={86.96} paid={20.99} subscriptionCount={6} />

      <UpcomingCharges subscriptions={mockSubscriptions} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: 80,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  header: { gap: spacing.xs },
  greeting: { color: colors.textMuted, fontSize: 15, fontFamily: fonts.regular },
  title: { color: colors.text, fontSize: 30, fontFamily: fonts.semibold, letterSpacing: -0.5 },
});