import type { Metadata } from 'next';
import { PreviewProvider } from '@/components/preview-store';
import { StructuredData } from '@/components/structured-data';
import { absoluteSiteUrl, getSiteUrl } from '@/lib/site-url';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: {
    default: 'Northstone Realty | Property Discovery Platform',
    template: '%s | Northstone Realty',
  },
  description:
    'A curated property discovery platform for distinctive homes, neighborhoods, and trusted real-estate advisors.',
  openGraph: {
    title: 'Northstone Realty | Property Discovery Platform',
    description:
      'Discover distinctive homes and considered real-estate guidance across Mumbai.',
    type: 'website',
    images: [
      {
        url: '/images/northstone-social.webp',
        width: 1730,
        height: 909,
        alt: 'Northstone Property Discovery Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/images/northstone-social.webp'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const websiteStructuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${absoluteSiteUrl()}#website`,
      url: absoluteSiteUrl(),
      name: 'Northstone Realty',
      description:
        'An illustrative property discovery reference build for Mumbai.',
      inLanguage: 'en-IN',
    },
    {
      '@type': 'Organization',
      '@id': `${absoluteSiteUrl()}#organization`,
      name: 'Northstone Realty',
      url: absoluteSiteUrl(),
      description:
        'An illustrative product reference build. Northstone properties, advisors, prices, and availability are not live listings.',
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <StructuredData data={websiteStructuredData} />
        <a className="skip-link" href="#main-content">Skip to main content</a>
        <PreviewProvider>{children}</PreviewProvider>
      </body>
    </html>
  );
}
