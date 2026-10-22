type MapLocation = { href: string; embedUrl: string | null };
const googleDomains = ['google.com', 'google.com.ar', 'google.com.mx', 'google.com.br', 'google.cl', 'google.com.co', 'google.es', 'google.com.pe', 'google.com.uy', 'google.com.ec', 'google.co.uk'];

/** Accept a venue address or a Google Maps link; never embed an arbitrary URL. */
export function mapLocation(value: string): MapLocation | null {
  const text = value.trim();
  if (!text || text.length > 2048) return null;
  const candidate = /^(?:maps\.app\.goo\.gl|goo\.gl\/maps|(?:www\.|maps\.)?google\.[a-z.]+\/maps)\//i.test(text) ? `https://${text}` : text;
  if (!/^[a-z][\w+.-]*:|^\/\//i.test(candidate)) {
    const query = encodeURIComponent(text);
    return { href: `https://www.google.com/maps/search/?api=1&query=${query}`, embedUrl: `https://www.google.com/maps?q=${query}&output=embed` };
  }
  try {
    const url = new URL(candidate);
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    if ((url.hostname === 'maps.app.goo.gl' && url.pathname.length > 1) || (url.hostname === 'goo.gl' && url.pathname.startsWith('/maps/'))) {
      // A short URL needs a redirect lookup to derive coordinates. Preserve the actual
      // Maps link instead of searching for the short URL as if it were an address.
      return { href: url.href, embedUrl: null };
    }
    const domain = url.hostname.replace(/^(?:www|maps)\./, '');
    if (!googleDomains.includes(domain) || (!url.pathname.startsWith('/maps') && !url.hostname.startsWith('maps.'))) return null;
    if (url.pathname.startsWith('/maps/embed')) return { href: url.href, embedUrl: `https://www.google.com${url.pathname}${url.search}` };
    const place = url.pathname.match(/\/place\/([^/]+)/)?.[1];
    const query = url.searchParams.get('query') || url.searchParams.get('q') || (place ? decodeURIComponent(place.replace(/\+/g, ' ')) : '');
    return { href: url.href, embedUrl: query ? `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed` : null };
  } catch { return null; }
}
