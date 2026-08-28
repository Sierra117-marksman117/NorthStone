'use client';

import { useState } from 'react';

export function ShareButton({ title }: { title: string }) {
  const [label, setLabel] = useState('Share');

  async function share() {
    const data = { title, url: window.location.href };
    try {
      if (navigator.share) {
        await navigator.share(data);
      } else {
        await navigator.clipboard.writeText(data.url);
        setLabel('Link copied');
        window.setTimeout(() => setLabel('Share'), 1800);
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') setLabel('Try again');
    }
  }

  return (
    <button type="button" className="share-button" onClick={share}>
      {label} <span aria-hidden="true">↗</span>
    </button>
  );
}
