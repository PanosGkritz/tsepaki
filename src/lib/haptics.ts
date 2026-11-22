import * as Haptics from 'expo-haptics';

// Δόνηση μόνο σε τρεις στιγμές, για να μη γίνεται ενοχλητική:
// όταν προστίθεται συνδρομή ή πληρώνεται (επιτυχία) και όταν σβήνεται ή ακυρώνεται (ελαφρύ χτύπημα).
// Το κινητό σέβεται μόνο του τη ρύθμιση δόνησης του χρήστη.
const play = (feedback: () => Promise<void>) => {
  feedback().catch(() => {
    // Χωρίς δόνηση (π.χ. συσκευή που δεν υποστηρίζει) δεν χαλάει τίποτα.
  });
};

export const hapticSuccess = () =>
  play(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));

export const hapticRemove = () =>
  play(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
