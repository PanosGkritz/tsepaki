import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ServiceCard } from '../../components/ServiceCard';
import { fonts, radius, spacing } from '../../constants/theme';
import { getCategoryLabel } from '../../data/categories';
import {
  CATALOG_PRICES_AS_OF,
  SERVICE_FILTERS,
  getServiceName,
  services,
  type ServiceFilter,
  type ServiceTemplate,
} from '../../data/services';
import { getSubscriptions } from '../../db/subscriptions';
import { LOCALES } from '../../i18n';
import { createStyles } from '../../lib/styles';
import { usePreferences } from '../../providers/PreferencesProvider';

const PREVIEW_COUNT = 4;

type Section = 'online' | 'local';

export default function Add() {
  const db = useSQLiteContext();
  const styles = useStyles();
  const { colors, t, language } = usePreferences();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<ServiceFilter>('all');
  const [addedIds, setAddedIds] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<Record<Section, boolean>>({
    online: false,
    local: false,
  });

  useFocusEffect(
    useCallback(() => {
      getSubscriptions(db).then((subscriptions) =>
        setAddedIds(subscriptions.map((s) => s.serviceId ?? s.id)),
      );
    }, [db]),
  );

  const locale = LOCALES[language];
  const normalizedQuery = query.trim().toLocaleLowerCase(locale);
  const isFiltering = normalizedQuery.length > 0 || filter !== 'all';

  const visibleServices = services.filter((service) => {
    const matchesFilter = filter === 'all' || service.category === filter;
    const name = getServiceName(service, t).toLocaleLowerCase(locale);
    return matchesFilter && name.includes(normalizedQuery);
  });

  const onlineServices = visibleServices.filter((service) => !service.icon);
  const localServices = visibleServices.filter((service) => service.icon);

  const openForm = (serviceId?: string) =>
    router.push({ pathname: '/subscription/new', params: serviceId ? { serviceId } : {} });

  const toggleSection = (section: Section) =>
    setExpanded((current) => ({ ...current, [section]: !current[section] }));

  const renderSection = (section: Section, items: ServiceTemplate[]) => {
    const canCollapse = !isFiltering && items.length > PREVIEW_COUNT;
    const isExpanded = expanded[section];
    const shown = canCollapse && !isExpanded ? items.slice(0, PREVIEW_COUNT) : items;

    return (
      <>
        <View style={styles.grid}>
          {shown.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              isAdded={addedIds.includes(service.id)}
              onPress={() => openForm(service.id)}
            />
          ))}
        </View>

        {canCollapse && (
          <Pressable
            onPress={() => toggleSection(section)}
            accessibilityRole="button"
            style={({ pressed }) => [styles.moreButton, pressed && styles.pressed]}
          >
            <Text style={styles.moreText}>
              {isExpanded ? t('add.showLess') : t('add.showAll', { count: items.length })}
            </Text>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={colors.accentBright}
            />
          </Pressable>
        )}
      </>
    );
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{t('add.title')}</Text>

        <View style={styles.search}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('add.search')}
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            accessibilityLabel={t('add.searchLabel')}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {SERVICE_FILTERS.map((item) => {
            const isActive = item === filter;
            return (
              <Pressable
                key={item}
                onPress={() => setFilter(item)}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                style={[styles.chip, isActive && styles.chipActive]}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                  {item === 'all' ? t('category.all') : getCategoryLabel(item, t)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {onlineServices.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{t('add.popular')}</Text>
            {renderSection('online', onlineServices)}
            <Text style={styles.note}>
              {t('add.pricesNote', { date: CATALOG_PRICES_AS_OF[language] })}
            </Text>
          </>
        )}

        {localServices.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('add.offline')}</Text>
              <Text style={styles.sectionHint}>{t('add.offlineHint')}</Text>
            </View>
            {renderSection('local', localServices)}
          </>
        )}

        {visibleServices.length === 0 && <Text style={styles.empty}>{t('add.empty')}</Text>}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={() => openForm()}
          accessibilityRole="button"
          style={({ pressed }) => [styles.manualButton, pressed && styles.pressed]}
        >
          <Ionicons name="add" size={20} color={colors.background} />
          <Text style={styles.manualButtonText}>{t('add.manual')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const useStyles = createStyles((colors) => ({
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
  sectionHeader: { gap: 4, marginTop: spacing.sm },
  sectionTitle: { color: colors.text, fontSize: 16, fontFamily: fonts.semibold, marginTop: spacing.xs },
  sectionHint: { color: colors.textMuted, fontSize: 13, fontFamily: fonts.regular, lineHeight: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  moreButton: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    gap: 4,
    height: 40,
    paddingHorizontal: spacing.md,
  },
  moreText: { color: colors.accentBright, fontSize: 14, fontFamily: fonts.medium },
  note: { color: colors.textMuted, fontSize: 12, fontFamily: fonts.regular, lineHeight: 17 },
  empty: { color: colors.textMuted, fontSize: 14, fontFamily: fonts.regular },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  manualButton: {
    flexDirection: 'row',
    gap: spacing.xs,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualButtonText: { color: colors.background, fontSize: 15, fontFamily: fonts.semibold },
  pressed: { opacity: 0.8 },
}));