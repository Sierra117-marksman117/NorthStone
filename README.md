# Northstone Realty — Complete Reference Build

Northstone Realty is a production-hardened property-discovery reference build for Mumbai. Phase 2 established the guarded service foundation, Phase 3 added the public discovery website, Phase 4 added the Customer Portal and Operations Console, and Phase 5 completed release QA and deployment hardening.

The released reference build requires no sign-in, MongoDB connection, or environment variables. All public and preview content is generated from one deterministic illustrative seed. Interactive changes use a shared, versioned browser-local dataset and never call the Phase 2 MongoDB services. Existing Phase 2 models, service authorization, and the reserved `/admin` and `/dashboard` boundaries remain intact for reference only.

## Implemented

- Next.js 16 App Router public website with responsive desktop and mobile layouts
- Customer Portal at `/portal` with saved homes, enquiries, visits, notifications, and profile preferences
- Operations Console at `/operations` with portfolio metrics, property publishing, agents, leads, visits, and neighborhood management
- Shared `northstone_preview_v1` localStorage state across both preview experiences, with seeded data and a reset control
- Local-only property saving, enquiry creation, and visit requests that appear in both experiences without network writes
- Preview routes marked `noindex, nofollow` and clearly labelled as local demonstration data
- Homepage discovery search, featured residences, property types, neighborhoods, advisors, process, and enquiry sections
- Filterable and paginated property directory with buy/rent, neighborhood, type, price, bedroom, and sort controls
- Immediate price validation: rent starts at ₹5,000/month, purchases at ₹15,00,000, blank prices remain valid, maximum must exceed minimum, and a purpose is required before entering prices
- Property detail pages with image galleries, specifications, amenities, assigned advisors, neighborhood context, related properties, enquiries, and visit requests
- Advisor directory and profiles with current listings and direct enquiry forms
- Neighborhood directory and editorial guides with collection-derived illustrative price bands
- About, contact, privacy, terms, loading, and not-found experiences
- Optimized WebP media for 10 properties, 4 advisors, 4 neighborhoods, the homepage hero, and social sharing
- Public metadata, Open Graph imagery, JSON-LD, robots.txt, and a sitemap that excludes all preview routes
- Accessible skip navigation, keyboard focus treatment, reduced-motion support, loading, empty, not-found, and recoverable error states
- The complete Phase 2 model, authorization, audit, index, media, connection, and seed-safety foundation

All properties, advisors, prices, addresses, biographies, and images are illustrative. They are published reference records, not live property advertisements.

## Local configuration

No configuration is required to run or build the released reference experience:

```bash
npm install
npm run dev
```

`NEXT_PUBLIC_SITE_URL` is an optional canonical-origin override. Vercel deployments derive the production origin from Vercel system variables.

The MongoDB variables in `.env.example` apply only to the preserved Phase 2 setup and seed utilities. The seed command refuses an unexpected database name and refuses production unless `ALLOW_SEED=true` is explicitly supplied.

## Commands

```bash
npm run dev
npm run test:phase2
npm run test:preview
npm run test:release
npm run lint
npm run type-check
npm run build
npm run crawl:release -- https://your-production-url.example
npm run setup-indexes
npm run seed
```

Run `setup-indexes` and `seed` only against a reviewed development database. Those commands are not required by the deployed reference build.

## Preview architecture

`src/lib/preview-data.ts` owns deterministic seed generation and derived metrics. `src/components/preview-store.tsx` owns browser persistence and mutations. The portal and operations pages consume that same provider, so saving a property, submitting an enquiry, or changing a visit is reflected across both experiences after navigation or reload.

This is deliberately a browser-only product preview, not an authentication or authorization substitute. It has no multi-user persistence, file uploads, email/SMS delivery, or production audit trail. The Phase 2 protected server foundation remains in the repository but is not connected to the released public or preview UI.

NORTHSTONE REALTY is an internal product reference build. Do not submit sensitive, financial, identity, or confidential information through its public forms.
