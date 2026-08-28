function withProtocol(value: string) {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

export function getSiteUrl() {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_URL ??
    'http://localhost:3000';

  return new URL(withProtocol(configured));
}

export function absoluteSiteUrl(pathname = '/') {
  return new URL(pathname, getSiteUrl()).toString();
}
