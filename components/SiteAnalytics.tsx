'use client';
import { usePathname } from 'next/navigation';
import { Analytics } from '@vercel/analytics/next';

export function SiteAnalytics() {
  const path = usePathname();
  // Survey invitations are private bearer links; never track this route.
  return path === '/como-nos-conociste' ? null : <Analytics />;
}
