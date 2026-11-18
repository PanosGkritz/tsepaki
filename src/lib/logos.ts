const BRANDFETCH_CLIENT_ID = process.env.EXPO_PUBLIC_BRANDFETCH_CLIENT_ID;

export const getLogoUrl = (domain: string, sizePx: number) => {
  if (!BRANDFETCH_CLIENT_ID) return undefined;
  const size = Math.round(sizePx);
  return `https://cdn.brandfetch.io/${domain}/w/${size}/h/${size}/icon.png?c=${BRANDFETCH_CLIENT_ID}&fallback=404`;
};
