import { ImageResponse } from 'next/og';
import { hubBySlug } from '@/lib/hubs';

export const alt = 'Landing de oportunidades en Condor Nest';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const revalidate = 3600;

export default async function HubImage({ params }: { params: Promise<{ hub: string }> }) {
  const h = hubBySlug((await params).hub);
  const title = h?.h1 ?? 'Oportunidades para builders de LatAm';
  const accent = h?.slug === 'bounties' ? '#C6FF3D' : h?.slug === 'grants' ? '#22E1FF' : '#A78BFA';
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 68, background: '#07080B', color: '#F4F6F8', fontFamily: 'sans-serif', position: 'relative', backgroundImage: 'linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)', backgroundSize: '48px 48px' }}>
      <div style={{ position: 'absolute', top: -220, right: -60, width: 760, height: 580, borderRadius: 9999, background: `radial-gradient(circle, ${accent}55, rgba(7,8,11,0) 70%)`, display: 'flex' }} />
      <div style={{ display: 'flex', alignItems: 'center', fontSize: 34, fontWeight: 800, letterSpacing: 2 }}><span>CONDOR</span><span style={{ color: '#C6FF3D', marginLeft: 10 }}>NEST</span></div>
      <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 1050 }}>
        <div style={{ display: 'flex', alignSelf: 'flex-start', padding: '8px 18px', border: `2px solid ${accent}`, color: accent, borderRadius: 999, fontSize: 23, fontFamily: 'monospace' }}>ACTUALIZADO TODOS LOS DÍAS</div>
        <div style={{ display: 'flex', marginTop: 28, fontSize: title.length > 46 ? 58 : 70, fontWeight: 800, lineHeight: 1.08, letterSpacing: -1 }}>{title}</div>
        <div style={{ display: 'flex', marginTop: 24, fontSize: 28, color: '#AAB2BE' }}>Fechas, premios, elegibilidad y links oficiales</div>
      </div>
      <div style={{ display: 'flex', fontSize: 24, fontFamily: 'monospace', color: '#9AA3AE' }}><span>Latinoamérica</span><span style={{ marginLeft: 'auto' }}>condor-nest.lat</span></div>
    </div>,
    size,
  );
}
