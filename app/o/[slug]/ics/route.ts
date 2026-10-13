import { getListing } from '@/lib/supabase';
const fmt = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const esc = (s: string) => s.replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const l = await getListing(slug);
  if (!l) return new Response('No encontrado', { status: 404 });
  const at = l.deadlineAt ?? l.startsAt;
  if (!at) return new Response('Sin fecha', { status: 404 });
  const end = l.deadlineAt ? new Date(new Date(at).getTime() + 30 * 60e3).toISOString() : l.endsAt ?? new Date(new Date(at).getTime() + 3600e3).toISOString();
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//CondorNest//ES', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
    `UID:${l.id}@condornest`, `DTSTAMP:${fmt(new Date().toISOString())}`, `DTSTART:${fmt(at)}`, `DTEND:${fmt(end)}`,
    `SUMMARY:${esc((l.deadlineAt ? 'Cierre: ' : '') + l.title)}`, `URL:${l.applyUrl ?? l.sourceUrl}`,
    `DESCRIPTION:${esc(`Fuente: ${l.sourceUrl}`)}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  return new Response(ics, { headers: { 'content-type': 'text/calendar; charset=utf-8', 'content-disposition': `attachment; filename="${slug}.ics"` } });
}
