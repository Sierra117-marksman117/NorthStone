'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { usePreview } from '@/components/preview-store';
import {
  PREVIEW_TIME_SLOTS,
  type PreviewTimeSlot,
} from '@/types/preview';

function usePreviewProperty(slug: string) {
  const preview = usePreview();
  return {
    ...preview,
    property: preview.state.properties.find((item) => item.slug === slug),
  };
}

export function PreviewSaveButton({ propertySlug }: { propertySlug: string }) {
  const { property, state, ready, toggleSaved } = usePreviewProperty(propertySlug);
  if (!property) return null;
  const saved = state.savedPropertyIds.includes(property.id);

  return (
    <button
      type="button"
      className={`property-save-button${saved ? ' is-saved' : ''}`}
      onClick={() => toggleSaved(property.id)}
      disabled={!ready}
      aria-pressed={saved}
    >
      <span aria-hidden="true">{saved ? '♥' : '♡'}</span>
      {saved ? 'Saved to portal' : 'Save property'}
    </button>
  );
}

export function PreviewEnquiryForm({
  propertySlug,
  agentSlug,
  compact = true,
}: {
  propertySlug?: string;
  agentSlug?: string;
  compact?: boolean;
}) {
  const { state, ready, addLead } = usePreview();
  const [message, setMessage] = useState('');
  const agentId = agentSlug ? `agent-${agentSlug}` : undefined;
  const eligibleProperties = state.properties.filter(
    (item) =>
      item.published &&
      (!agentId || item.agentId === agentId) &&
      (!propertySlug || item.slug === propertySlug)
  );
  const fixedProperty = propertySlug ? eligibleProperties[0] : undefined;

  if (!eligibleProperties.length) {
    return (
      <div className="preview-empty">
        <p>No matching residence is available in the local preview dataset.</p>
        <Link href="/properties">Browse the collection</Link>
      </div>
    );
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const propertyId = fixedProperty?.id ?? String(data.get('propertyId'));
    const created = addLead({
      propertyId,
      message: String(data.get('message')).trim(),
      source: propertySlug
        ? 'PROPERTY_PAGE'
        : agentSlug
          ? 'AGENT_PAGE'
          : 'CONTACT_PAGE',
    });
    if (created) {
      setMessage('Enquiry saved locally and added to both preview experiences.');
      form.reset();
    }
  }

  return (
    <form className={`lead-form${compact ? ' is-compact' : ''} preview-property-form`} onSubmit={submit}>
      <p className="preview-inline-disclosure">Reference preview · No message is sent.</p>
      {!fixedProperty ? (
        <label className="form-wide">
          <span>Residence</span>
          <select name="propertyId" required defaultValue={eligibleProperties[0]?.id} onChange={() => setMessage('')}>
            {eligibleProperties.map((property) => (
              <option value={property.id} key={property.id}>{property.title} · {property.purpose === 'BUY' ? 'Buy' : 'Rent'}</option>
            ))}
          </select>
        </label>
      ) : null}
      <label className="form-wide">
        <span>What would you like to know?</span>
        <textarea
          name="message"
          rows={compact ? 4 : 5}
          maxLength={600}
          required
          defaultValue={fixedProperty ? `I would like to know more about ${fixedProperty.title}.` : 'I would like guidance on the selected residence.'}
        />
      </label>
      <button type="submit" disabled={!ready}>Create preview enquiry</button>
      <p className="form-status success" aria-live="polite">{message}</p>
      {message ? <Link href="/portal/enquiries" className="preview-form-link">View in Customer Portal →</Link> : null}
    </form>
  );
}

export function PreviewVisitForm({ propertySlug }: { propertySlug: string }) {
  const { property, ready, addVisit } = usePreviewProperty(propertySlug);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  if (!property) return <p>This property is not included in the local preview dataset.</p>;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!property) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const result = addVisit({
      propertyId: property.id,
      date: String(data.get('date')),
      timeSlot: String(data.get('timeSlot')) as PreviewTimeSlot,
      visitType: String(data.get('visitType')) as 'IN_PERSON' | 'PRIVATE_VIDEO_TOUR',
    });
    setMessage(result.message);
    setSuccess(result.ok);
    if (result.ok) form.reset();
  }

  return (
    <form className="lead-form visit-form preview-property-form" onSubmit={submit}>
      <p className="preview-inline-disclosure form-wide">Reference preview · Canonical slots are simulated locally in IST.</p>
      <label><span>Date</span><input name="date" type="date" min="2026-08-29" required /></label>
      <label><span>Time · IST</span><select name="timeSlot" defaultValue="" required><option value="" disabled>Select a time</option>{PREVIEW_TIME_SLOTS.map((slot) => <option value={slot} key={slot}>{slot}</option>)}</select></label>
      <label className="form-wide"><span>Visit format</span><select name="visitType" defaultValue="IN_PERSON"><option value="IN_PERSON">In person</option><option value="PRIVATE_VIDEO_TOUR">Private video tour</option></select></label>
      <button type="submit" disabled={!ready}>Schedule preview visit</button>
      <p className={`form-status ${success ? 'success' : 'error'}`} aria-live="polite">{message}</p>
      {success ? <Link href="/portal/visits" className="preview-form-link">Manage in Customer Portal →</Link> : null}
    </form>
  );
}
