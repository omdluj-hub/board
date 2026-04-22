'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const trackVisit = async () => {
      try {
        await fetch('https://adminpage-xi.vercel.app/api/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            site_id: 'board',
            visited_path: pathname,
            referrer: document.referrer || 'direct',
          }),
          mode: 'no-cors',
        });
      } catch (err) {
        console.error('Tracking failed', err);
      }
    };

    trackVisit();
  }, [pathname]);

  return null;
}
