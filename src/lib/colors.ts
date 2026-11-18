const PALETTE = ['#1F6F54', '#2563EB', '#7C3AED', '#B45309', '#BE123C', '#0E7490'];

export const pickColor = (seed: string) => {
  let hash = 0;
  for (const char of seed) hash = (hash + char.charCodeAt(0)) % PALETTE.length;
  return PALETTE[hash];
};