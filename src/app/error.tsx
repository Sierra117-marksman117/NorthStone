'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[northstone-ui]', error);
  }, [error]);

  return (
    <main id="main-content" className="release-error-state">
      <p className="eyebrow">Something interrupted this view</p>
      <h1>The page could not be prepared.</h1>
      <p>Your browser-local preview data is still safe. Try this view again or return to the public collection.</p>
      <div>
        <button type="button" onClick={reset}>Try again</button>
        <Link href="/properties">Browse properties</Link>
      </div>
    </main>
  );
}
