import type { GarmentAnalysis, ItemInfo } from '../types';
import type { TrendHints } from './types';

export function analysisPrompt(info: ItemInfo) {
  return `You are a fashion merchandiser. Analyse the garment in the photo(s).
Only describe what is visible; if something (e.g. material) is uncertain, say "likely <x>".
${info.name ? `Seller's product name: "${info.name}".` : ''}
${info.notes ? `Seller notes (trusted facts): ${info.notes}` : ''}
Return ONLY JSON with this shape:
{"productName": string, "category": string, "colors": string[], "material": string, "style": string,
 "fit": string, "occasions": string[], "sellingPoints": string[3..5]}`;
}

export function scriptPrompt(analysis: GarmentAnalysis, info: ItemInfo, language: 'pl' | 'en', trends?: TrendHints) {
  const lang = language === 'pl' ? 'Polish (natural, colloquial, social-media Polish)' : 'English';
  const price = info.price !== undefined ? `${info.price} ${info.currency ?? ''}`.trim() : null;
  return `You write short-form video scripts for a fashion influencer (a female AI model) who talks
directly to HER followers while wearing the garment. Language: ${lang}.
Tone: enthusiastic, energetic, warm, persuasive and authentic — like a top fashion creator, not an ad.
Length: 20-30 seconds when spoken (about 55-80 words total across hook+compliments+tip+CTA).
Structure:
 1. hook: a scroll-stopping first line, max ~2 seconds (<= 8 words).
 2. compliments: 2-3 concrete compliments about how the piece looks and feels, based ONLY on the facts below.
 3. stylingTip: one practical styling tip.
 4. callToAction: an upbeat call to action to buy (e.g. "link below, grab it before it's gone!").
NEVER invent facts (brand, material, price, sizes, discounts) that are not in the facts below.
${price ? `Price you may mention: ${price}.` : 'Do not mention a price.'}
${trends?.hookStyles.length ? `Currently trending TikTok fashion hook formats (adapt the best-fitting ONE to this garment, do not copy verbatim, keep it true):
${trends.hookStyles.slice(0, 6).map((h) => `  - ${h}`).join('\n')}
` : ''}${trends?.hashtags.length ? `Trending hashtags you may include if relevant: ${trends.hashtags.slice(0, 10).join(' ')}
` : ''}Also write "caption" (1-2 sentences for TikTok/Instagram, may include 1-2 emoji) and 6-12 "hashtags" (with #).
Facts (JSON): ${JSON.stringify(analysis)}
Return ONLY JSON: {"hook": string, "compliments": string[], "stylingTip": string, "callToAction": string,
"caption": string, "hashtags": string[]}`;
}
