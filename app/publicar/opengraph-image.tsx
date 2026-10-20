import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';

export const alt = 'Publicá tu hackathon gratis en Condor Nest';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Same background, glows and logo as app/opengraph-image.tsx; Noto Sans + Space Mono (OFL, latin subset) for the /publicar card.
const font = (f: string) => readFile(join(process.cwd(), 'assets/og-fonts', f));

export default async function OG() {
  const [n500, n600, n700, mono] = await Promise.all([
    font('noto-sans-latin-500-normal.woff'), font('noto-sans-latin-600-normal.woff'),
    font('noto-sans-latin-700-normal.woff'), font('space-mono-latin-400-normal.woff'),
  ]);
  const lime = '#C6FF3D', muted = '#9AA3AE';
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: '72px 74px 62px', background: '#07080B', color: '#F4F6F8', fontFamily: 'Noto Sans', position: 'relative',
        backgroundImage: 'linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)', backgroundSize: '48px 48px' }}>
        <div style={{ position: 'absolute', top: -220, left: 300, width: 700, height: 500, borderRadius: 9999, background: 'radial-gradient(circle, rgba(198,255,61,.35), rgba(7,8,11,0) 70%)', display: 'flex' }} />
        <div style={{ position: 'absolute', bottom: -260, right: -120, width: 600, height: 500, borderRadius: 9999, background: 'radial-gradient(circle, rgba(167,139,250,.35), rgba(7,8,11,0) 70%)', display: 'flex' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <svg width="72" height="72" viewBox="0 0 32 32" fill="none" stroke={lime} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 9 L9 6.5 L2 10 L9 9.5 Z" /><path d="M16 9 L23 6.5 L30 10 L23 9.5 Z" /><path d="M16 6.5 V13.5 M14.6 13.5 L16 16 L17.4 13.5" /><circle cx="16" cy="5.2" r="1.1" />
            <path d="M8.5 21 L12 18.5 H20 L23.5 21 L20 23.5 H12 Z" /><path d="M7 24.5 Q16 30.5 25 24.5" /><path d="M9.5 27.5 Q16 31.5 22.5 27.5" />
          </svg>
          <div style={{ display: 'flex', fontSize: 46, fontWeight: 500, letterSpacing: 2 }}><span>CONDOR</span><span style={{ color: lime, marginLeft: 14 }}>NEST</span></div>
        </div>
        <div style={{ display: 'flex', marginTop: 56, fontFamily: 'Space Mono', fontSize: 24, letterSpacing: 4, color: lime }}>¿ORGANIZÁS UN HACKATHON?</div>
        <div style={{ display: 'flex', marginTop: 14, fontSize: 84, fontWeight: 600, lineHeight: 1.05, letterSpacing: -1 }}>
          <span style={{ color: lime }}>Publicá tu evento</span><span style={{ marginLeft: 22 }}>gratis</span>
        </div>
        <div style={{ display: 'flex', marginTop: 24, fontSize: 30, color: muted }}>Hackathons, bounties y grants abiertos a builders de LatAm</div>
        <div style={{ display: 'flex', marginTop: 'auto', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', background: lime, color: '#07080B', fontWeight: 700, fontSize: 28, padding: '16px 34px', borderRadius: 999 }}>Lo verificamos y lo listamos</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.4 }}>
            <div style={{ display: 'flex', fontSize: 26, color: '#D4D8DD' }}>condor-nest.lat/publicar</div>
            <div style={{ display: 'flex', fontSize: 22, color: muted }}>Hecho en Córdoba</div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Noto Sans', data: n500, weight: 500, style: 'normal' },
        { name: 'Noto Sans', data: n600, weight: 600, style: 'normal' },
        { name: 'Noto Sans', data: n700, weight: 700, style: 'normal' },
        { name: 'Space Mono', data: mono, weight: 400, style: 'normal' },
      ],
    },
  );
}
