'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, type FormEvent } from 'react';
import { PreviewLoadingState, usePreview } from '@/components/preview-store';
import { PreviewPageHeader, PreviewStatus } from '@/components/preview-shell';
import {
  formatPreviewLabel,
  getPreviewMetrics,
  previewLeadStatusLabel,
  previewVisitStatusLabel,
  sortPreviewMedia,
} from '@/lib/preview-data';
import { formatInrAmount } from '@/lib/utils';
import type {
  LeadStatus,
  PropertyPurpose,
  PropertyStatus,
  PropertyType,
  VisitStatus,
} from '@/types';
import {
  PREVIEW_TIME_SLOTS,
  type PreviewNeighborhood,
  type PreviewProperty,
  type PreviewTimeSlot,
  type PreviewVisit,
} from '@/types/preview';

const LEAD_STATUSES: LeadStatus[] = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'VISIT_SCHEDULED',
  'NEGOTIATING',
  'WON',
  'LOST',
];

const PROPERTY_STATUSES: PropertyStatus[] = [
  'AVAILABLE',
  'RESERVED',
  'UNDER_OFFER',
  'SOLD',
  'RENTED',
];

const PROPERTY_TYPES: PropertyType[] = [
  'APARTMENT',
  'PENTHOUSE',
  'VILLA',
  'ESTATE',
  'MANSION',
  'TOWNHOUSE',
  'STUDIO',
  'COMMERCIAL',
];

function propertyInput(
  property: PreviewProperty,
  patch: Partial<PreviewProperty> = {}
) {
  const { createdAt: _createdAt, updatedAt: _updatedAt, ...input } = {
    ...property,
    ...patch,
  };
  return input;
}

function OperationsMetric({
  label,
  value,
  note,
  href,
}: {
  label: string;
  value: number;
  note: string;
  href: string;
}) {
  return (
    <Link href={href} className="operations-metric">
      <span>{label}</span>
      <strong>{String(value).padStart(2, '0')}</strong>
      <small>{note}</small>
      <i aria-hidden="true">↗</i>
    </Link>
  );
}

export function OperationsOverview() {
  const { state, ready } = usePreview();
  if (!ready) return <PreviewLoadingState />;
  const metrics = getPreviewMetrics(state);
  const maxLeadCount = Math.max(
    1,
    ...metrics.leadStatusDistribution.map((item) => item.count)
  );

  return (
    <>
      <PreviewPageHeader
        eyebrow="Operations Console"
        title="Portfolio at a glance."
        copy="A composed view of illustrative inventory, active conversations, and private appointments—calculated from this browser’s preview records."
        action={<Link href="/operations/properties/new" className="preview-button is-primary">Create property</Link>}
      />
      <section className="operations-metrics" aria-label="Operations summary">
        <OperationsMetric label="Published" value={metrics.publishedProperties} note="Publicly visible" href="/operations/properties" />
        <OperationsMetric label="Available" value={metrics.availableProperties} note="Open inventory" href="/operations/properties?status=AVAILABLE" />
        <OperationsMetric label="Reserved" value={metrics.reservedProperties} note="Held properties" href="/operations/properties?status=RESERVED" />
        <OperationsMetric label="New enquiries" value={metrics.newEnquiries} note="Awaiting contact" href="/operations/leads" />
        <OperationsMetric label="Scheduled visits" value={metrics.scheduledVisits} note="Active slots" href="/operations/visits" />
        <OperationsMetric label="Active agents" value={metrics.activeAgents} note="Advisory team" href="/operations/agents" />
      </section>

      <div className="operations-overview-grid">
        <section className="preview-panel lead-distribution">
          <div className="preview-panel-heading"><div><p className="eyebrow">Pipeline</p><h2>Lead-status distribution</h2></div><span>{state.leads.length} total leads</span></div>
          <div className="lead-chart" role="img" aria-label="Lead counts grouped by status">
            {metrics.leadStatusDistribution.map((item) => (
              <div key={item.status}>
                <span>{previewLeadStatusLabel(item.status)}</span>
                <div><i style={{ width: `${(item.count / maxLeadCount) * 100}%` }} /></div>
                <strong>{item.count}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="preview-panel activity-panel">
          <div className="preview-panel-heading"><div><p className="eyebrow">Live locally</p><h2>Recent activity</h2></div></div>
          <ol>
            {state.activity.slice(0, 6).map((activity) => (
              <li key={activity.id}>
                <span aria-hidden="true" />
                <div><strong>{activity.label}</strong><p>{activity.detail}</p></div>
                <time dateTime={activity.createdAt}>{new Date(activity.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</time>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section className="preview-panel operations-inventory-snapshot">
        <div className="preview-panel-heading"><div><p className="eyebrow">Inventory</p><h2>Recently updated properties</h2></div><Link href="/operations/properties">Manage inventory →</Link></div>
        <div className="operations-property-strip">
          {[...state.properties]
            .sort((first, second) => second.updatedAt.localeCompare(first.updatedAt))
            .slice(0, 4)
            .map((property) => {
              const media = sortPreviewMedia(property.media)[0];
              return (
                <Link href={`/operations/properties/${property.id}`} key={property.id}>
                  <div>{media ? <Image src={media.url} alt={media.alt} fill sizes="(max-width: 760px) 80vw, 22vw" /> : null}</div>
                  <p>{property.neighborhood}</p>
                  <h3>{property.title}</h3>
                  <span><PreviewStatus value={formatPreviewLabel(property.status)} /> {property.published ? 'Published' : 'Unpublished'}</span>
                </Link>
              );
            })}
        </div>
      </section>
    </>
  );
}

export function OperationsProperties() {
  const { state, ready, saveProperty } = usePreview();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [purpose, setPurpose] = useState('');
  const [sort, setSort] = useState('updated');

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return [...state.properties]
      .filter(
        (property) =>
          (!normalized ||
            property.title.toLowerCase().includes(normalized) ||
            property.neighborhood.toLowerCase().includes(normalized)) &&
          (!status || property.status === status) &&
          (!purpose || property.purpose === purpose)
      )
      .sort((first, second) => {
        if (sort === 'price-high') return second.priceAmount - first.priceAmount;
        if (sort === 'price-low') return first.priceAmount - second.priceAmount;
        if (sort === 'title') return first.title.localeCompare(second.title);
        return second.updatedAt.localeCompare(first.updatedAt);
      });
  }, [purpose, query, sort, state.properties, status]);

  if (!ready) return <PreviewLoadingState />;

  return (
    <>
      <PreviewPageHeader
        eyebrow="Inventory"
        title="Properties"
        copy="Search, publish, and manage illustrative inventory. Every change remains inside the local preview store."
        action={<Link href="/operations/properties/new" className="preview-button is-primary">Create property</Link>}
      />
      <section className="preview-toolbar" aria-label="Property filters">
        <label className="preview-search"><span className="sr-only">Search properties</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title or neighborhood" /></label>
        <label><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option>{PROPERTY_STATUSES.map((item) => <option key={item} value={item}>{formatPreviewLabel(item)}</option>)}</select></label>
        <label><span>Purpose</span><select value={purpose} onChange={(event) => setPurpose(event.target.value)}><option value="">Buy and rent</option><option value="BUY">For sale</option><option value="RENT">For rent</option></select></label>
        <label><span>Sort</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="updated">Recently updated</option><option value="title">Title</option><option value="price-high">Price: high to low</option><option value="price-low">Price: low to high</option></select></label>
      </section>

      <section className="preview-panel preview-table-panel">
        <div className="preview-table-summary"><strong>{filtered.length} properties</strong><span>{state.properties.filter((item) => item.published).length} published · {state.properties.filter((item) => item.featured).length} featured</span></div>
        <div className="preview-table-wrap">
          <table className="preview-table operations-properties-table">
            <thead><tr><th scope="col">Property</th><th scope="col">Price</th><th scope="col">Status</th><th scope="col">Agent</th><th scope="col">Visibility</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {filtered.map((property) => {
                const agent = state.agents.find((item) => item.id === property.agentId);
                const media = sortPreviewMedia(property.media)[0];
                return (
                  <tr key={property.id}>
                    <th scope="row" data-label="Property"><Link className="property-table-title" href={`/operations/properties/${property.id}`}>{media ? <span><Image src={media.url} alt="" fill sizes="64px" /></span> : null}<span><strong>{property.title}</strong><small>{property.neighborhood} · {formatPreviewLabel(property.propertyType)}</small></span></Link></th>
                    <td data-label="Price">{formatInrAmount(property.priceAmount)}{property.purpose === 'RENT' ? <small>/ month</small> : null}</td>
                    <td data-label="Status"><select aria-label={`Status for ${property.title}`} value={property.status} onChange={(event) => saveProperty(propertyInput(property, { status: event.target.value as PropertyStatus }))}>{PROPERTY_STATUSES.map((item) => <option key={item} value={item}>{formatPreviewLabel(item)}</option>)}</select></td>
                    <td data-label="Agent">{agent?.name ?? 'Unassigned'}</td>
                    <td data-label="Visibility"><button type="button" className={`publish-toggle${property.published ? ' is-on' : ''}`} aria-pressed={property.published} onClick={() => saveProperty(propertyInput(property, { published: !property.published }))}><span aria-hidden="true" />{property.published ? 'Published' : 'Unpublished'}</button></td>
                    <td data-label="Actions"><Link href={`/operations/properties/${property.id}`} aria-label={`Edit ${property.title}`}>Edit →</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!filtered.length ? <div className="preview-empty"><h2>No matching properties.</h2><button type="button" onClick={() => { setQuery(''); setStatus(''); setPurpose(''); }}>Clear filters</button></div> : null}
      </section>
    </>
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function OperationsPropertyForm({ propertyId }: { propertyId?: string }) {
  const { state, ready, saveProperty, movePropertyMedia } = usePreview();
  const router = useRouter();
  const [message, setMessage] = useState('');
  const property = propertyId
    ? state.properties.find((item) => item.id === propertyId)
    : undefined;
  const isNew = !propertyId;

  if (!ready) return <PreviewLoadingState />;
  if (!isNew && !property) {
    return <section className="preview-empty preview-panel"><h1>Property not found</h1><p>This local preview record may have been reset or removed.</p><Link href="/operations/properties">Return to properties</Link></section>;
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const title = String(data.get('title')).trim();
    const slug = String(data.get('slug')).trim() || slugify(title);
    const neighborhood = state.neighborhoods.find(
      (item) => item.id === String(data.get('neighborhoodId'))
    );
    if (!neighborhood) {
      setMessage('Choose a neighborhood.');
      return;
    }
    const media = property?.media ?? [
      { id: `${slug}-media-1`, url: '/images/generated/properties/sky-pavilion-worli-1.webp', alt: `${title} illustrative exterior`, order: 0 },
      { id: `${slug}-media-2`, url: '/images/generated/properties/the-meridian-lower-parel-2.webp', alt: `${title} illustrative interior`, order: 1 },
      { id: `${slug}-media-3`, url: '/images/generated/properties/courtyard-villa-bandra-west-3.webp', alt: `${title} illustrative terrace`, order: 2 },
    ];
    const savedId = saveProperty({
      id: property?.id ?? '',
      slug,
      title,
      headline: String(data.get('headline')).trim(),
      purpose: String(data.get('purpose')) as PropertyPurpose,
      propertyType: String(data.get('propertyType')) as PropertyType,
      status: String(data.get('status')) as PropertyStatus,
      priceAmount: Number(data.get('priceAmount')),
      bedrooms: Number(data.get('bedrooms')),
      bathrooms: Number(data.get('bathrooms')),
      areaSqFt: Number(data.get('areaSqFt')),
      neighborhoodId: neighborhood.id,
      neighborhood: neighborhood.name,
      agentId: String(data.get('agentId')),
      amenities: String(data.get('amenities')).split(',').map((item) => item.trim()).filter(Boolean),
      featured: data.get('featured') === 'on',
      published: data.get('published') === 'on',
      seoTitle: String(data.get('seoTitle')).trim(),
      seoDescription: String(data.get('seoDescription')).trim(),
      media,
    });
    setMessage('Saved in this preview.');
    router.push(`/operations/properties/${savedId}`);
  }

  const media = property ? sortPreviewMedia(property.media) : [];
  const hero = media[0];

  return (
    <>
      <PreviewPageHeader
        eyebrow="Property workflow"
        title={isNew ? 'Create a property' : `Edit ${property?.title}`}
        copy="A complete local workflow for presentation purposes. No public listing or shared database record is changed."
        action={<Link href="/operations/properties" className="preview-button">Back to properties</Link>}
      />
      <form className="operations-editor" onSubmit={submit} key={property?.id ?? 'new-property'}>
        <div className="operations-editor-main">
          <section className="preview-panel editor-section">
            <div className="editor-section-heading"><span>01</span><div><h2>Property details</h2><p>The essential public-facing information.</p></div></div>
            <div className="preview-form">
              <label><span>Property title</span><input name="title" required maxLength={140} defaultValue={property?.title} /></label>
              <label><span>URL slug</span><input name="slug" maxLength={160} defaultValue={property?.slug} placeholder="Created from the title" /></label>
              <label><span>Editorial headline</span><textarea name="headline" rows={3} required maxLength={240} defaultValue={property?.headline} /></label>
              <div className="preview-form-triple">
                <label><span>Purpose</span><select name="purpose" defaultValue={property?.purpose ?? 'BUY'}><option value="BUY">For sale</option><option value="RENT">For rent</option></select></label>
                <label><span>Type</span><select name="propertyType" defaultValue={property?.propertyType ?? 'APARTMENT'}>{PROPERTY_TYPES.map((item) => <option key={item} value={item}>{formatPreviewLabel(item)}</option>)}</select></label>
                <label><span>Status</span><select name="status" defaultValue={property?.status ?? 'AVAILABLE'}>{PROPERTY_STATUSES.map((item) => <option key={item} value={item}>{formatPreviewLabel(item)}</option>)}</select></label>
              </div>
              <div className="preview-form-triple">
                <label><span>Price · INR</span><input type="number" name="priceAmount" required min="1" step="1000" defaultValue={property?.priceAmount ?? 85000000} /></label>
                <label><span>Bedrooms</span><input type="number" name="bedrooms" required min="0" max="30" defaultValue={property?.bedrooms ?? 3} /></label>
                <label><span>Bathrooms</span><input type="number" name="bathrooms" required min="0" max="30" defaultValue={property?.bathrooms ?? 3} /></label>
              </div>
              <div className="preview-form-pair">
                <label><span>Primary area · sq ft</span><input type="number" name="areaSqFt" required min="1" defaultValue={property?.areaSqFt ?? 2400} /></label>
                <label><span>Neighborhood</span><select name="neighborhoodId" required defaultValue={property?.neighborhoodId ?? ''}><option value="" disabled>Select</option>{state.neighborhoods.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              </div>
              <label><span>Amenities · comma separated</span><textarea name="amenities" rows={4} defaultValue={property?.amenities.join(', ') ?? 'Concierge, Covered parking, Resident lounge'} /></label>
            </div>
          </section>

          <section className="preview-panel editor-section">
            <div className="editor-section-heading"><span>02</span><div><h2>Assignment and visibility</h2><p>Operational ownership and public presentation state.</p></div></div>
            <div className="preview-form">
              <label><span>Assigned agent</span><select name="agentId" required defaultValue={property?.agentId ?? ''}><option value="" disabled>Select an agent</option>{state.agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name} · {agent.active ? 'Active' : 'Inactive'}</option>)}</select></label>
              <fieldset className="preview-checkboxes inline"><legend>Presentation</legend><label><input type="checkbox" name="published" defaultChecked={property?.published ?? false} /><span><strong>Published</strong><small>Show as publicly visible in the preview inventory.</small></span></label><label><input type="checkbox" name="featured" defaultChecked={property?.featured ?? false} /><span><strong>Featured</strong><small>Prioritise in curated collections.</small></span></label></fieldset>
            </div>
          </section>

          <section className="preview-panel editor-section">
            <div className="editor-section-heading"><span>03</span><div><h2>Illustrative media</h2><p>Approved existing imagery only. No file is accepted or presented as uploaded.</p></div></div>
            {media.length ? <ol className="media-manager">{media.map((item, index) => <li key={item.id}><div><Image src={item.url} alt={item.alt} fill sizes="110px" /></div><span><strong>{index === 0 ? 'Cover image' : `Gallery image ${index + 1}`}</strong><small>{item.alt}</small></span><div><button type="button" disabled={index === 0} onClick={() => property && movePropertyMedia(property.id, item.id, -1)} aria-label={`Move ${item.alt} earlier`}>↑</button><button type="button" disabled={index === media.length - 1} onClick={() => property && movePropertyMedia(property.id, item.id, 1)} aria-label={`Move ${item.alt} later`}>↓</button></div></li>)}</ol> : <div className="media-manager-empty"><p>Three approved NORTHSTONE images will be attached when this local property is created.</p></div>}
          </section>

          <section className="preview-panel editor-section">
            <div className="editor-section-heading"><span>04</span><div><h2>Search presentation</h2><p>Illustrative SEO fields for a future connected implementation.</p></div></div>
            <div className="preview-form"><label><span>SEO title</span><input name="seoTitle" required maxLength={70} defaultValue={property?.seoTitle ?? ''} /></label><label><span>SEO description</span><textarea name="seoDescription" rows={4} required maxLength={170} defaultValue={property?.seoDescription ?? ''} /></label></div>
          </section>
        </div>

        <aside className="operations-editor-sidebar">
          <section className="editor-preview-card">
            <p className="eyebrow">Public presentation</p>
            <div>{hero ? <Image src={hero.url} alt={hero.alt} fill sizes="360px" /> : <span>Approved media attached on save</span>}</div>
            <h2>{property?.title ?? 'New Northstone residence'}</h2>
            <p>{property?.neighborhood ?? 'Mumbai'} · {property ? formatPreviewLabel(property.propertyType) : 'Property'}</p>
            <strong>{formatInrAmount(property?.priceAmount ?? 85000000)}</strong>
            {property && property.id === `property-${property.slug}` ? <Link href={`/properties/${property.slug}`}>Open public property preview ↗</Link> : <span className="editor-local-note">Local-only properties do not create public routes.</span>}
          </section>
          <div className="editor-sticky-action">
            <p>Reference preview · Saved only on this device.</p>
            <button type="submit" className="preview-button is-primary">{isNew ? 'Create preview property' : 'Save changes'}</button>
            <span className="form-status success" aria-live="polite">{message}</span>
          </div>
        </aside>
      </form>
    </>
  );
}

export function OperationsAgents() {
  const { state, ready, saveAgent } = usePreview();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('active');
  const [selectedId, setSelectedId] = useState('');
  const [message, setMessage] = useState('');

  const agents = state.agents.filter((agent) => {
    const matchesQuery =
      !query.trim() ||
      agent.name.toLowerCase().includes(query.toLowerCase()) ||
      agent.specializations.some((item) =>
        item.toLowerCase().includes(query.toLowerCase())
      );
    const matchesStatus =
      status === 'all' ||
      (status === 'active' ? agent.active : !agent.active);
    return matchesQuery && matchesStatus;
  });
  const selected =
    selectedId === 'new'
      ? undefined
      : state.agents.find((agent) => agent.id === selectedId) ?? agents[0];

  if (!ready) return <PreviewLoadingState />;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get('name')).trim();
    const id = saveAgent({
      id: selected?.id ?? '',
      slug: selected?.slug ?? slugify(name),
      name,
      title: String(data.get('title')).trim(),
      bio: String(data.get('bio')).trim(),
      avatarUrl:
        selected?.avatarUrl ?? '/images/generated/agents/priya-rajan.webp',
      specializations: String(data.get('specializations'))
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      active: data.get('active') === 'on',
    });
    setSelectedId(id);
    setMessage('Agent profile saved in this preview.');
  }

  return (
    <>
      <PreviewPageHeader
        eyebrow="Advisory team"
        title="Agents"
        copy="Explore assignments, specializations, and active preview state without making claims beyond the illustrative dataset."
        action={<button type="button" className="preview-button is-primary" onClick={() => { setSelectedId('new'); setMessage(''); }}>Create agent</button>}
      />
      <section className="preview-toolbar agents-toolbar" aria-label="Agent filters">
        <label className="preview-search"><span className="sr-only">Search agents</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name or specialization" /></label>
        <label><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="active">Active</option><option value="inactive">Inactive</option><option value="all">All agents</option></select></label>
      </section>

      <div className="operations-agents-layout">
        <section className="preview-panel agent-operations-list" aria-label="Agents">
          {agents.map((agent) => {
            const assigned = state.properties.filter(
              (property) => property.agentId === agent.id
            ).length;
            return (
              <button
                type="button"
                key={agent.id}
                className={selected?.id === agent.id ? 'is-selected' : ''}
                onClick={() => { setSelectedId(agent.id); setMessage(''); }}
              >
                <span className="agent-list-avatar"><Image src={agent.avatarUrl} alt="" fill sizes="64px" /></span>
                <span><strong>{agent.name}</strong><small>{agent.title}</small><i>{assigned} assigned {assigned === 1 ? 'property' : 'properties'}</i></span>
                <PreviewStatus value={agent.active ? 'Active' : 'Inactive'} />
              </button>
            );
          })}
          {!agents.length ? <div className="preview-empty"><p>No agents match these filters.</p></div> : null}
        </section>

        <section className="preview-panel agent-profile-editor">
          <div className="preview-panel-heading"><div><p className="eyebrow">{selected ? 'Profile view' : 'New profile'}</p><h2>{selected?.name ?? 'Create agent'}</h2></div>{selected && selected.id === `agent-${selected.slug}` ? <Link href={`/agents/${selected.slug}`}>Public profile ↗</Link> : null}</div>
          {selected ? (
            <div className="agent-profile-summary">
              <div><Image src={selected.avatarUrl} alt={`Illustrative portrait of ${selected.name}`} fill sizes="180px" /></div>
              <p>{selected.bio}</p>
              <ul>{selected.specializations.map((item) => <li key={item}>{item}</li>)}</ul>
              <div className="assigned-properties"><strong>Assigned properties</strong>{state.properties.filter((property) => property.agentId === selected.id).map((property) => <Link key={property.id} href={`/operations/properties/${property.id}`}>{property.title}<span>{formatPreviewLabel(property.status)}</span></Link>)}</div>
            </div>
          ) : null}
          <form className="preview-form agent-edit-form" onSubmit={submit} key={selected?.id ?? 'new-agent'}>
            <div className="preview-form-pair"><label><span>Name</span><input name="name" required maxLength={100} defaultValue={selected?.name} /></label><label><span>Title</span><input name="title" required maxLength={120} defaultValue={selected?.title} /></label></div>
            <label><span>Profile introduction</span><textarea name="bio" rows={4} required maxLength={800} defaultValue={selected?.bio} /></label>
            <label><span>Specializations · comma separated</span><input name="specializations" required defaultValue={selected?.specializations.join(', ')} /></label>
            <label className="preview-switch"><input type="checkbox" name="active" defaultChecked={selected?.active ?? true} /><span><strong>Active preview state</strong><small>Available for assignment in the console.</small></span></label>
            <button type="submit" className="preview-button is-primary">{selected ? 'Save agent' : 'Create preview agent'}</button>
            <p className="form-status success" aria-live="polite">{message}</p>
          </form>
        </section>
      </div>
    </>
  );
}

export function OperationsLeads() {
  const { state, ready, updateLeadStatus, addLeadNote } = usePreview();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [noteMessage, setNoteMessage] = useState('');

  const leads = state.leads.filter((lead) => {
    const normalized = query.toLowerCase();
    return (
      (!normalized ||
        lead.customerName.toLowerCase().includes(normalized) ||
        lead.propertyTitle.toLowerCase().includes(normalized)) &&
      (!status || lead.status === status)
    );
  });
  const selected = state.leads.find((lead) => lead.id === selectedId) ?? leads[0];

  if (!ready) return <PreviewLoadingState />;

  function submitNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const note = String(data.get('note')).trim();
    if (!note) return;
    addLeadNote(selected.id, note);
    form.reset();
    setNoteMessage('Internal preview note added.');
  }

  return (
    <>
      <PreviewPageHeader eyebrow="Pipeline" title="Leads" copy="A restrained operational view with allowlisted statuses, ownership, internal preview notes, and local history." />
      <section className="preview-toolbar agents-toolbar" aria-label="Lead filters">
        <label className="preview-search"><span className="sr-only">Search leads</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search customer or property" /></label>
        <label><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option>{LEAD_STATUSES.map((item) => <option value={item} key={item}>{previewLeadStatusLabel(item)}</option>)}</select></label>
      </section>

      <div className="operations-leads-layout">
        <section className="preview-panel preview-table-panel">
          <div className="preview-table-summary"><strong>{leads.length} leads</strong><span>All figures derive from local records</span></div>
          <div className="preview-table-wrap">
            <table className="preview-table leads-table">
              <thead><tr><th scope="col">Customer</th><th scope="col">Property</th><th scope="col">Source</th><th scope="col">Advisor</th><th scope="col">Status</th></tr></thead>
              <tbody>{leads.map((lead) => {
                const agent = state.agents.find((item) => item.id === lead.agentId);
                return (
                  <tr key={lead.id} className={selected?.id === lead.id ? 'is-selected' : ''} onClick={() => { setSelectedId(lead.id); setNoteMessage(''); }}>
                    <th scope="row" data-label="Customer"><button type="button" onClick={() => setSelectedId(lead.id)}>{lead.customerName}<small>{new Date(lead.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</small></button></th>
                    <td data-label="Property"><Link href={`/properties/${lead.propertySlug}`}>{lead.propertyTitle}</Link></td>
                    <td data-label="Source">{formatPreviewLabel(lead.source)}</td>
                    <td data-label="Advisor">{agent?.name ?? 'Unassigned'}</td>
                    <td data-label="Status"><select aria-label={`Status for ${lead.customerName}`} value={lead.status} onClick={(event) => event.stopPropagation()} onChange={(event) => updateLeadStatus(lead.id, event.target.value as LeadStatus)}>{LEAD_STATUSES.map((item) => <option key={item} value={item}>{previewLeadStatusLabel(item)}</option>)}</select></td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        </section>

        <aside className="preview-panel lead-detail-panel">
          {selected ? (
            <>
              <div className="lead-detail-heading"><p className="eyebrow">Lead detail</p><h2>{selected.customerName}</h2><PreviewStatus value={previewLeadStatusLabel(selected.status)} /></div>
              <dl><div><dt>Property</dt><dd><Link href={`/properties/${selected.propertySlug}`}>{selected.propertyTitle}</Link></dd></div><div><dt>Source</dt><dd>{formatPreviewLabel(selected.source)}</dd></div><div><dt>Enquiry</dt><dd>{selected.enquiryType === 'BUY' ? 'Purchase' : selected.enquiryType === 'RENT' ? 'Rental' : 'General'}</dd></div><div><dt>Advisor</dt><dd>{state.agents.find((item) => item.id === selected.agentId)?.name ?? 'Unassigned'}</dd></div></dl>
              <div className="lead-message"><strong>Customer message</strong><p>{selected.message}</p></div>
              <div className="lead-notes"><strong>Internal preview notes</strong>{selected.internalNotes.length ? <ul>{selected.internalNotes.map((note, index) => <li key={`${selected.id}-note-${index}`}>{note}</li>)}</ul> : <p>No internal notes yet.</p>}<form onSubmit={submitNote}><label><span className="sr-only">Add internal note</span><textarea name="note" rows={3} maxLength={500} placeholder="Add an internal preview note" required /></label><button type="submit">Add note</button><span aria-live="polite">{noteMessage}</span></form></div>
              <div className="lead-history"><strong>Status history</strong><ol>{[...selected.history].reverse().map((item) => <li key={item.id}><span aria-hidden="true" /><div><p>{item.label}</p><time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</time></div></li>)}</ol></div>
            </>
          ) : <div className="preview-empty"><p>Select a lead to review its detail.</p></div>}
        </aside>
      </div>
    </>
  );
}

function OperationsVisitControls({ visit }: { visit: PreviewVisit }) {
  const { updateVisit, setVisitStatus } = usePreview();
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

  return (
    <div className="operations-visit-actions">
      {visit.status === 'PENDING' ? <button type="button" onClick={() => setVisitStatus(visit.id, 'CONFIRMED')}>Approve</button> : null}
      {!['COMPLETED', 'CANCELLED'].includes(visit.status) ? <button type="button" onClick={() => setEditing((value) => !value)}>Reschedule</button> : null}
      {visit.status === 'CONFIRMED' || visit.status === 'RESCHEDULED' ? <button type="button" onClick={() => setVisitStatus(visit.id, 'COMPLETED')}>Complete</button> : null}
      {!['COMPLETED', 'CANCELLED'].includes(visit.status) ? <button type="button" className="is-danger" onClick={() => setVisitStatus(visit.id, 'CANCELLED')}>Cancel</button> : null}
      {editing ? <form onSubmit={submit}><label><span>Date</span><input type="date" name="date" min="2026-08-29" defaultValue={visit.date} required /></label><label><span>Time</span><select name="timeSlot" defaultValue={visit.timeSlot}>{PREVIEW_TIME_SLOTS.map((slot) => <option key={slot} value={slot}>{slot}</option>)}</select></label><button type="submit">Save slot</button><p aria-live="polite">{message}</p></form> : null}
    </div>
  );
}

export function OperationsVisits() {
  const { state, ready } = usePreview();
  const [status, setStatus] = useState('');
  const [query, setQuery] = useState('');
  if (!ready) return <PreviewLoadingState />;
  const visits = state.visits.filter(
    (visit) =>
      (!status || visit.status === status) &&
      (!query.trim() ||
        visit.customerName.toLowerCase().includes(query.toLowerCase()) ||
        visit.propertyTitle.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <>
      <PreviewPageHeader eyebrow="Appointments" title="Visit schedule" copy="Approve, reschedule, complete, or cancel canonical preview slots with immediate conflict feedback." />
      <section className="preview-toolbar agents-toolbar" aria-label="Visit filters">
        <label className="preview-search"><span className="sr-only">Search visits</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search customer or property" /></label>
        <label><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option>{(['PENDING', 'CONFIRMED', 'RESCHEDULED', 'COMPLETED', 'CANCELLED'] as VisitStatus[]).map((item) => <option key={item} value={item}>{previewVisitStatusLabel(item)}</option>)}</select></label>
      </section>
      <section className="preview-panel visits-schedule">
        <div className="preview-table-summary"><strong>{visits.length} appointments</strong><span>Canonical times · India Standard Time</span></div>
        <div className="operations-visits-list">
          {visits.map((visit) => {
            const agent = state.agents.find((item) => item.id === visit.agentId);
            return (
              <article key={visit.id}>
                <div className="visit-date-tile"><strong>{visit.date.slice(-2)}</strong><span>{new Date(`${visit.date}T00:00:00`).toLocaleDateString('en-IN', { month: 'short' })}</span></div>
                <div className="visit-primary"><h2>{visit.propertyTitle}</h2><p>{visit.customerName} · {visit.visitType === 'IN_PERSON' ? 'In person' : 'Private video tour'}</p></div>
                <div><span>Assigned agent</span><strong>{agent?.name ?? 'Unassigned'}</strong></div>
                <div><span>Time</span><strong>{visit.timeSlot} IST</strong></div>
                <PreviewStatus value={previewVisitStatusLabel(visit.status)} />
                <OperationsVisitControls visit={visit} />
              </article>
            );
          })}
        </div>
        {!visits.length ? <div className="preview-empty"><h2>No visits match these filters.</h2></div> : null}
      </section>
    </>
  );
}

export function OperationsNeighborhoods() {
  const { state, ready, saveNeighborhood } = usePreview();
  const [editingId, setEditingId] = useState('');
  const [message, setMessage] = useState('');
  if (!ready) return <PreviewLoadingState />;

  function submit(
    event: FormEvent<HTMLFormElement>,
    neighborhood: PreviewNeighborhood
  ) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    saveNeighborhood({
      ...neighborhood,
      summary: String(data.get('summary')).trim(),
      lifestyleHighlights: String(data.get('lifestyleHighlights'))
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      published: data.get('published') === 'on',
    });
    setMessage('Neighborhood saved in this preview.');
    setEditingId('');
  }

  return (
    <>
      <PreviewPageHeader eyebrow="Editorial places" title="Neighborhoods" copy="Maintain editorial context, lifestyle highlights, hero media, and published state for each illustrative Mumbai guide." />
      <section className="operations-neighborhood-grid">
        {state.neighborhoods.map((neighborhood) => {
          const listingCount = state.properties.filter(
            (property) => property.neighborhoodId === neighborhood.id
          ).length;
          const editing = editingId === neighborhood.id;
          return (
            <article className="preview-panel neighborhood-operations-card" key={neighborhood.id}>
              <div className="neighborhood-operations-media"><Image src={neighborhood.heroUrl} alt={`Illustrative view of ${neighborhood.name}`} fill sizes="(max-width: 760px) 100vw, 42vw" /><PreviewStatus value={neighborhood.published ? 'Published' : 'Unpublished'} /></div>
              <div className="neighborhood-operations-body">
                <div><p className="eyebrow">{neighborhood.city}</p><h2>{neighborhood.name}</h2><span>{listingCount} illustrative {listingCount === 1 ? 'listing' : 'listings'}</span></div>
                {editing ? (
                  <form className="preview-form" onSubmit={(event) => submit(event, neighborhood)}>
                    <label><span>Editorial summary</span><textarea name="summary" rows={5} maxLength={700} required defaultValue={neighborhood.summary} /></label>
                    <label><span>Lifestyle highlights · comma separated</span><input name="lifestyleHighlights" required defaultValue={neighborhood.lifestyleHighlights.join(', ')} /></label>
                    <label className="preview-switch"><input type="checkbox" name="published" defaultChecked={neighborhood.published} /><span><strong>Published</strong><small>Visible in the preview directory.</small></span></label>
                    <div className="form-actions"><button type="submit" className="preview-button is-primary">Save changes</button><button type="button" className="preview-button" onClick={() => setEditingId('')}>Cancel</button></div>
                    <p className="form-status" aria-live="polite">{message}</p>
                  </form>
                ) : (
                  <><p>{neighborhood.summary}</p><ul>{neighborhood.lifestyleHighlights.map((item) => <li key={item}>{item}</li>)}</ul><div className="neighborhood-card-actions"><button type="button" onClick={() => { setEditingId(neighborhood.id); setMessage(''); }}>Edit preview</button><Link href={`/neighborhoods/${neighborhood.slug}`}>Public guide ↗</Link></div></>
                )}
              </div>
            </article>
          );
        })}
      </section>
    </>
  );
}
