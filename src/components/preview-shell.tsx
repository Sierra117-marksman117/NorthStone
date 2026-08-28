'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { usePreview } from '@/components/preview-store';

const portalNavigation = [
  { href: '/portal', label: 'Overview', icon: '⌂' },
  { href: '/portal/saved', label: 'Saved properties', icon: '♡' },
  { href: '/portal/enquiries', label: 'Enquiries', icon: '↗' },
  { href: '/portal/visits', label: 'Visits', icon: '◇' },
  { href: '/portal/notifications', label: 'Notifications', icon: '◌' },
  { href: '/portal/profile', label: 'Profile', icon: '○' },
] as const;

const operationsNavigation = [
  { href: '/operations', label: 'Overview', icon: '⌂' },
  { href: '/operations/properties', label: 'Properties', icon: '▦' },
  { href: '/operations/agents', label: 'Agents', icon: '○' },
  { href: '/operations/leads', label: 'Leads', icon: '↗' },
  { href: '/operations/visits', label: 'Visits', icon: '◇' },
  { href: '/operations/neighborhoods', label: 'Neighborhoods', icon: '⌖' },
] as const;

function isCurrent(pathname: string, href: string) {
  if (href === '/portal' || href === '/operations') return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function ExperienceSwitcher({ compact = false }: { compact?: boolean }) {
  return (
    <nav
      className={`experience-switcher${compact ? ' is-compact' : ''}`}
      aria-label="Switch experience"
    >
      <Link href="/">Public Website</Link>
      <Link href="/portal">Customer Portal</Link>
      <Link href="/operations">Operations Console</Link>
    </nav>
  );
}

function ResetPreviewAction() {
  const { reset } = usePreview();
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState('');

  function resetPreview() {
    reset();
    setConfirming(false);
    setMessage('Preview data restored.');
  }

  return (
    <div className="preview-reset">
      {confirming ? (
        <div className="preview-reset-confirm" role="group" aria-label="Confirm preview reset">
          <span>Restore the original preview?</span>
          <button type="button" onClick={resetPreview}>Reset</button>
          <button type="button" className="is-quiet" onClick={() => setConfirming(false)}>Cancel</button>
        </div>
      ) : (
        <button type="button" onClick={() => { setConfirming(true); setMessage(''); }}>
          Reset Preview Data
        </button>
      )}
      <span className="sr-only" aria-live="polite">{message}</span>
    </div>
  );
}

export function PreviewShell({
  area,
  children,
}: {
  area: 'portal' | 'operations';
  children: ReactNode;
}) {
  const pathname = usePathname();
  const navigation = area === 'portal' ? portalNavigation : operationsNavigation;
  const title = area === 'portal' ? 'Customer Portal' : 'Operations Console';

  return (
    <div className={`preview-app preview-${area}`}>
      <aside className="preview-sidebar">
        <Link href="/" className="preview-brand" aria-label="Northstone Realty homepage">
          <span className="brand-mark">N</span>
          <span><strong>Northstone</strong><small>{title}</small></span>
        </Link>
        <p className="preview-disclosure">Reference preview · Changes made here remain on this device.</p>
        <nav className="preview-navigation" aria-label={`${title} navigation`}>
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isCurrent(pathname, item.href) ? 'page' : undefined}
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="preview-sidebar-footer">
          <ExperienceSwitcher compact />
          <ResetPreviewAction />
        </div>
      </aside>

      <div className="preview-stage">
        <header className="preview-mobile-header">
          <Link href="/" className="preview-brand" aria-label="Northstone Realty homepage">
            <span className="brand-mark">N</span>
            <span><strong>Northstone</strong><small>{title}</small></span>
          </Link>
          <details className="preview-mobile-navigation">
            <summary>Menu</summary>
            <nav aria-label={`${title} mobile navigation`}>
              {navigation.map((item) => (
                <Link key={item.href} href={item.href} aria-current={isCurrent(pathname, item.href) ? 'page' : undefined}>
                  {item.label}
                </Link>
              ))}
              <ResetPreviewAction />
            </nav>
          </details>
        </header>
        <div className="preview-topbar">
          <ExperienceSwitcher />
          <p>Private to this browser</p>
        </div>
        <main id="main-content" className="preview-main">{children}</main>
      </div>
    </div>
  );
}

export function PreviewPageHeader({
  eyebrow,
  title,
  copy,
  action,
}: {
  eyebrow: string;
  title: string;
  copy: string;
  action?: ReactNode;
}) {
  return (
    <header className="preview-page-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{copy}</p>
      </div>
      {action ? <div className="preview-page-action">{action}</div> : null}
    </header>
  );
}

export function PreviewStatus({ value }: { value: string }) {
  const normalized = value.toLowerCase().replaceAll('_', '-');
  return (
    <span className={`preview-status status-${normalized}`}>
      {value.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())}
    </span>
  );
}
