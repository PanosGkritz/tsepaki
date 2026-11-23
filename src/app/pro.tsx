import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ProCard } from '../components/ProCard';
import { fonts, spacing } from '../constants/theme';
import { createStyles } from '../lib/styles';
import { usePreferences } from '../providers/PreferencesProvider';

// Η σελίδα του Pro: ανοίγει από το «Γλίτωσέ τα», το ιστορικό τιμών, το Wrapped και τις Ρυθμίσεις.
export default function ProScreen() {
  const styles = useStyles();
  const { colors, t } = usePreferences();

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          hitSlop={12}
        >
          <Ionicons name="close" size={26} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Animated.View entering={FadeInDown.duration(300)} style={styles.intro}>
          <Text style={styles.title}>{t('pro.screenTitle')}</Text>
          <Text style={styles.subtitle}>{t('pro.screenSubtitle')}</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(360)}>
          <ProCard />
        </Animated.View>

        <Text style={styles.note}>{t('pro.freeNote')}</Text>
      </ScrollView>
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.lg },
  intro: { gap: spacing.sm },
  title: { color: colors.text, fontSize: 28, fontFamily: fonts.semibold, letterSpacing: -0.5 },
  subtitle: { color: colors.textMuted, fontSize: 15, fontFamily: fonts.regular, lineHeight: 22 },
  note: {
    color: colors.textMuted,
    fontSize: 13,
    fontFamily: fonts.regular,
    lineHeight: 19,
    textAlign: 'center',
  },
}));
