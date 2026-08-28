import type { Metadata } from 'next';
import { AgentCard } from '@/components/agent-card';
import { PageIntro, PageShell } from '@/components/page-shell';
import { getPublicAgents } from '@/services/public-data.service';

export const metadata: Metadata = {
  title: 'Property Advisors',
  description: 'Meet Northstone’s illustrative property advisors and their areas of focus.',
};

export default async function AgentsPage() {
  const agents = await getPublicAgents();
  return (
    <PageShell>
      <PageIntro
        eyebrow="Our advisors"
        title="Knowledgeable, candid, and quietly attentive."
        copy="A focused team for residential sales, premium leasing, and considered portfolio advice across Mumbai."
      />
      <section className="content-section directory-section">
        <div className="container-wide agent-grid">
          {agents.map((agent) => <AgentCard key={agent.id} agent={agent} />)}
        </div>
      </section>
    </PageShell>
  );
}
