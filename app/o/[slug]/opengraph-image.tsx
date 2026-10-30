import { ImageResponse } from 'next/og';
import { getListing } from '@/lib/supabase';
import type { Listing } from '@/lib/types';
import { rewardText, TYPE_LABEL } from '@/lib/format';

export const alt = 'Evento publicado en Condor Nest';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const revalidate = 300;

const color = (l: Listing) => l.type === 'hackathon' ? '#A78BFA' : l.type === 'bounty' ? '#C6FF3D' : '#22E1FF';

export default async function EventImage({ params }: { params: Promise<{ slug: string }> }) {
  const l = await getListing((await params).slug);
  const accent = l ? color(l) : '#C6FF3D';
  const reward = l ? rewardText(l) : null;
  const detail = l ? [l.organizer, l.modality === 'online' ? 'Virtual' : l.city].filter(Boolean).join(' · ') : 'Oportunidades para builders de LatAm';
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 68, background: '#07080B', color: '#F4F6F8', fontFamily: 'sans-serif', position: 'relative', backgroundImage: 'linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)', backgroundSize: '48px 48px' }}>
      <div style={{ position: 'absolute', top: -240, right: -80, width: 760, height: 600, borderRadius: 9999, background: `radial-gradient(circle, ${accent}55, rgba(7,8,11,0) 70%)`, display: 'flex' }} />
      <div style={{ display: 'flex', alignItems: 'center', fontSize: 34, fontWeight: 800, letterSpacing: 2 }}><span>CONDOR</span><span style={{ color: '#C6FF3D', marginLeft: 10 }}>NEST</span></div>
      <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 1040 }}>
        <div style={{ display: 'flex', alignSelf: 'flex-start', padding: '8px 18px', border: `2px solid ${accent}`, color: accent, borderRadius: 999, fontSize: 23, fontFamily: 'monospace' }}>{l ? TYPE_LABEL[l.type].toUpperCase() : 'OPORTUNIDAD'}</div>
        <div style={{ display: 'flex', marginTop: 24, fontSize: l && l.title.length > 62 ? 52 : 64, fontWeight: 800, lineHeight: 1.08, letterSpacing: -1 }}>{l?.title ?? 'Convocatoria no encontrada'}</div>
        <div style={{ display: 'flex', marginTop: 24, fontSize: 27, color: '#AAB2BE' }}>{detail}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', fontSize: 24, fontFamily: 'monospace' }}>
        {reward && !reward.missing ? <span style={{ color: accent }}>{reward.main}</span> : <span style={{ color: '#9AA3AE' }}>Hackathons · Bounties · Grants</span>}
        <span style={{ marginLeft: 'auto', color: '#9AA3AE' }}>condor-nest.lat</span>
      </div>
    </div>,
    size,
  );
}
