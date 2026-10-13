import type { Listing } from './types';
export const ECOSYSTEMS = ['Solana', 'IA', 'Ethereum'] as const;
export type Eco = (typeof ECOSYSTEMS)[number];
// Keyword classification over real fields (source tags, title, organizer, summary). No manual guesses.
const RX: Record<Eco, RegExp> = {
  Solana: /\b(solana|superteam|colosseum|seeker|spl|anchor)\b/i,
  IA: /\b(ai|ia|agent(e|es|ic|s)?|llm|machine learning|inteligencia artificial|mcp|gpt|genai)\b/i,
  Ethereum: /\b(ethereum|eth|evm|solidity|celo|arbitrum|optimism|polygon|base chain|l2|onchain)\b/i,
};
export function ecosOf(l: Pick<Listing, 'ecosystems' | 'title' | 'organizer' | 'summaryEs'>): Eco[] {
  const hay = [...(l.ecosystems ?? []), l.title, l.organizer ?? '', ...(l.summaryEs ?? [])].join(' ');
  return ECOSYSTEMS.filter((e) => RX[e].test(hay) || (l.ecosystems ?? []).some((t) => t.toLowerCase() === e.toLowerCase() || (e === 'IA' && /^(ai|machine learning\/ai)$/i.test(t))));
}
