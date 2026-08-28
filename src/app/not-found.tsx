import Link from 'next/link';
import { PageShell } from '@/components/page-shell';

export default function NotFound() {
  return (
    <PageShell>
      <section className="not-found">
        <div className="container"><p className="eyebrow">404 · Not found</p><h1>This address is not part of the collection.</h1><p>The property, advisor, or neighborhood may be unavailable or unpublished.</p><Link href="/properties" className="button-primary">Browse properties</Link></div>
      </section>
    </PageShell>
  );
}
