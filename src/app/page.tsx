import Image from 'next/image';
import Link from 'next/link';
import heroImage from '../../public/images/northstone-hero.webp';
import { AgentCard } from '@/components/agent-card';
import { NeighborhoodCard } from '@/components/neighborhood-card';
import { PropertyCard } from '@/components/property-card';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import {
  getFeaturedPublicProperties,
  getPublicAgents,
  getPublicNeighborhoods,
} from '@/services/public-data.service';

export default async function HomePage() {
  const [properties, agents, neighborhoods] = await Promise.all([
    getFeaturedPublicProperties(5),
    getPublicAgents(),
    getPublicNeighborhoods(),
  ]);

  return (
    <>
      <main id="main-content">
        <section className="hero-shell">
          <Image
            src={heroImage}
            alt="Contemporary stone residence overlooking a landscaped reflecting pool at dusk"
            fill
            preload
            sizes="100vw"
            className="hero-image"
          />
          <div className="hero-wash" />
          <SiteHeader overlay />
          <div className="hero-content container-wide">
            <p className="eyebrow light">Considered property advisory · Mumbai</p>
            <h1>Exceptional homes,<br />quietly discovered.</h1>
            <p className="hero-copy">
              A considered collection of architectural residences, shaped by
              local knowledge and discreet guidance.
            </p>
            <form className="property-search" action="/properties" method="get">
              <label>
                <span>Looking to</span>
                <select name="purpose" defaultValue="BUY" aria-label="Buy or rent">
                  <option value="BUY">Buy</option>
                  <option value="RENT">Rent</option>
                </select>
              </label>
              <label>
                <span>Location</span>
                <select name="neighborhood" defaultValue="" aria-label="Neighborhood">
                  <option value="">All neighborhoods</option>
                  {neighborhoods.map((item) => (
                    <option key={item.id} value={item.slug}>{item.name}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Property type</span>
                <select name="propertyType" defaultValue="" aria-label="Property type">
                  <option value="">All residences</option>
                  <option value="APARTMENT">Apartment</option>
                  <option value="PENTHOUSE">Penthouse</option>
                  <option value="VILLA">Villa</option>
                  <option value="ESTATE">Estate</option>
                  <option value="TOWNHOUSE">Townhouse</option>
                </select>
              </label>
              <button type="submit">Search properties <span aria-hidden="true">→</span></button>
            </form>
          </div>
          <p className="hero-index" aria-hidden="true">01 / Mumbai Collection</p>
        </section>

        <section className="content-section featured-section">
          <div className="container-wide section-heading">
            <div><p className="eyebrow">The Northstone collection</p><h2>Homes of distinction</h2></div>
            <Link href="/properties">View all properties <span aria-hidden="true">→</span></Link>
          </div>
          <div className="container-wide property-grid">
            {properties.map((property, index) => (
              <PropertyCard key={property.id} property={property} priority={index < 2} />
            ))}
          </div>
        </section>

        <section className="content-section type-section">
          <div className="container">
            <p className="eyebrow">Explore by architecture</p>
            <h2>Find your kind of home.</h2>
            <div className="type-links">
              {[
                ['APARTMENT', 'Apartments', 'City homes, precisely considered.'],
                ['PENTHOUSE', 'Penthouses', 'Elevated residences with rare outlooks.'],
                ['VILLA', 'Villas', 'Private houses shaped by light and landscape.'],
                ['ESTATE', 'Estates', 'Exceptional scale, gardens, and discretion.'],
              ].map(([type, label, copy], index) => (
                <Link key={type} href={'/properties?propertyType=' + type}>
                  <span>0{index + 1}</span><h3>{label}</h3><p>{copy}</p><strong aria-hidden="true">↗</strong>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="content-section neighborhoods-section">
          <div className="container-wide section-heading">
            <div><p className="eyebrow">Local perspective</p><h2>Neighborhoods, understood.</h2></div>
            <Link href="/neighborhoods">Explore all <span aria-hidden="true">→</span></Link>
          </div>
          <div className="container-wide neighborhood-grid">
            {neighborhoods.map((neighborhood) => (
              <NeighborhoodCard key={neighborhood.id} neighborhood={neighborhood} />
            ))}
          </div>
        </section>

        <section className="content-section advisors-section">
          <div className="container-wide section-heading">
            <div><p className="eyebrow">Personal guidance</p><h2>Advisors who listen first.</h2></div>
            <Link href="/agents">Meet the team <span aria-hidden="true">→</span></Link>
          </div>
          <div className="container-wide agent-grid">
            {agents.map((agent) => <AgentCard key={agent.id} agent={agent} />)}
          </div>
        </section>

        <section className="process-section">
          <div className="container process-grid">
            <div><p className="eyebrow light">A simpler search</p><h2>Considered from brief to keys.</h2></div>
            <ol>
              <li><span>01</span><div><h3>Tell us what matters</h3><p>Share the life you want to make room for—not just a checklist.</p></div></li>
              <li><span>02</span><div><h3>Review a focused edit</h3><p>We narrow the market to a small collection worth your time.</p></div></li>
              <li><span>03</span><div><h3>Visit with context</h3><p>See each home with clear advice on place, value, and fit.</p></div></li>
            </ol>
          </div>
        </section>

        <section className="platform-section">
          <div className="container-wide platform-heading">
            <div>
              <p className="eyebrow">Explore the platform</p>
              <h2>See the complete property journey.</h2>
            </div>
            <p>
              Move from public discovery to a refined customer experience and
              the operational tools behind it. Preview changes remain on this device.
            </p>
          </div>
          <nav className="container-wide platform-links" aria-label="Platform quick links">
            <Link href="/properties">
              <span>01</span>
              <div><p>Public Website</p><h3>Browse Properties</h3><small>Discover the NORTHSTONE collection.</small></div>
              <strong aria-hidden="true">↗</strong>
            </Link>
            <Link href="/portal">
              <span>02</span>
              <div><p>For customers</p><h3>Customer Portal</h3><small>Save homes, manage enquiries, and schedule visits.</small></div>
              <strong aria-hidden="true">↗</strong>
            </Link>
            <Link href="/operations">
              <span>03</span>
              <div><p>For teams</p><h3>Operations Console</h3><small>Explore inventory, leads, agents, and appointments.</small></div>
              <strong aria-hidden="true">↗</strong>
            </Link>
          </nav>
        </section>

        <section className="enquiry-cta">
          <div className="container">
            <p className="eyebrow">Begin a conversation</p>
            <h2>Your next home may not begin with a search box.</h2>
            <p>Tell us what you are looking for. We will return with a considered point of view.</p>
            <Link href="/contact" className="button-primary">Speak with an advisor</Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
