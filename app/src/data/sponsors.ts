import type { Localized } from '@/i18n';
import type { CategoryId, Question } from './questions';

// Invented brands for the demo. None of them refers to a real company.
export interface Sponsor {
  id: string;
  name: string;
  tagline: Localized;
  color: string;
  icon: 'cafe' | 'cart' | 'sunny';
}

export const SPONSORS: Sponsor[] = [
  {
    id: 'koket',
    name: 'Koket Biscuits',
    tagline: { en: 'The crunch for your coffee break.', am: 'ለቡና ሰዓትዎ የሚሆን ጣፋጭ ብስኩት።' },
    color: '#C2410C',
    icon: 'cafe',
  },
  {
    id: 'merkato-mart',
    name: 'Merkato Mart',
    tagline: { en: 'The whole market, delivered in an hour.', am: 'ገበያው በሙሉ በአንድ ሰዓት ቤትዎ ድረስ።' },
    color: '#0F766E',
    icon: 'cart',
  },
  {
    id: 'tsehay',
    name: 'Tsehay Solar',
    tagline: { en: 'Light at home, even when the grid is down.', am: 'መብራት ቢጠፋም ቤትዎ ብርሃን አይጠፋም።' },
    color: '#B45309',
    icon: 'sunny',
  },
];

export const SPONSOR_BY_ID: Record<string, Sponsor> = Object.fromEntries(SPONSORS.map((s) => [s.id, s]));

export interface SponsoredQuestion extends Question {
  sponsorId: string;
}

export const SPONSORED_QUESTIONS: SponsoredQuestion[] = [
  {
    id: 'sp-koket-01',
    sponsorId: 'koket',
    category: 'general',
    difficulty: 'easy',
    text: { en: 'Which grain is used most to bake everyday dabo bread?', am: 'የዕለት ተዕለት ዳቦ ለመጋገር በብዛት የሚውለው እህል የትኛው ነው?' },
    choices: [
      { en: 'Wheat', am: 'ስንዴ' },
      { en: 'Teff', am: 'ጤፍ' },
      { en: 'Rice', am: 'ሩዝ' },
      { en: 'Barley', am: 'ገብስ' },
    ],
    fact: { en: 'Teff goes into injera; dabo is usually made from wheat flour.', am: 'ጤፍ ለእንጀራ ይውላል፤ ዳቦ ግን አብዛኛውን ጊዜ ከስንዴ ዱቄት ይጋገራል።' },
  },
  {
    id: 'sp-merkato-01',
    sponsorId: 'merkato-mart',
    category: 'general',
    difficulty: 'easy',
    text: { en: "Addis Ababa's Merkato is known as one of Africa's largest what?", am: 'የአዲስ አበባው መርካቶ ከአፍሪካ ትልልቅ ምን ተብሎ ይታወቃል?' },
    choices: [
      { en: 'Open-air markets', am: 'ክፍት ገበያዎች' },
      { en: 'Football stadiums', am: 'ስታዲየሞች' },
      { en: 'Airports', am: 'አውሮፕላን ማረፊያዎች' },
      { en: 'Universities', am: 'ዩኒቨርሲቲዎች' },
    ],
    fact: { en: 'It covers several square kilometres and employs thousands of traders.', am: 'በበርካታ ካሬ ኪሎ ሜትሮች ላይ የተዘረጋ ሲሆን በሺዎች ለሚቆጠሩ ነጋዴዎች የሥራ ቦታ ነው።' },
  },
  {
    id: 'sp-tsehay-01',
    sponsorId: 'tsehay',
    category: 'general',
    difficulty: 'easy',
    text: { en: 'About how long does sunlight take to reach the Earth?', am: 'የፀሐይ ብርሃን ምድር ለመድረስ በግምት ምን ያህል ጊዜ ይወስድበታል?' },
    choices: [
      { en: '8 minutes', am: '8 ደቂቃ' },
      { en: '8 seconds', am: '8 ሰከንድ' },
      { en: '8 hours', am: '8 ሰዓት' },
      { en: '8 days', am: '8 ቀን' },
    ],
    fact: { en: 'Light covers the 150 million km in about 8 minutes 20 seconds.', am: 'ብርሃን 150 ሚሊዮን ኪሎ ሜትሩን በ8 ደቂቃ ከ20 ሰከንድ ገደማ ያቋርጣል።' },
  },
];

/** The three "presented by" pairs. One is live each month. */
const CATEGORY_SPONSORS: { category: CategoryId; sponsorId: string }[] = [
  { category: 'football', sponsorId: 'merkato-mart' },
  { category: 'science', sponsorId: 'tsehay' },
  { category: 'movies', sponsorId: 'koket' },
];

/** This month's sponsored category: "Football, presented by Merkato Mart". */
export function sponsoredCategory(day: string): { category: CategoryId; sponsor: Sponsor } {
  const [y, m] = day.split('-').map(Number);
  const pair = CATEGORY_SPONSORS[(y * 12 + (m - 1)) % CATEGORY_SPONSORS.length];
  return { category: pair.category, sponsor: SPONSOR_BY_ID[pair.sponsorId] };
}

/** The brand behind the once-a-day free life ("This refill is brought to you by..."). */
export function refillSponsor(): Sponsor {
  return SPONSOR_BY_ID.tsehay;
}
