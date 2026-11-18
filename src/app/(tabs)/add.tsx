import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ServiceCard } from '../../components/ServiceCard';
import { colors, fonts, radius, spacing } from '../../constants/theme';
import { SERVICE_CATEGORIES, services } from '../../data/services';
import { getSubscriptions } from '../../db/subscriptions';

type Category = (typeof SERVICE_CATEGORIES)[number];

export default function Add() {
  const db = useSQLiteContext();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category>('Όλα');
  const [addedIds, setAddedIds] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      getSubscriptions(db).then((subscriptions) => setAddedIds(subscriptions.map((s) => s.id)));
    }, [db]),
  );

  const normalizedQuery = query.trim().toLocaleLowerCase('el');
  const visibleServices = services.filter((service) => {
    const matchesCategory = category === 'Όλα' || service.category === category;
    const matchesQuery = service.name.toLocaleLowerCase('el').includes(normalizedQuery);
    return matchesCategory && matchesQuery;
  });

  const openForm = (serviceId?: string) =>
    router.push({ pathname: '/subscription/new', params: serviceId ? { serviceId } : {} });

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Νέα συνδρομή</Text>

        <View style={styles.search}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Αναζήτηση, π.χ. Netflix"
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            accessibilityLabel="Αναζήτηση υπηρεσίας"
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {SERVICE_CATEGORIES.map((item) => {
            const isActive = item === category;
            return (
              <Pressable
                key={item}
                onPress={() => setCategory(item)}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                style={[styles.chip, isActive && styles.chipActive]}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{item}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={styles.sectionTitle}>Δημοφιλείς στην Ελλάδα</Text>

        <View style={styles.grid}>
          {visibleServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              isAdded={addedIds.includes(service.id)}
              onPress={() => openForm(service.id)}
            />
          ))}
        </View>

        {visibleServices.length === 0 && (
          <Text style={styles.empty}>Δεν βρέθηκε. Πρόσθεσέ το χειροκίνητα από κάτω.</Text>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={() => openForm()}
          accessibilityRole="button"
          style={({ pressed }) => [styles.manualButton, pressed && styles.pressed]}
        >
          <Text style={styles.manualButtonText}>Πρόσθεσε κάτι άλλο χειροκίνητα</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: 80,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  title: { color: colors.text, fontSize: 30, fontFamily: fonts.semibold, letterSpacing: -0.5 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 50,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 15, fontFamily: fonts.regular },
  chips: { gap: spacing.sm },
  chip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: colors.text },
  chipText: { color: colors.text, fontSize: 14, fontFamily: fonts.medium },
  chipTextActive: { color: colors.background },
  sectionTitle: { color: colors.text, fontSize: 16, fontFamily: fonts.semibold, marginTop: spacing.xs },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  empty: { color: colors.textMuted, fontSize: 14, fontFamily: fonts.regular },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  manualButton: {
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualButtonText: { color: colors.background, fontSize: 15, fontFamily: fonts.semibold },
  pressed: { opacity: 0.8 },
});