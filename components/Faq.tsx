import type { Faq } from '@/lib/hubs';
export function FaqList({ items }: { items: Faq[] }) {
  return (
    <div className="divide-y divide-border rounded-card border border-border bg-surface">
      {items.map((f) => (
        <details key={f.q} className="group p-4 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex min-h-tap cursor-pointer list-none items-center justify-between gap-4 font-medium">
            <h3>{f.q}</h3><span aria-hidden="true" className="font-mono text-lime transition-transform group-open:rotate-45">+</span>
          </summary>
          <p className="mt-2 text-fg-muted">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
export const faqLd = (items: Faq[]) => ({ '@type': 'FAQPage', mainEntity: items.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) });
