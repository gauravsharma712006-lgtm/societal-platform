export const resolveApiUrl = (value: string | undefined, production: boolean): string => {
  const raw = value?.trim() || (production ? '' : 'http://localhost:5000/api');
  if (!raw) throw new Error('VITE_API_URL is required in production');
  try {
    const url = new URL(raw);
    if (!['http:', 'https:'].includes(url.protocol) || (production && url.protocol !== 'https:') ||
        url.username || url.password || url.search || url.hash || url.pathname.replace(/\/$/, '') !== '/api') throw new Error();
    return raw.replace(/\/$/, '');
  } catch {
    throw new Error('VITE_API_URL must be an HTTP(S) API URL ending in /api; production requires HTTPS');
  }
};
