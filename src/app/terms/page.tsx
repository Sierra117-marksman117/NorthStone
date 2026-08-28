import type { Metadata } from 'next';
import { PageIntro, PageShell } from '@/components/page-shell';

export const metadata: Metadata = { title: 'Terms' };

export default function TermsPage() {
  return (
    <PageShell>
      <PageIntro eyebrow="Terms" title="Terms for this reference property platform." copy="Please read these terms before relying on any content or submitting an enquiry." />
      <article className="container legal-copy">
        <h2>Illustrative content</h2>
        <p>Northstone is presented here as a property discovery reference build. Properties, availability, advisors, addresses, images, prices, biographies, and descriptions are illustrative and do not constitute real listings or professional representations.</p>
        <h2>No offer or valuation</h2>
        <p>Nothing on this site is an offer to sell or lease property, legal advice, investment advice, or a market valuation. Neighborhood price summaries are calculated only from the small illustrative dataset shown on this site.</p>
        <h2>Enquiries and visits</h2>
        <p>Submitting a preview form creates a browser-local demonstration record only. It does not send a message, create an agency relationship, secure a property, or confirm a real appointment.</p>
        <h2>Acceptable use</h2>
        <p>Do not enter sensitive, financial, identity, or confidential information. Reset Preview Data restores the original illustrative dataset on the current device.</p>
      </article>
    </PageShell>
  );
}
