// Visitor-country helpers (client-safe). No IPs are read, logged or stored: only the
// 2-letter country code Vercel puts in x-vercel-ip-country, or the browser timezone.
export const COUNTRY_ES: Record<string, string> = {
  AR: 'Argentina', BO: 'Bolivia', BR: 'Brasil', CL: 'Chile', CO: 'Colombia', CR: 'Costa Rica', CU: 'Cuba', DO: 'República Dominicana',
  EC: 'Ecuador', GT: 'Guatemala', HN: 'Honduras', MX: 'México', NI: 'Nicaragua', PA: 'Panamá', PE: 'Perú', PR: 'Puerto Rico',
  PY: 'Paraguay', SV: 'El Salvador', UY: 'Uruguay', VE: 'Venezuela',
};
export const isLatam = (c: string | null | undefined): c is string => !!c && c.toUpperCase() in COUNTRY_ES;
const TZ_COUNTRY: Record<string, string> = {
  'America/Mexico_City': 'MX', 'America/Monterrey': 'MX', 'America/Merida': 'MX', 'America/Cancun': 'MX', 'America/Chihuahua': 'MX', 'America/Hermosillo': 'MX', 'America/Mazatlan': 'MX', 'America/Tijuana': 'MX', 'America/Matamoros': 'MX', 'America/Bahia_Banderas': 'MX', 'America/Ciudad_Juarez': 'MX', 'America/Ojinaga': 'MX',
  'America/Sao_Paulo': 'BR', 'America/Fortaleza': 'BR', 'America/Recife': 'BR', 'America/Bahia': 'BR', 'America/Belem': 'BR', 'America/Manaus': 'BR', 'America/Cuiaba': 'BR', 'America/Campo_Grande': 'BR', 'America/Porto_Velho': 'BR', 'America/Boa_Vista': 'BR', 'America/Rio_Branco': 'BR', 'America/Maceio': 'BR', 'America/Araguaina': 'BR', 'America/Santarem': 'BR', 'America/Noronha': 'BR', 'America/Eirunepe': 'BR',
  'America/Santiago': 'CL', 'America/Punta_Arenas': 'CL', 'Pacific/Easter': 'CL', 'America/Bogota': 'CO', 'America/Lima': 'PE', 'America/Montevideo': 'UY',
  'America/Asuncion': 'PY', 'America/La_Paz': 'BO', 'America/Guayaquil': 'EC', 'Pacific/Galapagos': 'EC', 'America/Caracas': 'VE', 'America/Costa_Rica': 'CR',
  'America/Panama': 'PA', 'America/Guatemala': 'GT', 'America/Santo_Domingo': 'DO', 'America/El_Salvador': 'SV', 'America/Tegucigalpa': 'HN',
  'America/Managua': 'NI', 'America/Havana': 'CU', 'America/Puerto_Rico': 'PR',
};
export function countryFromTz(tz: string | undefined): string | null {
  if (!tz) return null;
  if (tz.startsWith('America/Argentina/') || tz === 'America/Buenos_Aires' || tz === 'America/Cordoba') return 'AR';
  return TZ_COUNTRY[tz] ?? null;
}
export const PAIS_KEY = 'cn-pais'; // localStorage: ISO code or 'todos' (explicit user choice)
