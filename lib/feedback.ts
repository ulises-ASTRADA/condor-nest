export const FEEDBACK_SOURCES = ['Google u otro buscador', 'LinkedIn', 'X / Twitter', 'Instagram', 'ChatGPT u otra IA', 'Me lo recomendó alguien', 'Una comunidad o un evento', 'Otro lugar'];
export const FEEDBACK_PURPOSES = ['Publicar o difundir un evento', 'Encontrar una oportunidad para participar', 'Entender qué es una hackatón', 'Explorar y ver qué hay'];
export const FEEDBACK_RATINGS = ['Muy difícil', 'Difícil', 'Neutral', 'Fácil', 'Muy fácil'];

export function feedbackAnswers(value: unknown) {
  if (!value || typeof value !== 'object') return null;
  const input = value as Record<string, unknown>;
  if (typeof input.source !== 'string' || !FEEDBACK_SOURCES.includes(input.source)
    || typeof input.purpose !== 'string' || !FEEDBACK_PURPOSES.includes(input.purpose)
    || typeof input.rating !== 'string' || !FEEDBACK_RATINGS.includes(input.rating)) return null;
  if (input.useful != null && typeof input.useful !== 'string') return null;
  if (input.improve != null && typeof input.improve !== 'string') return null;
  const useful = String(input.useful ?? '').trim();
  const improve = String(input.improve ?? '').trim();
  const sourceOther = typeof input.sourceOther === 'string' ? input.sourceOther.trim() : '';
  if (input.source === 'Otro lugar' && (!sourceOther || sourceOther.length > 200)) return null;
  if (useful.length > 1000 || improve.length > 1000) return null;
  return { source: input.source, source_other: input.source === 'Otro lugar' ? sourceOther : null, purpose: input.purpose, rating: FEEDBACK_RATINGS.indexOf(input.rating) + 1, useful: useful || null, improve: improve || null };
}

export type FeedbackStatus = { status: 'available' | 'completed' | 'invalid'; discount_code?: string };
