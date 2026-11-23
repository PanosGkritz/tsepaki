// Το Pro ανοίγει προς το παρόν μόνο από τον διακόπτη του developer (Expo Go).
// Όταν μπουν οι πληρωμές του Google Play, εδώ θα ελέγχεται η αγορά.
export const isProEnabled = (settings: { devPro: boolean }) => __DEV__ && settings.devPro;
