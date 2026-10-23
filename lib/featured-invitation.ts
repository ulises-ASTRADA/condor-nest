import type { FeaturedEvent } from './featured-pricing';

export type FeaturedSubmission = {
  name: string; email: string; event_name: string; kind: string; location: string;
  dates: string; prize: string | null; url: string; notes: string | null;
};
export type FeaturedInvitation =
  | { status: 'available'; expires_at: string; submission: FeaturedSubmission }
  | { status: 'invalid' | 'expired' };

// Free text is preserved as reference, never guessed into dates or organization names.
export function featuredPrefill(submission: FeaturedSubmission): FeaturedEvent {
  const virtual = /^(online|virtual|remoto)$/i.test(submission.location.trim());
  return {
    title: submission.event_name, email: submission.email, organizer: '',
    prize: submission.prize ?? '', registrationUrl: submission.url,
    location: virtual ? '' : submission.location,
    ...(virtual ? { modality: 'virtual' as const } : {}),
  };
}

export function invitationExpiry(value: string) {
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date(value));
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
export function featuredInvitationNotice(invitation: { url: string; expiresAt: string }) {
  const expiry = invitationExpiry(invitation.expiresAt);
  return {
    text: `\n\nFormulario de Destacado precompletado para compartir con el organizador:\n${invitation.url}\nVence el ${expiry} (hora de Argentina), 5 días desde su creación. El enlace es privado.`,
    html: `<div style="margin-top:24px;border-top:1px solid #262a36;padding-top:20px"><p>Formulario precompletado para compartir con el organizador:</p><a href="${esc(invitation.url)}" style="color:#c6ff3d">Abrir formulario de Destacado</a><p style="font-size:13px;color:#9aa3b5">Vence el ${esc(expiry)} (hora de Argentina), 5 días desde su creación. El enlace es privado.</p></div>`,
  };
}
