import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container-wide footer-grid">
        <div>
          <Link href="/" className="brand-lockup" aria-label="Northstone Realty home">
            <span className="brand-mark">N</span>
            <span>
              <strong>Northstone</strong>
              <small>Realty</small>
            </span>
          </Link>
          <p>
            A considered property discovery platform for distinctive homes
            across Mumbai.
          </p>
        </div>
        <nav aria-label="Properties">
          <strong>Discover</strong>
          <Link href="/properties?purpose=BUY">Homes to buy</Link>
          <Link href="/properties?purpose=RENT">Homes to rent</Link>
          <Link href="/neighborhoods">Neighborhoods</Link>
        </nav>
        <nav aria-label="Company">
          <strong>Northstone</strong>
          <Link href="/agents">Advisors</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
        </nav>
        <nav aria-label="Legal">
          <strong>Information</strong>
          <Link href="/portal">Customer Portal</Link>
          <Link href="/operations">Operations Console</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </nav>
      </div>
      <div className="container-wide footer-bottom">
        <span>© {new Date().getFullYear()} Northstone Realty</span>
        <span>Illustrative reference build · Mumbai, India</span>
      </div>
    </footer>
  );
}
