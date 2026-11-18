export const getGreeting = (date = new Date()) => {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'Καλημέρα';
  if (hour >= 12 && hour < 21) return 'Καλησπέρα';
  return 'Καλό βράδυ';
};

export const buildGreeting = (name: string, date = new Date()) => {
  const greeting = getGreeting(date);
  const trimmedName = name.trim();
  return trimmedName ? `${greeting}, ${trimmedName}` : greeting;
};