import Link from 'next/link';
import type { Faq } from '@/lib/hubs';

const LINK = /\[([^\]]+)\]\((\/[a-z0-9\-/#?=&]*)\)|(\/publicar)\b/g;
/** FAQ copy may carry internal links as [texto](/ruta) (site paths only) and bare "/publicar"; everything else is plain text. */
function Answer({ text }: { text: string }) {
  const out: React.ReactNode[] = []; let last = 0; let m: RegExpExecArray | null; LINK.lastIndex = 0;
  while ((m = LINK.exec(text))) {
    if (m.index > last) out.push(<span key={last}>{text.slice(last, m.index)}</span>);
    const href = m[2] ?? m[3]; const label = m[1] ?? m[3];
    out.push(<Link key={m.index} prefetch={false} href={href} className="text-lime hover:underline">{label}</Link>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(<span key={last}>{text.slice(last)}</span>);
  return <>{out}</>;
}
/** Plain text for JSON-LD: same words as the visible answer, link markup removed. */
export const faqText = (t: string) => t.replace(/\[([^\]]+)\]\((\/[^)]*)\)/g, '$1');

export function FaqList({ items }: { items: Faq[] }) {
  return (
    <div className="divide-y divide-border rounded-card border border-border bg-surface">
      {items.map((f) => (
        <details key={f.q} className="group p-4 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex min-h-tap cursor-pointer list-none items-center justify-between gap-4 font-medium">
            <h3>{f.q}</h3><span aria-hidden="true" className="font-mono text-lime transition-transform group-open:rotate-45">+</span>
          </summary>
          <p className="mt-2 text-fg-muted"><Answer text={f.a} /></p>
        </details>
      ))}
    </div>
  );
}
export const faqLd = (items: Faq[]) => ({ '@type': 'FAQPage', mainEntity: items.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: faqText(f.a) } })) });
