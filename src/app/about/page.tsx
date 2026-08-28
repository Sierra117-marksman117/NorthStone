import type { Metadata } from 'next';
import Link from 'next/link';
import { PageIntro, PageShell } from '@/components/page-shell';

export const metadata: Metadata = {
  title: 'About',
  description: 'Northstone is an illustrative property discovery platform built around focus, context, and considered advice.',
};

export default function AboutPage() {
  return (
    <PageShell>
      <PageIntro
        eyebrow="About Northstone"
        title="Property discovery with a quieter point of view."
        copy="Northstone is a reference property platform designed to show how a focused collection, useful local context, and human advice can make a complex search feel clear."
      />
      <section className="content-section prose-section">
        <div className="container prose-grid">
          <div><p className="eyebrow">Our approach</p><h2>Fewer distractions. Better questions.</h2></div>
          <div>
            <p>We begin with the way a client wants to live: pace, privacy, light, connection, and the spaces that matter day to day. Property type and price follow from that brief, not the other way around.</p>
            <p>This public reference build uses clearly illustrative listings, advisors, prices, descriptions, and generated imagery. It demonstrates a working discovery experience rather than advertising real homes or claiming live market credentials.</p>
            <p>Every published residence is presented with the same essentials: useful facts, honest availability, a neighborhood perspective, and a direct path to an advisor.</p>
          </div>
        </div>
      </section>
      <section className="values-grid container">
        <article><span>01</span><h3>Curate with purpose</h3><p>A smaller collection makes comparison more useful and every listing more intentional.</p></article>
        <article><span>02</span><h3>Give context</h3><p>Architecture, neighborhood, price, and practical details belong in one clear story.</p></article>
        <article><span>03</span><h3>Keep it human</h3><p>Technology should make the conversation better, not replace thoughtful advice.</p></article>
      </section>
      <section className="enquiry-cta">
        <div className="container"><p className="eyebrow">Begin here</p><h2>Tell us what a good move looks like to you.</h2><Link href="/contact" className="button-primary">Contact Northstone</Link></div>
      </section>
    </PageShell>
  );
}
