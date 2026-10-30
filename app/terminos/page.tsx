import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Términos',
  description: 'Condiciones de uso de Condor Nest.',
  alternates: { canonical: '/terminos' },
};

export default function TermsPage() {
  return <article className="mx-auto max-w-3xl py-10 text-[15px] leading-relaxed">
    <h1 className="font-display text-3xl font-semibold">Términos de uso</h1>
    <p className="mt-2 text-sm text-fg-muted">Última actualización: 30 de octubre de 2026</p>
    <p className="mt-6">Condor Nest reúne convocatorias para facilitar su descubrimiento. La información es orientativa: antes de participar, verificá fechas, requisitos, premios y condiciones en la fuente oficial.</p>
    <h2 className="mt-8 text-xl font-medium">Enlaces y convocatorias externas</h2>
    <p className="mt-3">No organizamos las convocatorias listadas ni controlamos sus sitios, decisiones o pagos. No garantizamos que una convocatoria permanezca abierta ni que sus condiciones no cambien. Algunos enlaces identificados como afiliados pueden generar una comisión para Condor Nest sin modificar el precio para vos.</p>
    <h2 className="mt-8 text-xl font-medium">Uso del sitio</h2>
    <p className="mt-3">No uses el sitio para actividades ilícitas, interferir con su funcionamiento ni enviar información engañosa. Podemos corregir, rechazar o retirar publicaciones para mantener el catálogo seguro y actualizado.</p>
    <h2 className="mt-8 text-xl font-medium">Contacto</h2>
    <p className="mt-3">Para consultas o correcciones escribinos a <a className="text-lime hover:underline" href="mailto:hola@condor-nest.lat">hola@condor-nest.lat</a>. El tratamiento de datos personales se explica en la <a className="text-lime hover:underline" href="/privacidad">política de privacidad</a>.</p>
  </article>;
}
