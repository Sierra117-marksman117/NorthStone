import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { PreviewShell } from '@/components/preview-shell';

export const metadata: Metadata = {
  title: 'Operations Console Preview',
  description: 'Explore the NORTHSTONE real-estate operations experience.',
  robots: { index: false, follow: false },
};

export default function OperationsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <PreviewShell area="operations">{children}</PreviewShell>;
}
