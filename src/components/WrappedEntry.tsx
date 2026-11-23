import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { fonts, radius, spacing } from '../constants/theme';
import { createStyles } from '../lib/styles';
import { usePreferences } from '../providers/PreferencesProvider';
import { IrisFill, ProBadge } from './ProCard';

const WHITE = '#FFFFFF';

// Η είσοδος για το «Η χρονιά σου σε συνδρομές» στο Ιστορικό. Χωρίς Pro ανοίγει τη σελίδα του Pro.
export const WrappedEntry = () => {
  const styles = useStyles();
  const { t, isPro } = usePreferences();
  const year = new Date().getFullYear();

  return (
    <Pressable
      onPress={() => router.push(isPro ? '/wrapped' : '/pro')}
      accessibilityRole="button"
      style={({ pressed }) => [styles.border, pressed && styles.pressed]}
    >
      <IrisFill id="wrappedEntry" />
      <View style={styles.card}>
        <View style={styles.texts}>
          <View style={styles.titleRow}>
            <Text style={styles.year}>{year}</Text>
            {!isPro && <ProBadge id="wrappedEntryBadge" />}
          </View>
          <Text style={styles.title}>{t('wrapped.entryTitle')}</Text>
          <Text style={styles.text}>{t('wrapped.entryText')}</Text>
        </View>
        <Ionicons name="arrow-forward" size={20} color={WHITE} />
      </View>
    </Pressable>
  );
};

const useStyles = createStyles(() => ({
  border: { borderRadius: radius.lg + 2, padding: 1.5, overflow: 'hidden' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: '#121016',
    borderRadius: radius.lg,
    padding: 18,
  },
  texts: { flex: 1, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  year: { color: '#C4B5FD', fontSize: 13, fontFamily: fonts.semibold, letterSpacing: 1 },
  title: { color: WHITE, fontSize: 17, fontFamily: fonts.semibold },
  text: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontFamily: fonts.regular, lineHeight: 18 },
  pressed: { opacity: 0.85 },
}));
