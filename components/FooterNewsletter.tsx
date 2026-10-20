'use client';
import { usePathname } from 'next/navigation';
import { Newsletter } from './Newsletter';
/** Footer signup (mobile). Hidden on /newsletter/* pages, which already have their own form or a confirmation. */
export function FooterNewsletter() {
  if (usePathname()?.startsWith('/newsletter')) return null;
  return <div className="lg:hidden"><Newsletter variant="mini" /></div>;
}
