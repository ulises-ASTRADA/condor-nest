/** Remove decorative emoji from an accessible name while leaving the visual title intact. */
const DECORATIVE_EMOJI = /\p{Extended_Pictographic}|\p{Regional_Indicator}|\p{Emoji_Modifier}|\uFE0E|\uFE0F|\u200D|\u20E3/gu;

export function withoutDecorativeEmoji(text: string): string {
  return text.replace(DECORATIVE_EMOJI, '').replace(/[\s\u00a0]+/g, ' ').trim();
}
