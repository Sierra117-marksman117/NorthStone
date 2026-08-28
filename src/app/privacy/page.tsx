import type { Metadata } from 'next';
import { PageIntro, PageShell } from '@/components/page-shell';

export const metadata: Metadata = { title: 'Privacy' };

export default function PrivacyPage() {
  return (
    <PageShell>
      <PageIntro eyebrow="Privacy" title="A clear view of the information collected." copy="Reference privacy information for the Northstone Property Discovery Platform." />
      <article className="container legal-copy">
        <h2>Information you provide</h2>
        <p>The public preview does not ask for an email address, identity document, or payment information. Saved properties, illustrative enquiries, visits, notifications, and profile preferences are stored only in this browser under a versioned preview key.</p>
        <h2>How it is used</h2>
        <p>Browser-local information exists only to demonstrate the connected Customer Portal and Operations Console. No preview action sends an enquiry, confirms an appointment, or writes to the project’s MongoDB service layer.</p>
        <h2>Reference-build notice</h2>
        <p>This is an illustrative portfolio implementation. Do not submit sensitive, financial, identity, or confidential information. Listing content and advisor identities are illustrative.</p>
        <h2>Retention and contact</h2>
        <p>Preview records remain on this device until browser storage is cleared or the Reset Preview Data control is confirmed. The displayed email address is illustrative and is not a monitored contact channel.</p>
      </article>
    </PageShell>
  );
}
