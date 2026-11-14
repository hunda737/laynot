import type { Localized } from '@/i18n';
import type { Difficulty, Question } from './questions';

export interface StreetQuestion extends Question {
  /** Share of people on the street who picked each choice, same order as `choices`. Sums to 100. */
  streetPicks: [number, number, number, number];
  /** Where the question appears in the clip, for the "watch the clip" link. */
  clipAt: string;
}

export interface StreetEpisode {
  id: string;
  title: Localized;
  location: Localized;
  /** YYYY-MM-DD the video was posted. */
  posted: string;
  peopleAsked: number;
  duration: string;
  color: string;
  questions: StreetQuestion[];
}

type Pair = [en: string, am: string];
const L = ([en, am]: Pair): Localized => ({ en, am });

/** Street questions take their level from real answers: over 60% right is easy, under 30% is hard. */
export function levelFromStreet(pctRight: number): Difficulty {
  if (pctRight > 60) return 'easy';
  if (pctRight >= 30) return 'medium';
  return 'hard';
}

function sq(
  id: string,
  text: Pair,
  choices: [Pair, Pair, Pair, Pair],
  fact: Pair,
  streetPicks: [number, number, number, number],
  clipAt: string,
): StreetQuestion {
  return {
    id,
    category: 'general',
    difficulty: levelFromStreet(streetPicks[0]),
    text: L(text),
    choices: choices.map(L) as StreetQuestion['choices'],
    fact: L(fact),
    streetPicks,
    clipAt,
  };
}

// Demo episodes. The street percentages are invented for the demo.
export const STREET_EPISODES: StreetEpisode[] = [
  {
    id: 'piassa-history',
    title: { en: 'History quiz at Piassa', am: 'በፒያሳ የታሪክ ጥያቄዎች' },
    location: { en: 'Piassa, Addis Ababa', am: 'ፒያሳ፣ አዲስ አበባ' },
    posted: '2026-11-06',
    peopleAsked: 37,
    duration: '1:48',
    color: '#9A3412',
    questions: [
      sq('st-pia-01',
        ['Who was the emperor at the Battle of Adwa?', 'በዓድዋ ጦርነት ጊዜ ንጉሠ ነገሥቱ ማን ነበሩ?'],
        [['Menelik II', 'ዳግማዊ ምኒልክ'], ['Haile Selassie', 'ኃይለ ሥላሴ'], ['Tewodros II', 'ዳግማዊ ቴዎድሮስ'], ['Yohannes IV', 'አራተኛው ዮሐንስ']],
        ['Empress Taytu also played a key part in the campaign.', 'እቴጌ ጣይቱም በዘመቻው ትልቅ ሚና ተጫውተዋል።'],
        [58, 27, 9, 6], '0:12'),
      sq('st-pia-02',
        ['What year is it now in the Ethiopian calendar?', 'አሁን በኢትዮጵያ አቆጣጠር ስንተኛው ዓመት ነው?'],
        [['2019', '2019'], ['2018', '2018'], ['2026', '2026'], ['2020', '2020']],
        ['The Ethiopian calendar runs 7 to 8 years behind the Gregorian one.', 'የኢትዮጵያ አቆጣጠር ከፈረንጆቹ ከ7 እስከ 8 ዓመት ወደ ኋላ ነው።'],
        [71, 18, 4, 7], '0:35'),
      sq('st-pia-03',
        ['Which city was the royal capital for about 200 years from the 1630s?', 'ከ1630ዎቹ ጀምሮ ለ200 ዓመት ገደማ የነገሥታቱ መናገሻ የነበረችው ከተማ የትኛዋ ናት?'],
        [['Gondar', 'ጎንደር'], ['Axum', 'አክሱም'], ['Harar', 'ሐረር'], ['Lalibela', 'ላሊበላ']],
        ['Emperor Fasilides made it his capital around 1636.', 'አፄ ፋሲለደስ በ1636 ገደማ መናገሻቸው አደረጓት።'],
        [44, 31, 10, 15], '0:58'),
      sq('st-pia-04',
        ['Which ancient city in Tigray is famous for its tall stone stelae?', 'በትግራይ የምትገኘው በረጃጅም ሐውልቶቿ የምትታወቀው ጥንታዊት ከተማ የትኛዋ ናት?'],
        [['Axum', 'አክሱም'], ['Adwa', 'ዓድዋ'], ['Mekelle', 'መቐለ'], ['Yeha', 'የሐ']],
        ['Its tallest standing stele is about 24 metres high.', 'ከቆሙት ሐውልቶች ረጅሙ 24 ሜትር ገደማ ነው።'],
        [63, 12, 17, 8], '1:21'),
    ],
  },
  {
    id: 'bole-science',
    title: { en: 'Science on the street in Bole', am: 'በቦሌ የሳይንስ ጥያቄዎች' },
    location: { en: 'Bole, Addis Ababa', am: 'ቦሌ፣ አዲስ አበባ' },
    posted: '2026-11-09',
    peopleAsked: 42,
    duration: '2:05',
    color: '#1D4ED8',
    questions: [
      sq('st-bol-01',
        ['How many legs does a spider have?', 'ሸረሪት ስንት እግሮች አሏት?'],
        [['8', '8'], ['6', '6'], ['10', '10'], ['12', '12']],
        ['Insects have six. Spiders are arachnids, not insects.', 'ነፍሳት ስድስት እግር አላቸው። ሸረሪት ግን ከነፍሳት አትመደብም።'],
        [61, 33, 4, 2], '0:09'),
      sq('st-bol-02',
        ['What is H₂O better known as?', 'H₂O በተለምዶ ምን ተብሎ ይጠራል?'],
        [['Water', 'ውሃ'], ['Salt', 'ጨው'], ['Hydrogen', 'ሃይድሮጅን'], ['Oxygen', 'ኦክስጅን']],
        ['Two hydrogen atoms and one oxygen atom.', 'ሁለት የሃይድሮጅንና አንድ የኦክስጅን አቶም።'],
        [86, 2, 8, 4], '0:31'),
      sq('st-bol-03',
        ['Which planet is closest to the Sun?', 'ለፀሐይ በጣም ቅርብ የሆነችው ፕላኔት የትኛዋ ናት?'],
        [['Mercury', 'ሜርኩሪ'], ['Venus', 'ቬኑስ'], ['Mars', 'ማርስ'], ['Earth', 'ምድር']],
        ['A year on Mercury lasts only 88 Earth days.', 'የሜርኩሪ አንድ ዓመት 88 የምድር ቀናት ብቻ ነው።'],
        [39, 35, 21, 5], '1:02'),
      sq('st-bol-04',
        ['How many hearts does an octopus have?', 'ኦክቶፐስ ስንት ልቦች አሉት?'],
        [['3', '3'], ['1', '1'], ['2', '2'], ['8', '8']],
        ['Two pump blood to the gills and one to the rest of the body.', 'ሁለቱ ደም ወደ ስንጥቦቹ፣ አንዱ ደግሞ ወደ ቀሪው ሰውነት ይልካሉ።'],
        [14, 41, 17, 28], '1:40'),
    ],
  },
  {
    id: 'merkato-money',
    title: { en: 'Money talk at Merkato', am: 'በመርካቶ ስለ ገንዘብ' },
    location: { en: 'Merkato, Addis Ababa', am: 'መርካቶ፣ አዲስ አበባ' },
    posted: '2026-11-12',
    peopleAsked: 51,
    duration: '1:56',
    color: '#047857',
    questions: [
      sq('st-mer-01',
        ['How many santim make one Birr?', 'አንድ ብር ስንት ሳንቲም ነው?'],
        [['100', '100'], ['10', '10'], ['50', '50'], ['1000', '1000']],
        ['Santim coins come in 1, 5, 10, 25 and 50.', 'ሳንቲሞች በ1፣ 5፣ 10፣ 25 እና 50 ሳንቲም ይገኛሉ።'],
        [74, 15, 6, 5], '0:14'),
      sq('st-mer-02',
        ['Which company became the first private mobile operator in Ethiopia in 2022?', 'በ2022 እ.ኤ.አ. በኢትዮጵያ የመጀመሪያው የግል የሞባይል ኦፕሬተር የሆነው ኩባንያ የትኛው ነው?'],
        [['Safaricom', 'ሳፋሪኮም'], ['MTN', 'ኤምቲኤን'], ['Airtel', 'ኤርቴል'], ['Vodacom', 'ቮዳኮም']],
        ['Safaricom Ethiopia started commercial service in October 2022.', 'ሳፋሪኮም ኢትዮጵያ በኦክቶበር 2022 እ.ኤ.አ. አገልግሎት ጀመረ።'],
        [68, 14, 9, 9], '0:44'),
      sq('st-mer-03',
        ["In trade, what does 'wholesale' mean?", "በንግድ 'ጅምላ' ማለት ምን ማለት ነው?"],
        [['Selling in large amounts', 'በብዛት መሸጥ'], ['Selling online', 'በኢንተርኔት መሸጥ'], ['Selling at night', 'በምሽት መሸጥ'], ['Selling second-hand goods', 'ያገለገሉ ዕቃዎችን መሸጥ']],
        ['Retail is selling small amounts to the final customer.', 'ችርቻሮ ደግሞ ለመጨረሻ ተጠቃሚ በትንሽ መጠን መሸጥ ነው።'],
        [57, 9, 4, 30], '1:10'),
      sq('st-mer-04',
        ['What is telebirr used for?', 'ቴሌብር ለምን ይጠቅማል?'],
        [['Mobile money', 'የሞባይል ገንዘብ'], ['TV streaming', 'ቴሌቪዥን ለማየት'], ['Bus tickets only', 'የአውቶቡስ ትኬት ብቻ'], ['Food delivery', 'ምግብ ለማዘዝ']],
        ['Ethio telecom launched it in 2021.', 'ኢትዮ ቴሌኮም በ2021 እ.ኤ.አ. አስጀመረው።'],
        [88, 5, 3, 4], '1:33'),
    ],
  },
];

export const EPISODE_BY_ID: Record<string, StreetEpisode> = Object.fromEntries(STREET_EPISODES.map((e) => [e.id, e]));

export const STREET_QUESTIONS: StreetQuestion[] = STREET_EPISODES.flatMap((e) => e.questions);

/** Average number of correct answers among people asked on the street. */
export function streetAverage(episode: StreetEpisode): number {
  return episode.questions.reduce((sum, q) => sum + q.streetPicks[0] / 100, 0);
}
