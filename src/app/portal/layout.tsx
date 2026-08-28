import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { PreviewShell } from '@/components/preview-shell';

export const metadata: Metadata = {
  title: 'Customer Portal Preview',
  description: 'Explore the NORTHSTONE customer property experience.',
  robots: { index: false, follow: false },
};

export default function PortalLayout({ children }: { children: ReactNode }) {
  return <PreviewShell area="portal">{children}</PreviewShell>;
}
