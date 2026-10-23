'use client';
import { usePathname } from 'next/navigation';
import { Analytics } from '@vercel/analytics/next';
import type { BeforeSend } from '@vercel/analytics';
import { Suspense } from 'react';
import { ListingAnalytics } from './ListingAnalytics';

const beforeSend: BeforeSend = (event) => {
  try {
    if (localStorage.getItem('cn-analytics-opt-out')) return null;
    const url = new URL(event.url);
    url.searchParams.delete('cn_entry');
    return { ...event, url: url.toString() };
  } catch { return null; }
};

export function SiteAnalytics() {
  const path = usePathname();
  // Survey invitations are private bearer links; never track this route.
  return path === '/como-nos-conociste' || path === '/destacar' ? null : <><Analytics beforeSend={beforeSend} /><Suspense fallback={null}><ListingAnalytics /></Suspense></>;
}
