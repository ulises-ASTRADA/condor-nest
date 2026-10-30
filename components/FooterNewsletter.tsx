'use client';
import { usePathname } from 'next/navigation';
import { Newsletter } from './Newsletter';
/** Single site-wide signup. Not rendered on /newsletter/* pages (own form or confirmation) nor on /go-gone (served script-free
 *  as the /go/<slug> 404, where a JS form would only reload the page). */
export function FooterNewsletter() {
  const p = usePathname();
  if (p?.startsWith('/newsletter') || p === '/go-gone') return null;
  return <div id="newsletter"><Newsletter variant="mini" /></div>;
}
