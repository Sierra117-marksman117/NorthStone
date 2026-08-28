const LOCAL_SITE_URL = new URL('http://localhost:3000');

function configuredUrl(value: string | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  const candidate = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const url = new URL(candidate);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}

export function getSiteUrl() {
  for (const value of [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
  ]) {
    const url = configuredUrl(value);
    if (url) return url;
  }

  return new URL(LOCAL_SITE_URL);
}

export function absoluteSiteUrl(pathname = '/') {
  return new URL(pathname, getSiteUrl()).toString();
}
