import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacidad',
  description: 'Cómo Condor Nest recopila, usa y protege los datos personales.',
  alternates: { canonical: '/privacidad' },
};

export default function PrivacyPage() {
  return <article className="mx-auto max-w-3xl py-10 text-[15px] leading-relaxed">
    <h1 className="font-display text-3xl font-semibold">Política de privacidad</h1>
    <p className="mt-2 text-sm text-fg-muted">Última actualización: 30 de octubre de 2026</p>
    <p className="mt-6">Condor Nest administra este sitio y es responsable del tratamiento de los datos que recibimos. Podés contactarnos en <a className="text-lime hover:underline" href="mailto:hola@condor-nest.lat">hola@condor-nest.lat</a>.</p>
    <h2 className="mt-8 text-xl font-medium">Qué datos usamos y para qué</h2>
    <ul className="mt-3 list-disc space-y-2 pl-5">
      <li>Tu email, si te suscribís al newsletter, para confirmar la suscripción, enviar novedades y gestionar la baja.</li>
      <li>Los datos de contacto y del evento que enviás mediante los formularios, para verificar, publicar o destacar la convocatoria y comunicarnos con vos.</li>
      <li>Datos técnicos y métricas agregadas de navegación para operar, proteger y mejorar el sitio. No vendemos datos personales.</li>
    </ul>
    <h2 className="mt-8 text-xl font-medium">Proveedores y conservación</h2>
    <p className="mt-3">Usamos proveedores de infraestructura, base de datos, seguridad, analítica y correo —incluidos Vercel, Supabase, Cloudflare y Resend— únicamente para prestar estos servicios. Conservamos los datos mientras sean necesarios para esa finalidad, hasta que solicites su eliminación o durante los plazos exigidos por ley.</p>
    <h2 className="mt-8 text-xl font-medium">Tus derechos</h2>
    <p className="mt-3">Podés pedir acceso, actualización, rectificación o supresión de tus datos escribiendo al email de contacto. Cada newsletter incluye una baja directa. En Argentina también podés acudir a la Agencia de Acceso a la Información Pública, autoridad de aplicación de la Ley 25.326.</p>
  </article>;
}
