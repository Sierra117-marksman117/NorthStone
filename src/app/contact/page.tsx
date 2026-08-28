import type { Metadata } from 'next';
import { PageIntro, PageShell } from '@/components/page-shell';
import { PreviewEnquiryForm } from '@/components/preview-property-actions';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contact Northstone Realty with a property enquiry or request for considered guidance.',
};

export default function ContactPage() {
  return (
    <PageShell>
      <PageIntro
        eyebrow="Contact Northstone"
        title="Tell us what you are looking for."
        copy="Share as much or as little as you know. A Northstone advisor will respond with a useful next step."
      />
      <section className="content-section contact-section">
        <div className="container form-feature-grid">
          <div className="contact-details">
            <p className="eyebrow">Property enquiries</p>
            <h2>A direct line to the advisory team.</h2>
            <p>Choose an illustrative residence and add a question. The enquiry is saved only in this browser and appears immediately in the Customer Portal and Operations Console.</p>
            <dl>
              <div><dt>Demo contact</dt><dd>hello@northstone.invalid · illustrative only</dd></div>
              <div><dt>Hours</dt><dd>Monday–Saturday · 9:30–18:30 IST</dd></div>
              <div><dt>Location</dt><dd>Mumbai, Maharashtra</dd></div>
            </dl>
          </div>
          <PreviewEnquiryForm compact={false} />
        </div>
      </section>
    </PageShell>
  );
}
