'use client';

import { useActionState } from 'react';
import {
  initialPublicFormState,
  submitLead,
} from '@/app/actions';

export function LeadForm({
  idempotencyKey,
  source,
  inquiryType = 'GENERAL',
  property,
  agent,
  compact = false,
}: {
  idempotencyKey: string;
  source: 'PROPERTY_PAGE' | 'AGENT_PAGE' | 'CONTACT_PAGE' | 'DIRECT';
  inquiryType?: 'BUY' | 'RENT' | 'VALUATION' | 'GENERAL';
  property?: string;
  agent?: string;
  compact?: boolean;
}) {
  const [state, action, pending] = useActionState(
    submitLead,
    initialPublicFormState
  );

  return (
    <form action={action} className={'lead-form' + (compact ? ' is-compact' : '')}>
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <input type="hidden" name="source" value={source} />
      <input type="hidden" name="inquiryType" value={inquiryType} />
      {property ? <input type="hidden" name="property" value={property} /> : null}
      {agent ? <input type="hidden" name="agent" value={agent} /> : null}
      <label>
        <span>Name</span>
        <input name="visitorName" autoComplete="name" required maxLength={100} />
      </label>
      <label>
        <span>Email</span>
        <input name="visitorEmail" type="email" autoComplete="email" required maxLength={254} />
      </label>
      <label>
        <span>Phone</span>
        <input name="visitorPhone" type="tel" autoComplete="tel" maxLength={20} />
      </label>
      <label>
        <span>Preferred contact</span>
        <select name="preferredContactMethod" defaultValue="EMAIL">
          <option value="EMAIL">Email</option>
          <option value="PHONE">Phone</option>
          <option value="WHATSAPP">WhatsApp</option>
        </select>
      </label>
      <label className="form-wide">
        <span>How can we help?</span>
        <textarea name="message" rows={compact ? 3 : 5} maxLength={2000} />
      </label>
      <button type="submit" disabled={pending}>
        {pending ? 'Sending…' : 'Send enquiry'}
      </button>
      <p className={'form-status ' + state.status} aria-live="polite">
        {state.message}
      </p>
    </form>
  );
}
