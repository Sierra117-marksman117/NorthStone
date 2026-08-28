import type { Metadata } from 'next';
import { NeighborhoodCard } from '@/components/neighborhood-card';
import { PageIntro, PageShell } from '@/components/page-shell';
import { getPublicNeighborhoods } from '@/services/public-data.service';

export const metadata: Metadata = {
  title: 'Mumbai Neighborhoods',
  description: 'Explore Northstone’s editorial guides to four distinctive Mumbai neighborhoods.',
};

export default async function NeighborhoodsPage() {
  const neighborhoods = await getPublicNeighborhoods();
  return (
    <PageShell>
      <PageIntro
        eyebrow="Neighborhood guides"
        title="The life around the address."
        copy="A home is inseparable from its streets, rituals, views, and connections. Explore four distinctive parts of Mumbai."
      />
      <section className="content-section directory-section">
        <div className="container-wide neighborhood-grid">
          {neighborhoods.map((neighborhood) => <NeighborhoodCard key={neighborhood.id} neighborhood={neighborhood} />)}
        </div>
      </section>
    </PageShell>
  );
}
