import { Pressable, Text, View } from 'react-native';
import { fonts, radius } from '../constants/theme';
import { WEEKDAY_SHORT, buildMonthCells, type CalendarItem } from '../lib/calendar';
import { createStyles } from '../lib/styles';
import { usePreferences } from '../providers/PreferencesProvider';
import { ServiceLogo } from './ServiceLogo';

const MAX_LOGOS = 2;

type CalendarGridProps = {
  monthStart: Date;
  itemsByDate: Map<string, CalendarItem[]>;
  selectedDate: string;
  todayIso: string;
  onSelect: (iso: string) => void;
};

export const CalendarGrid = ({
  monthStart,
  itemsByDate,
  selectedDate,
  todayIso,
  onSelect,
}: CalendarGridProps) => {
  const styles = useStyles();
  const { language } = usePreferences();
  const cells = buildMonthCells(monthStart);

  return (
    <View>
      <View style={styles.weekRow}>
        {WEEKDAY_SHORT[language].map((label, index) => (
          <Text key={index} style={styles.weekday}>
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.cells}>
        {cells.map((iso, index) =>
          iso ? (
            <DayCell
              key={iso}
              iso={iso}
              items={itemsByDate.get(iso) ?? []}
              isSelected={iso === selectedDate}
              isToday={iso === todayIso}
              onSelect={onSelect}
            />
          ) : (
            <View key={`blank-${index}`} style={styles.cell} />
          ),
        )}
      </View>
    </View>
  );
};

type DayCellProps = {
  iso: string;
  items: CalendarItem[];
  isSelected: boolean;
  isToday: boolean;
  onSelect: (iso: string) => void;
};

const DayCell = ({ iso, items, isSelected, isToday, onSelect }: DayCellProps) => {
  const styles = useStyles();
  const { t } = usePreferences();
  const day = Number(iso.slice(8));
  const extra = items.length - MAX_LOGOS;

  return (
    <Pressable
      onPress={() => onSelect(iso)}
      accessibilityRole="button"
      accessibilityLabel={t('calendar.dayLabel', { day, count: items.length })}
      accessibilityState={{ selected: isSelected }}
      style={styles.cell}
    >
      <View style={[styles.dayInner, isSelected && styles.daySelected]}>
        <Text style={[styles.dayNumber, isToday && styles.dayToday]}>{day}</Text>

        <View style={styles.logos}>
          {items.slice(0, MAX_LOGOS).map((item) => (
            <ServiceLogo
              key={item.key}
              id={item.subscription.serviceId ?? item.subscription.id}
              name={item.subscription.name}
              fallbackColor={item.subscription.color}
              domain={item.subscription.serviceId ? undefined : item.subscription.domain}
              size={16}
            />
          ))}
          {extra > 0 && <Text style={styles.more}>+{extra}</Text>}
        </View>
      </View>
    </Pressable>
  );
};

const useStyles = createStyles((colors) => ({
  weekRow: { flexDirection: 'row', marginBottom: 6 },
  weekday: {
    width: '14.2857%',
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: fonts.medium,
  },
  cells: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.2857%', height: 56, padding: 2 },
  dayInner: {
    flex: 1,
    borderRadius: radius.sm,
    alignItems: 'center',
    paddingTop: 6,
    gap: 4,
  },
  daySelected: { backgroundColor: colors.surfaceRaised },
  dayNumber: {
    color: colors.text,
    fontSize: 14,
    fontFamily: fonts.regular,
    fontVariant: ['tabular-nums'],
  },
  dayToday: { color: colors.accentBright, fontFamily: fonts.semibold },
  logos: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  more: { color: colors.textMuted, fontSize: 10, fontFamily: fonts.medium },
}));