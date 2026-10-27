import { getListing } from '@/lib/supabase';
const fmt = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const esc = (s: string) => s.replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const l = await getListing(slug);
  if (!l) return new Response('No encontrado', { status: 404 });
  const at = l.deadlineAt ?? l.startsAt;
  // Date-only (no published hour): all-day calendar entry on the published day, never an invented time.
  const day = !at ? (l.deadlineDate ?? l.startDate) : null;
  if (!at && !day) return new Response('Sin fecha', { status: 404 });
  if (day) {
    const next = new Date(`${day}T00:00:00Z`); next.setUTCDate(next.getUTCDate() + 1);
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//CondorNest//ES', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
      `UID:${l.id}@condornest`, `DTSTAMP:${fmt(new Date().toISOString())}`, `DTSTART;VALUE=DATE:${day.replace(/-/g, '')}`, `DTEND;VALUE=DATE:${next.toISOString().slice(0, 10).replace(/-/g, '')}`,
      `SUMMARY:${esc((l.deadlineDate ? 'Cierre: ' : '') + l.title)}`, `URL:${l.applyUrl ?? l.sourceUrl}`,
      `DESCRIPTION:${esc(`Hora a confirmar. Fuente: ${l.sourceUrl}`)}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    return new Response(ics, { headers: { 'content-type': 'text/calendar; charset=utf-8', 'content-disposition': `attachment; filename="${slug}.ics"` } });
  }
  if (!at) return new Response('Sin fecha', { status: 404 });
  const end = l.deadlineAt ? new Date(new Date(at).getTime() + 30 * 60e3).toISOString() : l.endsAt ?? new Date(new Date(at).getTime() + 3600e3).toISOString();
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//CondorNest//ES', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
    `UID:${l.id}@condornest`, `DTSTAMP:${fmt(new Date().toISOString())}`, `DTSTART:${fmt(at)}`, `DTEND:${fmt(end)}`,
    `SUMMARY:${esc((l.deadlineAt ? 'Cierre: ' : '') + l.title)}`, `URL:${l.applyUrl ?? l.sourceUrl}`,
    `DESCRIPTION:${esc(`Fuente: ${l.sourceUrl}`)}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  return new Response(ics, { headers: { 'content-type': 'text/calendar; charset=utf-8', 'content-disposition': `attachment; filename="${slug}.ics"` } });
}
