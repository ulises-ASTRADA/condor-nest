import { getListings } from '@/lib/supabase';
import { isOpen, sortListings } from '@/lib/rank';
import { SITE } from '@/lib/site';
export const revalidate = 3600;
export async function GET() {
  const now = new Date();
  const open = sortListings((await getListings()).filter((l) => isOpen(l, now)), 'cierra-pronto', now);
  const body = `# Condor Nest

> Condor Nest junta en un solo feed en español los hackathons, bounties y grants abiertos a builders de Argentina y Latinoamérica. Se actualiza todos los días con Superteam Earn, Devpost, Taikai y eventos curados de X y Luma, y cada evento curado se verifica en su página oficial antes de publicarse. Hecho en Córdoba, Argentina.

## Páginas principales
- [Feed de oportunidades](${SITE}/): filtros por tipo, país, modalidad y ecosistema; orden por cierre o por "menos competencia".
- [Acerca](${SITE}/acerca): qué listamos, cómo se calcula "menos competencia" y transparencia (Destacado y afiliados).
- [Publicá tu evento](${SITE}/publicar)
- [Sitemap](${SITE}/sitemap.xml)

## Oportunidades abiertas
${open.map((l) => `- [${l.title}](${SITE}/o/${l.slug})`).join('\n')}
`;
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
}
