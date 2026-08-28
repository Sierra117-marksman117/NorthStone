'use client';

import Link from 'next/link';
import { useState, type FormEvent, type ReactNode } from 'react';
import { PreviewLoadingState, usePreview } from '@/components/preview-store';
import {
  PreviewPageHeader,
  PreviewStatus,
} from '@/components/preview-shell';
import { PropertyCard } from '@/components/property-card';
import {
  getPreviewMetrics,
  previewVisitStatusLabel,
  sortPreviewMedia,
} from '@/lib/preview-data';
import { formatInrAmount } from '@/lib/utils';
import type { PublicPropertyCard } from '@/types/public';
import {
  PREVIEW_TIME_SLOTS,
  type PreviewProperty,
  type PreviewTimeSlot,
  type PreviewVisit,
} from '@/types/preview';

function asPublicProperty(property: PreviewProperty): PublicPropertyCard {
  const image = sortPreviewMedia(property.media)[0];
  return {
    id: property.id,
    title: property.title,
    slug: property.slug,
    purpose: property.purpose,
    propertyType: property.propertyType,
    status: property.status,
    priceAmount: property.priceAmount,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    areaSqFt: property.areaSqFt,
    neighborhood: property.neighborhood,
    city: 'Mumbai',
    image: image
      ? { url: image.url, alt: image.alt, width: 1600, height: 1100 }
      : null,
  };
}

function PortalReady({ children }: { children: ReactNode }) {
  const { ready } = usePreview();
  return ready ? children : <PreviewLoadingState />;
}

function MetricCard({
  label,
  value,
  detail,
  href,
}: {
  label: string;
  value: number;
  detail: string;
  href: string;
}) {
  return (
    <Link href={href} className="preview-metric">
      <span>{label}</span>
      <strong>{String(value).padStart(2, '0')}</strong>
      <small>{detail} <span aria-hidden="true">→</span></small>
    </Link>
  );
}

export function PortalOverview() {
  const { state, ready } = usePreview();
  if (!ready) return <PreviewLoadingState />;
  const metrics = getPreviewMetrics(state);
  const saved = state.savedPropertyIds
    .map((id) => state.properties.find((property) => property.id === id))
    .filter((property): property is PreviewProperty => Boolean(property));
  const recommended = state.properties
    .filter((property) => property.published && !state.savedPropertyIds.includes(property.id))
    .slice(0, 3);

  return (
    <>
      <PreviewPageHeader
        eyebrow="Customer Portal"
        title={`Good afternoon, ${state.profile.name.split(' ')[0]}.`}
        copy="Your saved homes, conversations, and private appointments—all held locally in this reference preview."
        action={<Link href="/properties" className="preview-button is-primary">Explore properties</Link>}
      />
      <section className="preview-metrics" aria-label="Portal summary">
        <MetricCard label="Saved properties" value={metrics.savedProperties} detail="Review your shortlist" href="/portal/saved" />
        <MetricCard label="Upcoming visits" value={metrics.upcomingVisits} detail="Manage appointments" href="/portal/visits" />
        <MetricCard label="Active enquiries" value={metrics.activeEnquiries} detail="Follow conversations" href="/portal/enquiries" />
        <MetricCard label="Unread updates" value={metrics.unreadNotifications} detail="View notifications" href="/portal/notifications" />
      </section>

      <section className="preview-panel portal-feature-panel">
        <div className="preview-panel-heading">
          <div><p className="eyebrow">Your shortlist</p><h2>Saved with intention.</h2></div>
          <Link href="/portal/saved">View all <span aria-hidden="true">→</span></Link>
        </div>
        {saved.length ? (
          <div className="preview-property-list">
            {saved.slice(0, 2).map((property) => (
              <article key={property.id}>
                <PropertyCard property={asPublicProperty(property)} priority />
              </article>
            ))}
          </div>
        ) : (
          <div className="preview-empty"><h3>Your shortlist is ready when you are.</h3><Link href="/properties">Browse properties</Link></div>
        )}
      </section>

      <section className="preview-panel">
        <div className="preview-panel-heading">
          <div><p className="eyebrow">Consider next</p><h2>Recommended for your brief.</h2></div>
          <span>Based on {state.profile.preference === 'BUY' ? 'buying' : 'renting'} in {state.profile.preferredCity}</span>
        </div>
        <div className="portal-recommendations">
          {recommended.map((property) => {
            const media = sortPreviewMedia(property.media)[0];
            return (
              <Link href={`/properties/${property.slug}`} key={property.id}>
                <span className="portal-recommendation-index">{property.propertyType.replaceAll('_', ' ')}</span>
                <div>
                  <h3>{property.title}</h3>
                  <p>{property.headline}</p>
                </div>
                <strong>{formatInrAmount(property.priceAmount)}</strong>
                {media ? <span className="sr-only">Image: {media.alt}</span> : null}
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}

export function PortalSaved() {
  const { state, ready, toggleSaved } = usePreview();
  if (!ready) return <PreviewLoadingState />;
  const properties = state.savedPropertyIds
    .map((id) => state.properties.find((property) => property.id === id))
    .filter((property): property is PreviewProperty => Boolean(property));

  return (
    <>
      <PreviewPageHeader
        eyebrow="Your collection"
        title="Saved properties"
        copy="A focused shortlist that stays with this browser until you remove it or reset the preview."
        action={<Link href="/properties" className="preview-button is-primary">Add another property</Link>}
      />
      {properties.length ? (
        <section className="portal-saved-grid" aria-label="Saved properties">
          {properties.map((property, index) => (
            <article className="portal-saved-item" key={property.id}>
              <PropertyCard property={asPublicProperty(property)} priority={index < 2} />
              <button type="button" onClick={() => toggleSaved(property.id)}>Remove from saved</button>
            </article>
          ))}
        </section>
      ) : (
        <section className="preview-empty preview-panel">
          <p className="eyebrow">Nothing saved yet</p>
          <h2>Begin with a home that stays with you.</h2>
          <p>Use “Save property” on any public property page. Your selection will appear here immediately.</p>
          <Link href="/properties" className="preview-button is-primary">Browse properties</Link>
        </section>
      )}
    </>
  );
}

export function PortalEnquiries() {
  const { state } = usePreview();
  return (
    <PortalReady>
      <PreviewPageHeader
        eyebrow="Conversations"
        title="Your enquiries"
        copy="Customer-safe updates only. Internal notes, ownership, and operational history remain in the Operations Console."
        action={<Link href="/properties" className="preview-button is-primary">Make an enquiry</Link>}
      />
      <section className="preview-panel preview-table-panel">
        <div className="preview-table-wrap">
          <table className="preview-table">
            <thead><tr><th scope="col">Property</th><th scope="col">Enquiry date</th><th scope="col">Type</th><th scope="col">Status</th><th scope="col"><span className="sr-only">Open</span></th></tr></thead>
            <tbody>
              {state.leads
                .filter((lead) => lead.customerName === state.profile.name)
                .map((lead) => (
                  <tr key={lead.id}>
                    <th scope="row" data-label="Property"><Link href={`/properties/${lead.propertySlug}`}>{lead.propertyTitle}</Link></th>
                    <td data-label="Enquiry date">{new Date(lead.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td data-label="Type">{lead.enquiryType === 'BUY' ? 'Purchase' : lead.enquiryType === 'RENT' ? 'Rental' : 'General'}</td>
                    <td data-label="Status"><PreviewStatus value={lead.customerStatus} /></td>
                    <td data-label="Open"><Link href={`/properties/${lead.propertySlug}`} aria-label={`Open ${lead.propertyTitle}`}>↗</Link></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </PortalReady>
  );
}

function VisitRescheduleForm({ visit }: { visit: PreviewVisit }) {
  const { updateVisit } = usePreview();
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState('');

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const result = updateVisit(visit.id, {
      date: String(data.get('date')),
      timeSlot: String(data.get('timeSlot')) as PreviewTimeSlot,
    });
    setMessage(result.message);
    if (result.ok) setEditing(false);
  }

  if (!editing) {
    return <button type="button" className="preview-text-button" onClick={() => setEditing(true)}>Reschedule</button>;
  }

  return (
    <form className="visit-reschedule" onSubmit={submit}>
      <label><span>Date</span><input type="date" name="date" defaultValue={visit.date} min="2026-08-29" required /></label>
      <label><span>Time</span><select name="timeSlot" defaultValue={visit.timeSlot}>{PREVIEW_TIME_SLOTS.map((slot) => <option key={slot} value={slot}>{slot}</option>)}</select></label>
      <div><button type="submit">Save</button><button type="button" className="is-quiet" onClick={() => setEditing(false)}>Close</button></div>
      <p className="form-status" aria-live="polite">{message}</p>
    </form>
  );
}

function PortalScheduleVisit() {
  const { state, addVisit } = usePreview();
  const [message, setMessage] = useState('');

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const result = addVisit({
      propertyId: String(data.get('propertyId')),
      date: String(data.get('date')),
      timeSlot: String(data.get('timeSlot')) as PreviewTimeSlot,
      visitType: String(data.get('visitType')) as 'IN_PERSON' | 'PRIVATE_VIDEO_TOUR',
    });
    setMessage(result.message);
    if (result.ok) form.reset();
  }

  return (
    <section className="preview-panel portal-schedule-panel">
      <div><p className="eyebrow">Private appointments</p><h2>Schedule a preview visit.</h2><p>Canonical times are simulated locally in India Standard Time. Occupied slots cannot be double-booked.</p></div>
      <form className="preview-form" onSubmit={submit}>
        <label><span>Property</span><select name="propertyId" required defaultValue=""><option value="" disabled>Select a property</option>{state.properties.filter((item) => item.published).map((property) => <option key={property.id} value={property.id}>{property.title}</option>)}</select></label>
        <div className="preview-form-pair">
          <label><span>Date</span><input type="date" name="date" min="2026-08-29" required /></label>
          <label><span>Time · IST</span><select name="timeSlot" required defaultValue=""><option value="" disabled>Select</option>{PREVIEW_TIME_SLOTS.map((slot) => <option key={slot} value={slot}>{slot}</option>)}</select></label>
        </div>
        <label><span>Format</span><select name="visitType" defaultValue="IN_PERSON"><option value="IN_PERSON">In person</option><option value="PRIVATE_VIDEO_TOUR">Private video tour</option></select></label>
        <button type="submit" className="preview-button is-primary">Schedule preview visit</button>
        <p className="form-status" aria-live="polite">{message}</p>
      </form>
    </section>
  );
}

function PortalVisitList({
  items,
  heading,
}: {
  items: PreviewVisit[];
  heading: string;
}) {
  const { state, setVisitStatus } = usePreview();
  return (
    <section className="preview-panel">
      <div className="preview-panel-heading"><h2>{heading}</h2><span>{items.length} {items.length === 1 ? 'appointment' : 'appointments'}</span></div>
      {items.length ? <div className="portal-visits-list">{items.map((visit) => {
        const agent = state.agents.find((item) => item.id === visit.agentId);
        return (
          <article key={visit.id}>
            <div className="visit-date-tile"><strong>{visit.date.slice(-2)}</strong><span>{new Date(`${visit.date}T00:00:00`).toLocaleDateString('en-IN', { month: 'short' })}</span></div>
            <div><h3><Link href={`/properties/${visit.propertySlug}`}>{visit.propertyTitle}</Link></h3><p>{visit.timeSlot} IST · {visit.visitType === 'IN_PERSON' ? 'In person' : 'Private video tour'}</p><small>{agent?.name ?? 'Northstone advisor'}</small></div>
            <PreviewStatus value={previewVisitStatusLabel(visit.status)} />
            {!['COMPLETED', 'CANCELLED'].includes(visit.status) ? <div className="visit-actions"><VisitRescheduleForm visit={visit} /><button type="button" className="preview-text-button is-danger" onClick={() => setVisitStatus(visit.id, 'CANCELLED')}>Cancel</button></div> : null}
          </article>
        );
      })}</div> : <div className="preview-empty"><p>No {heading.toLowerCase()}.</p></div>}
    </section>
  );
}

export function PortalVisits() {
  const { state, ready } = usePreview();
  if (!ready) return <PreviewLoadingState />;
  const visits = state.visits.filter((visit) => visit.customerName === state.profile.name);
  const upcoming = visits.filter((visit) => !['COMPLETED', 'CANCELLED'].includes(visit.status));
  const past = visits.filter((visit) => ['COMPLETED', 'CANCELLED'].includes(visit.status));

  return (
    <>
      <PreviewPageHeader eyebrow="Your time" title="Visits" copy="Schedule, reschedule, or cancel appointments inside this device-only preview." />
      <PortalScheduleVisit />
      <PortalVisitList items={upcoming} heading="Upcoming visits" />
      <PortalVisitList items={past} heading="Past visits" />
    </>
  );
}

export function PortalNotifications() {
  const { state, ready, markNotificationRead, markAllNotificationsRead } = usePreview();
  if (!ready) return <PreviewLoadingState />;
  const unread = state.notifications.filter((notification) => !notification.read).length;

  return (
    <>
      <PreviewPageHeader
        eyebrow="Updates"
        title="Notifications"
        copy="Property and appointment updates held privately in this browser."
        action={unread ? <button type="button" className="preview-button" onClick={markAllNotificationsRead}>Mark all as read</button> : undefined}
      />
      <section className="preview-panel notification-list" aria-label="Notifications">
        {state.notifications.map((notification) => (
          <article key={notification.id} className={notification.read ? '' : 'is-unread'}>
            <span className="notification-dot" aria-hidden="true" />
            <div><div><h2>{notification.title}</h2><time dateTime={notification.createdAt}>{new Date(notification.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</time></div><p>{notification.body}</p>{notification.propertySlug ? <Link href={`/properties/${notification.propertySlug}`}>Open property <span aria-hidden="true">→</span></Link> : null}</div>
            {!notification.read ? <button type="button" onClick={() => markNotificationRead(notification.id)}>Mark as read</button> : <span className="notification-read">Read</span>}
          </article>
        ))}
      </section>
    </>
  );
}

export function PortalProfile() {
  const { state, ready, updateProfile } = usePreview();
  const [message, setMessage] = useState('');
  if (!ready) return <PreviewLoadingState />;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    updateProfile({
      name: String(data.get('name')).trim(),
      phone: String(data.get('phone')).trim(),
      preferredCity: String(data.get('preferredCity')).trim(),
      preference: String(data.get('preference')) as 'BUY' | 'RENT',
      propertyAlerts: data.get('propertyAlerts') === 'on',
      visitReminders: data.get('visitReminders') === 'on',
    });
    setMessage('Saved in this preview.');
  }

  return (
    <>
      <PreviewPageHeader eyebrow="Preferences" title="Your profile" copy="This illustrative customer persona contains no login credentials and remains on this device." />
      <section className="preview-panel profile-preview-panel">
        <div className="profile-preview-intro"><span>{state.profile.name.split(' ').map((part) => part[0]).join('')}</span><h2>{state.profile.name}</h2><p>Illustrative customer persona</p></div>
        <form className="preview-form" onSubmit={submit}>
          <div className="preview-form-pair">
            <label><span>Name</span><input name="name" required maxLength={100} defaultValue={state.profile.name} autoComplete="name" /></label>
            <label><span>Phone</span><input name="phone" required maxLength={20} defaultValue={state.profile.phone} autoComplete="tel" /></label>
          </div>
          <div className="preview-form-pair">
            <label><span>Preferred city</span><input name="preferredCity" required maxLength={80} defaultValue={state.profile.preferredCity} /></label>
            <label><span>Looking to</span><select name="preference" defaultValue={state.profile.preference}><option value="BUY">Buy</option><option value="RENT">Rent</option></select></label>
          </div>
          <fieldset className="preview-checkboxes"><legend>Communication preferences</legend><label><input type="checkbox" name="propertyAlerts" defaultChecked={state.profile.propertyAlerts} /><span><strong>Property alerts</strong><small>Show matching-property updates in this preview.</small></span></label><label><input type="checkbox" name="visitReminders" defaultChecked={state.profile.visitReminders} /><span><strong>Visit reminders</strong><small>Show local reminders for upcoming appointments.</small></span></label></fieldset>
          <button type="submit" className="preview-button is-primary">Save profile</button>
          <p className="form-status success" aria-live="polite">{message}</p>
        </form>
      </section>
    </>
  );
}
