'use client';

import { useActionState } from 'react';
import {
  initialPublicFormState,
  submitVisit,
} from '@/app/actions';

export function VisitForm({
  idempotencyKey,
  property,
  agent,
}: {
  idempotencyKey: string;
  property: string;
  agent?: string;
}) {
  const [state, action, pending] = useActionState(
    submitVisit,
    initialPublicFormState
  );

  return (
    <form action={action} className="lead-form visit-form">
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <input type="hidden" name="property" value={property} />
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
        <span>Preferred time · IST</span>
        <input name="requestedStart" type="datetime-local" step={3600} required />
      </label>
      <label className="form-wide">
        <span>Visit format</span>
        <select name="visitType" defaultValue="IN_PERSON">
          <option value="IN_PERSON">In person</option>
          <option value="PRIVATE_VIDEO_TOUR">Private video tour</option>
        </select>
      </label>
      <label className="form-wide">
        <span>Notes</span>
        <textarea name="notes" rows={3} maxLength={1000} />
      </label>
      <button type="submit" disabled={pending}>
        {pending ? 'Requesting…' : 'Request a visit'}
      </button>
      <p className={'form-status ' + state.status} aria-live="polite">
        {state.message}
      </p>
    </form>
  );
}
