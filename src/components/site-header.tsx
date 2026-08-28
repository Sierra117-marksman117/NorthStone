import Link from 'next/link';

export function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  return (
    <header className={'site-header container-wide' + (overlay ? ' is-overlay' : '')}>
      <Link href="/" className="brand-lockup" aria-label="Northstone Realty home">
        <span className="brand-mark">N</span>
        <span>
          <strong>Northstone</strong>
          <small>Realty</small>
        </span>
      </Link>
      <nav className="desktop-nav" aria-label="Primary navigation">
        <Link href="/properties?purpose=BUY">Buy</Link>
        <Link href="/properties?purpose=RENT">Rent</Link>
        <Link href="/neighborhoods">Neighborhoods</Link>
        <Link href="/agents">Advisors</Link>
        <Link href="/about">About</Link>
      </nav>
      <Link href="/contact" className="header-cta">
        Enquire <span aria-hidden="true">↗</span>
      </Link>
      <details className="mobile-menu">
        <summary aria-label="Open navigation">Menu</summary>
        <nav aria-label="Mobile navigation">
          <Link href="/properties?purpose=BUY">Buy</Link>
          <Link href="/properties?purpose=RENT">Rent</Link>
          <Link href="/neighborhoods">Neighborhoods</Link>
          <Link href="/agents">Advisors</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
        </nav>
      </details>
    </header>
  );
}
