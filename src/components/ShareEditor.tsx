import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  LinearTransition,
} from 'react-native-reanimated';
import { fonts, radius, spacing } from '../constants/theme';
import { formatMoney, getCurrencySymbol } from '../lib/format';
import { getAvatarColor, getInitials, getShareBreakdown } from '../lib/share';
import { createStyles } from '../lib/styles';
import { usePreferences } from '../providers/PreferencesProvider';
import type { ShareInfo, ShareSplit } from '../types/subscription';
import { AvatarStack } from './AvatarStack';

export type ShareDraftPerson = { name: string; amountText: string };

export type ShareDraft = {
  people: ShareDraftPerson[];
  split: ShareSplit;
  payer: string | null;
};

export const EMPTY_SHARE_DRAFT: ShareDraft = { people: [], split: 'equal', payer: null };

const MAX_PEOPLE = 8;
const NAME_MAX_LENGTH = 20;

const parseAmount = (text: string) => {
  const value = Number(text.replace(',', '.'));
  return Number.isFinite(value) && value >= 0 ? value : 0;
};

const toAmountText = (amount: number | undefined, language: string) => {
  if (amount === undefined) return '';
  const text = Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
  return language === 'el' ? text.replace('.', ',') : text;
};

export const shareToDraft = (share: ShareInfo | undefined, language: string): ShareDraft =>
  share
    ? {
        people: share.people.map((person) => ({
          name: person.name,
          amountText: toAmountText(person.amount, language),
        })),
        split: share.split,
        payer: share.payer,
      }
    : EMPTY_SHARE_DRAFT;

export const draftToShare = (draft: ShareDraft): ShareInfo => ({
  people: draft.people.map((person) => ({
    name: person.name,
    amount: draft.split === 'custom' ? parseAmount(person.amountText) : undefined,
  })),
  split: draft.split,
  payer: draft.payer,
});

// Στα «Δικά μου ποσά» οι άλλοι δεν μπορούν να δίνουν περισσότερα από όλο το ποσό.
export const isShareDraftValid = (draft: ShareDraft, price: number) => {
  if (draft.people.length === 0) return false;
  if (draft.split === 'equal') return true;
  const othersTotal = draft.people.reduce((sum, person) => sum + parseAmount(person.amountText), 0);
  return othersTotal <= price + 0.001;
};

const SPRING_LAYOUT = LinearTransition.springify().damping(18);

type ShareEditorProps = {
  draft: ShareDraft;
  price: number | null;
  onChange: (draft: ShareDraft) => void;
};

export const ShareEditor = ({ draft, price, onChange }: ShareEditorProps) => {
  const styles = useStyles();
  const { colors, t, language } = usePreferences();
  const [nameText, setNameText] = useState('');

  const share = draftToShare(draft);
  const breakdown = price !== null ? getShareBreakdown(price, share) : null;
  const meLabel = t('share.me');

  const addPerson = () => {
    const name = nameText.trim();
    const exists = draft.people.some(
      (person) => person.name.toLocaleLowerCase() === name.toLocaleLowerCase(),
    );
    if (!name || exists || draft.people.length >= MAX_PEOPLE) return;
    onChange({ ...draft, people: [...draft.people, { name, amountText: '' }] });
    setNameText('');
  };

  const removePerson = (name: string) =>
    onChange({
      ...draft,
      people: draft.people.filter((person) => person.name !== name),
      payer: draft.payer === name ? null : draft.payer,
    });

  const setAmount = (name: string, amountText: string) =>
    onChange({
      ...draft,
      people: draft.people.map((person) =>
        person.name === name ? { ...person, amountText } : person,
      ),
    });

  const segments = breakdown
    ? [
        { name: meLabel, amount: breakdown.mine, color: colors.accentBright },
        ...breakdown.others.map((person) => ({
          name: person.name,
          amount: person.amount,
          color: getAvatarColor(person.name),
        })),
      ]
    : [];
  const segmentsTotal = segments.reduce((sum, segment) => sum + segment.amount, 0);

  return (
    <Animated.View entering={FadeIn.duration(220)} layout={SPRING_LAYOUT} style={styles.box}>
      <View style={styles.addRow}>
        <TextInput
          value={nameText}
          onChangeText={setNameText}
          onSubmitEditing={addPerson}
          placeholder={t('share.namePlaceholder')}
          placeholderTextColor={colors.textMuted}
          maxLength={NAME_MAX_LENGTH}
          returnKeyType="done"
          submitBehavior="submit"
          style={styles.input}
          accessibilityLabel={t('share.nameLabel')}
        />
        <Pressable
          onPress={addPerson}
          accessibilityRole="button"
          accessibilityLabel={t('share.add')}
          style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
        >
          <Ionicons name="add" size={22} color={colors.onAccent} />
        </Pressable>
      </View>

      {draft.people.length > 0 && (
        <AvatarStack names={draft.people.map((person) => person.name)} size={34} max={8} animated />
      )}

      {draft.people.map((person) => (
        <Animated.View
          key={person.name}
          entering={FadeInDown.duration(220)}
          exiting={FadeOut.duration(140)}
          layout={SPRING_LAYOUT}
          style={styles.personRow}
        >
          <View style={[styles.dot, { backgroundColor: getAvatarColor(person.name) }]}>
            <Text style={styles.dotText}>{getInitials(person.name)}</Text>
          </View>
          <Text style={styles.personName} numberOfLines={1}>
            {person.name}
          </Text>
          {draft.split === 'custom' && (
            <View style={styles.amountBox}>
              <TextInput
                value={person.amountText}
                onChangeText={(text) => setAmount(person.name, text)}
                placeholder={language === 'el' ? '0,00' : '0.00'}
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                style={styles.amountInput}
                accessibilityLabel={t('share.amountLabel', { name: person.name })}
              />
              <Text style={styles.amountSymbol}>{getCurrencySymbol(language)}</Text>
            </View>
          )}
          <Pressable
            onPress={() => removePerson(person.name)}
            accessibilityRole="button"
            accessibilityLabel={t('share.remove', { name: person.name })}
            hitSlop={8}
          >
            <Ionicons name="close-circle" size={20} color={colors.textMuted} />
          </Pressable>
        </Animated.View>
      ))}

      {draft.people.length > 0 && (
        <Animated.View entering={FadeIn.duration(200)} layout={SPRING_LAYOUT} style={styles.group}>
          <View style={styles.segment}>
            {(['equal', 'custom'] as const).map((split) => {
              const isActive = draft.split === split;
              return (
                <Pressable
                  key={split}
                  onPress={() => onChange({ ...draft, split })}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  style={[styles.segmentItem, isActive && styles.segmentItemActive]}
                >
                  <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>
                    {t(split === 'equal' ? 'share.equal' : 'share.custom')}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {segmentsTotal > 0 && (
            <View style={styles.bar}>
              {segments.map((segment) => (
                <Animated.View
                  key={segment.name}
                  layout={SPRING_LAYOUT}
                  style={[
                    styles.barPart,
                    { flex: Math.max(segment.amount, 0.0001), backgroundColor: segment.color },
                  ]}
                />
              ))}
            </View>
          )}

          {breakdown && (
            <View style={styles.legend}>
              {segments.map((segment) => (
                <View key={segment.name} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: segment.color }]} />
                  <Text style={styles.legendName} numberOfLines={1}>
                    {segment.name}
                  </Text>
                  <Animated.Text
                    key={`${segment.name}-${segment.amount}`}
                    entering={FadeIn.duration(180)}
                    style={styles.legendAmount}
                  >
                    {formatMoney(segment.amount, language)}
                  </Animated.Text>
                </View>
              ))}
            </View>
          )}

          <Text style={styles.label}>{t('share.payer')}</Text>
          <View style={styles.chips}>
            {[null, ...draft.people.map((person) => person.name)].map((payer) => {
              const isActive = draft.payer === payer;
              return (
                <Pressable
                  key={payer ?? 'me'}
                  onPress={() => onChange({ ...draft, payer })}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  style={[styles.chip, isActive && styles.chipActive]}
                >
                  <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                    {payer ?? meLabel}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.hint}>
            {draft.payer ? t('share.payerOtherHint', { name: draft.payer }) : t('share.payerMeHint')}
          </Text>
        </Animated.View>
      )}
    </Animated.View>
  );
};

const useStyles = createStyles((colors) => ({
  box: {
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 46,
    color: colors.text,
    fontSize: 16,
    fontFamily: fonts.regular,
  },
  addButton: {
    width: 46,
    height: 46,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
  personRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  dotText: { color: '#FFFFFF', fontSize: 12, fontFamily: fonts.semibold },
  personName: { flex: 1, color: colors.text, fontSize: 15, fontFamily: fonts.medium },
  amountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    height: 38,
  },
  amountInput: {
    minWidth: 56,
    color: colors.text,
    fontSize: 15,
    fontFamily: fonts.regular,
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
  },
  amountSymbol: { color: colors.textMuted, fontSize: 14, fontFamily: fonts.medium },
  group: { gap: spacing.md },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.full,
    padding: 4,
  },
  segmentItem: {
    flex: 1,
    height: 38,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentItemActive: { backgroundColor: colors.surface },
  segmentText: { color: colors.textMuted, fontSize: 14, fontFamily: fonts.medium },
  segmentTextActive: { color: colors.text },
  bar: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    gap: 2,
  },
  barPart: { height: 10 },
  legend: { gap: 6 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendName: { flex: 1, color: colors.text, fontSize: 14, fontFamily: fonts.regular },
  legendAmount: {
    color: colors.text,
    fontSize: 14,
    fontFamily: fonts.medium,
    fontVariant: ['tabular-nums'],
  },
  label: { color: colors.textMuted, fontSize: 13, fontFamily: fonts.medium },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceRaised,
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: colors.text },
  chipText: { color: colors.text, fontSize: 14, fontFamily: fonts.medium },
  chipTextActive: { color: colors.background },
  hint: { color: colors.textMuted, fontSize: 13, fontFamily: fonts.regular, lineHeight: 18 },
}));
