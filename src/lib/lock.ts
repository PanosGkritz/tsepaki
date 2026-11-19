import * as LocalAuthentication from 'expo-local-authentication';

// Αρκεί να έχει το κινητό κωδικό. Face ID ή δακτυλικό χρησιμοποιούνται αν υπάρχουν.
export const canUseLock = async () => {
  try {
    const level = await LocalAuthentication.getEnrolledLevelAsync();
    return level !== LocalAuthentication.SecurityLevel.NONE;
  } catch {
    return false;
  }
};

export const authenticate = async (promptMessage: string, cancelLabel: string) => {
  try {
    const result = await LocalAuthentication.authenticateAsync({ promptMessage, cancelLabel });
    return result.success;
  } catch {
    return false;
  }
};
