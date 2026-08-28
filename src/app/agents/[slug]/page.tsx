import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { PageShell } from '@/components/page-shell';
import { PreviewEnquiryForm } from '@/components/preview-property-actions';
import { PropertyCard } from '@/components/property-card';
import {
  getPublicAgentBySlug,
  getPublicAgentSlugs,
} from '@/services/public-data.service';

export const dynamicParams = false;

export function generateStaticParams() {
  return getPublicAgentSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const agent = await getPublicAgentBySlug((await params).slug);
  return agent
    ? { title: agent.name, description: agent.bio.slice(0, 155) }
    : { title: 'Advisor not found' };
}

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const agent = await getPublicAgentBySlug((await params).slug);
  if (!agent) notFound();
  return (
    <PageShell>
      <section className="profile-hero">
        <div className="container profile-grid">
          <div className="profile-image">
            {agent.avatar ? <Image src={agent.avatar.url} alt={agent.avatar.alt} fill preload sizes="(max-width: 800px) 100vw, 45vw" /> : null}
          </div>
          <div className="profile-copy">
            <p className="eyebrow">Northstone advisor</p>
            <h1>{agent.name}</h1>
            <p className="profile-role">{agent.title}</p>
            <p className="profile-bio">{agent.bio}</p>
            <dl>
              <div><dt>Specializations</dt><dd>{agent.specializations.join(' · ')}</dd></div>
              <div><dt>Languages</dt><dd>{agent.languages.join(' · ')}</dd></div>
              <div><dt>Illustrative contact</dt><dd>{agent.email}<br />{agent.phone}</dd></div>
            </dl>
          </div>
        </div>
      </section>
      <section className="content-section">
        <div className="container-wide section-heading"><div><p className="eyebrow">Current collection</p><h2>Properties handled by {agent.name.split(' ')[0]}</h2></div></div>
        {agent.properties.length ? <div className="container-wide property-grid">{agent.properties.map((property) => <PropertyCard key={property.id} property={property} />)}</div> : <div className="container empty-state"><h2>No published properties at present.</h2></div>}
      </section>
      <section className="contact-band">
        <div className="container form-feature-grid">
          <div><p className="eyebrow light">Start a conversation</p><h2>Speak directly with {agent.name.split(' ')[0]}.</h2><p>Share your brief and preferred way to be contacted.</p></div>
          <PreviewEnquiryForm agentSlug={agent.slug} />
        </div>
      </section>
    </PageShell>
  );
}
