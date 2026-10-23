import { ImageResponse } from 'next/og';
export const alt = 'Condor Nest · Hackathons, bounties y grants para builders de LatAm';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OG() {
  const lime = '#C6FF3D', cyan = '#22E1FF', violet = '#A78BFA';
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 72, background: '#07080B', color: '#F4F6F8', fontFamily: 'sans-serif', position: 'relative',
        backgroundImage: 'linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)', backgroundSize: '48px 48px' }}>
        <div style={{ position: 'absolute', top: -220, left: 300, width: 700, height: 500, borderRadius: 9999, background: 'radial-gradient(circle, rgba(198,255,61,.35), rgba(7,8,11,0) 70%)', display: 'flex' }} />
        <div style={{ position: 'absolute', bottom: -260, right: -120, width: 600, height: 500, borderRadius: 9999, background: 'radial-gradient(circle, rgba(167,139,250,.35), rgba(7,8,11,0) 70%)', display: 'flex' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <svg width="88" height="88" viewBox="0 0 32 32" fill="none" stroke={lime} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 9 L9 6.5 L2 10 L9 9.5 Z" /><path d="M16 9 L23 6.5 L30 10 L23 9.5 Z" /><path d="M16 6.5 V13.5 M14.6 13.5 L16 16 L17.4 13.5" /><circle cx="16" cy="5.2" r="1.1" />
            <path d="M8.5 21 L12 18.5 H20 L23.5 21 L20 23.5 H12 Z" /><path d="M7 24.5 Q16 30.5 25 24.5" /><path d="M9.5 27.5 Q16 31.5 22.5 27.5" />
          </svg>
          <div style={{ display: 'flex', fontSize: 52, fontWeight: 800, letterSpacing: 2 }}><span>CONDOR</span><span style={{ color: lime, marginLeft: 16 }}>NEST</span></div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 76, fontWeight: 800, lineHeight: 1.05 }}><span style={{ color: lime }}>Oportunidades</span><span style={{ marginLeft: 22 }}>para</span></div>
          <div style={{ display: 'flex', fontSize: 76, fontWeight: 800, lineHeight: 1.05 }}>builders de LatAm</div>
          <div style={{ display: 'flex', marginTop: 28, fontSize: 30, color: '#9AA3AE' }}>Hackathons, bounties y grants en un solo feed en español</div>
        </div>
        <div style={{ display: 'flex', gap: 14, fontSize: 24, fontFamily: 'monospace' }}>
          {[['HACKATHONS', violet], ['BOUNTIES', lime], ['GRANTS', cyan]].map(([t, c]) => (
            <div key={t} style={{ display: 'flex', padding: '8px 18px', border: `2px solid ${c}`, color: c, borderRadius: 999 }}>{t}</div>
          ))}
          <div style={{ display: 'flex', marginLeft: 'auto', color: '#9AA3AE' }}>condor-nest.lat</div>
        </div>
      </div>
    ),
    size,
  );
}
