import { confirmLayout } from './confirm-layout';
// One-time reminder for signups whose 48 h confirmation link expired.
// Same light layout as the confirmation mail. No unsubscribe link in the body (the person is not subscribed);
// the sender still sets List-Unsubscribe headers. Never logs recipients or tokens.

/** Swap this single line if Ulises picks the alternative:
 *  'Y te enterás antes que nadie de los sorteos que estamos armando.' */
export const REMINDER_RAFFLE_LINE = 'Además, estamos armando sorteos para la comunidad, y te vamos a avisar por acá.';

export const REMINDER_SUBJECT = '¡Te falta un clic para entrar al nido!';
export const REMINDER_TITLE = REMINDER_SUBJECT; // subject and <h1> are the same line on purpose
export const REMINDER_BODY = 'Hace unos días te anotaste en Condor Nest, pero tu suscripción quedó sin confirmar. Si la activás, te llegan por mail los hackathons, bounties y grants abiertos a builders de LatAm, con cuánto pagan, cuándo cierran en tu hora y si podés participar desde tu país.';
export const REMINDER_BUTTON = 'Confirmar suscripción';
export const REMINDER_NOTE = 'El link vence en 48 horas. Si no querés recibir nada, ignorá este mail y no te vamos a volver a escribir.';
export const REMINDER_FOOTER = 'Hecho en Córdoba. Para builders de toda LatAm.';
const PREHEADER = 'Tu suscripción quedó sin confirmar. Un clic y listo.';

export function reminderEmail(confirmUrl: string, raffleLine: string = REMINDER_RAFFLE_LINE) {
  const u = new URL(confirmUrl);
  if (u.protocol !== 'https:' || u.pathname !== '/newsletter/confirmar') throw new Error('Invalid reminder URL');
  const html = confirmLayout({
    title: REMINDER_TITLE, preheader: PREHEADER, paragraphs: [REMINDER_BODY, raffleLine],
    button: REMINDER_BUTTON, url: confirmUrl, finePrint: [REMINDER_NOTE, REMINDER_FOOTER],
  });
  const text = `${REMINDER_TITLE}\n\n${REMINDER_BODY}\n\n${raffleLine}\n\n${REMINDER_BUTTON}: ${confirmUrl}\n\n${REMINDER_NOTE}\n\n${REMINDER_FOOTER}`;
  return { subject: REMINDER_SUBJECT, html, text };
}

/** Sender for the reminder always shows "Condor Nest", even if RESEND_FROM is a bare address or has another name. */
export function reminderFrom(from: string) {
  const m = from.match(/<([^<>\s]+@[^<>\s]+)>\s*$/);
  const addr = (m ? m[1] : from).trim();
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(addr)) throw new Error('Invalid RESEND_FROM');
  return `Condor Nest <${addr}>`;
}
