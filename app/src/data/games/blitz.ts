import type { Localized } from '@/i18n';
import { hashString, seeded, shuffle } from '@/lib/rng';
import { QUESTIONS, type Question } from '../questions';

/**
 * One True or False statement. `prompt` is set for statements made from a quiz question:
 * the question is shown small, with the proposed answer as the statement.
 */
export interface Statement {
  id: string;
  prompt?: Localized;
  text: Localized;
  answer: boolean;
  why: Localized;
}

type Pair = [en: string, am: string];
const L = ([en, am]: Pair): Localized => ({ en, am });
const s = (id: string, text: Pair, answer: boolean, why: Pair): Statement => ({ id, text: L(text), answer, why: L(why) });

// Written for the demo from general knowledge, like the question bank. Check every fact before a client sees it.
// One fact per statement, no double negatives, and a false one is a believable variant of a true one.
export const HAND_STATEMENTS: Statement[] = [
  s('tf-01', ['The Ethiopian calendar has 13 months.', 'የኢትዮጵያ ዘመን አቆጣጠር 13 ወራት አሉት።'], true,
    ['Twelve months of 30 days, plus Pagume with 5 or 6 days.', '12 ወራት እያንዳንዳቸው 30 ቀናት፣ እና 5 ወይም 6 ቀናት ያሏት ጳጉሜ።']),
  s('tf-02', ['7:00 a.m. on a Western clock is 7:00 in Ethiopian time.', 'በምዕራባውያን ሰዓት ከጠዋቱ 1:00 (7:00 a.m.) በኢትዮጵያ ሰዓት 7:00 ነው።'], false,
    ['The Ethiopian day starts at 6:00 a.m., so 7:00 a.m. is 1:00.', 'የኢትዮጵያ ቀን የሚጀምረው ከጠዋቱ 12:00 (6:00 a.m.) ነው፤ ስለዚህ 7:00 a.m. 1:00 ሰዓት ነው።']),
  s('tf-03', ['Afaan Oromo is written with the Latin-based Qubee alphabet.', 'አፋን ኦሮሞ በላቲን ፊደል ላይ በተመሠረተው ቁቤ ይጻፋል።'], true,
    ['Qubee was formally adopted in 1991.', 'ቁቤ በ1991 እ.ኤ.አ. በይፋ ተቀባይነት አገኘ።']),
  s('tf-04', ['Saint George has won more league titles than any other Ethiopian club.', 'ቅዱስ ጊዮርጊስ ከማንኛውም የኢትዮጵያ ክለብ በላይ የሊግ ዋንጫዎችን አሸንፏል።'], true,
    ['Saint George has around 30 top-flight titles; no other club is close.', 'ቅዱስ ጊዮርጊስ ወደ 30 የሚጠጉ የሊግ ዋንጫዎች አሉት፤ የሚቀርበው ክለብ የለም።']),
  s('tf-05', ['The Battle of Adwa was fought in 1896.', 'የዓድዋ ጦርነት በ1896 እ.ኤ.አ. ተካሄደ።'], true,
    ['Ethiopia defeated Italy on 1 March 1896.', 'ኢትዮጵያ ጣሊያንን መጋቢት 1 ቀን 1896 እ.ኤ.አ. አሸነፈች።']),
  s('tf-06', ['Lake Tana is the source of the White Nile.', 'የጣና ሐይቅ የነጭ ዓባይ (White Nile) መነሻ ነው።'], false,
    ['Lake Tana is the source of the Blue Nile. The White Nile starts at Lake Victoria.', 'ጣና የጥቁር ዓባይ (Blue Nile) መነሻ ነው። ነጩ ዓባይ ከቪክቶሪያ ሐይቅ ይነሳል።']),
  s('tf-07', ['Enkutatash, the Ethiopian New Year, falls in September.', 'እንቁጣጣሽ (የኢትዮጵያ አዲስ ዓመት) በመስከረም (ሴፕቴምበር) ይውላል።'], true,
    ['It falls on 11 September, or 12 September before a Gregorian leap year.', 'ሴፕቴምበር 11 ላይ ይውላል፤ ከግሪጎሪያን የመዝለያ ዓመት በፊት ሴፕቴምበር 12።']),
  s('tf-08', ['Meskel celebrates the finding of the True Cross.', 'መስቀል የእውነተኛው መስቀል መገኘትን ያከብራል።'], true,
    ['A large bonfire, the Demera, is lit on the eve of Meskel.', 'በመስቀል ዋዜማ ትልቅ ደመራ ይለኮሳል።']),
  s('tf-09', ['Coffee is said to have been discovered in the Kaffa region.', 'ቡና በከፋ አካባቢ እንደተገኘ ይነገራል።'], true,
    ['The legend of the goat herder Kaldi is set in the Ethiopian highlands.', 'የፍየል እረኛው ካልዲ አፈ ታሪክ በኢትዮጵያ ደጋማ ቦታዎች ይከናወናል።']),
  s('tf-10', ['Ras Dashen is the highest mountain in Ethiopia.', 'ራስ ዳሽን የኢትዮጵያ ከፍተኛው ተራራ ነው።'], true,
    ['It rises to about 4,550 m in the Simien Mountains.', 'በሰሜን ተራሮች ውስጥ ወደ 4,550 ሜትር ከፍታ አለው።']),
  s('tf-11', ['Abebe Bikila won the 1960 Olympic marathon wearing running shoes.', 'አበበ ቢቂላ የ1960 የኦሊምፒክ ማራቶንን በጫማ ሮጦ አሸነፈ።'], false,
    ['He ran barefoot in Rome in 1960, and won again in Tokyo in 1964.', 'በ1960 በሮም በባዶ እግሩ ሮጦ አሸነፈ፤ በ1964 በቶኪዮ በድጋሚ አሸነፈ።']),
  s('tf-12', ['Ethiopia won the Africa Cup of Nations in 1962.', 'ኢትዮጵያ በ1962 የአፍሪካ ዋንጫን አሸነፈች።'], true,
    ['Ethiopia beat Egypt 4-2 in the final in Addis Ababa.', 'በአዲስ አበባ በተካሄደው ፍፃሜ ኢትዮጵያ ግብፅን 4 ለ 2 አሸነፈች።']),
  s('tf-13', ['Teff is the grain used to make injera.', 'ጤፍ እንጀራ የሚጋገርበት እህል ነው።'], true,
    ['Teff is a tiny grain grown mainly in Ethiopia and Eritrea.', 'ጤፍ በዋናነት በኢትዮጵያና በኤርትራ የሚመረት ትንሽ እህል ነው።']),
  s('tf-14', ['The Ethiopian national football team is nicknamed the Walia Ibex.', 'የኢትዮጵያ ብሔራዊ የእግር ኳስ ቡድን "ዋልያ" ተብሎ ይጠራል።'], true,
    ['The Walia ibex lives only in the Simien Mountains.', 'ዋልያ የሚኖረው በሰሜን ተራሮች ብቻ ነው።']),
  s('tf-15', ['Lalibela is famous for churches carved out of solid rock.', 'ላሊበላ ከአንድ ወጥ ድንጋይ በተፈለፈሉ አብያተ ክርስቲያናት ይታወቃል።'], true,
    ['Its eleven rock-hewn churches are a UNESCO World Heritage Site.', '11ዱ ውቅር አብያተ ክርስቲያናት በዩኔስኮ የዓለም ቅርስ ተመዝግበዋል።']),
  s('tf-16', ['Addis Ababa means "Big City" in Amharic.', 'አዲስ አበባ በአማርኛ "ትልቅ ከተማ" ማለት ነው።'], false,
    ['It means "New Flower".', 'ትርጉሙ "አዲስ አበባ" (New Flower) ነው፤ እቴጌ ጣይቱ ሰየሙት።']),
  s('tf-17', ['Haile Gebrselassie won two Olympic gold medals in the 10,000 m.', 'ኃይሌ ገብረሥላሴ በ10,000 ሜትር ሁለት የኦሊምፒክ የወርቅ ሜዳሊያዎችን አሸንፏል።'], true,
    ['He won in Atlanta 1996 and Sydney 2000.', 'በአትላንታ 1996 እና በሲድኒ 2000 አሸነፈ።']),
  s('tf-18', ['Ethiopia has a coastline on the Red Sea.', 'ኢትዮጵያ የቀይ ባሕር ጠረፍ አላት።'], false,
    ['Ethiopia is landlocked and uses the port of Djibouti for most trade.', 'ኢትዮጵያ የባሕር በር የላትም፤ ለአብዛኛው ንግድ የጅቡቲን ወደብ ትጠቀማለች።']),
  s('tf-19', ['Timkat celebrates the baptism of Jesus.', 'ጥምቀት የኢየሱስን መጠመቅ ያከብራል።'], true,
    ['It is held in January, and Gondar and Addis Ababa hold the largest processions.', 'በጥር ወር ይከበራል፤ ጎንደርና አዲስ አበባ ትላልቅ ሥነ ሥርዓቶች አሏቸው።']),
  s('tf-20', ['The Amharic script has 26 letters, like English.', 'የአማርኛ ፊደል እንደ እንግሊዝኛ 26 ፊደላት አሉት።'], false,
    ['Fidel has over 30 consonant families, each with 7 vowel forms.', 'ፊደል ከ30 በላይ የተነባቢ ቤተሰቦች አሉት፤ እያንዳንዳቸው 7 የአናባቢ ቅርጾች አሏቸው።']),
  s('tf-21', ['Pagume is the shortest month in the Ethiopian calendar.', 'ጳጉሜ በኢትዮጵያ ዘመን አቆጣጠር አጭሩ ወር ነው።'], true,
    ['It has 5 days, or 6 in a leap year.', '5 ቀናት አሏት፤ በዘመነ ሉቃስ 6።']),
  s('tf-22', ['The Danakil Depression is one of the hottest places on Earth.', 'የዳናኪል ዝቅተኛ ቦታ በምድር ላይ ካሉ በጣም ሞቃታማ ቦታዎች አንዱ ነው።'], true,
    ['Average yearly temperatures there are around 35 °C.', 'አማካይ ዓመታዊ የሙቀት መጠኑ ወደ 35 °ሴ ይደርሳል።']),
  s('tf-23', ['Ethiopia was never colonised.', 'ኢትዮጵያ በቅኝ አልተገዛችም።'], true,
    ['Italy occupied the country from 1936 to 1941, but it was never made a colony.', 'ጣሊያን ከ1936 እስከ 1941 ወራ ቆየች፤ ግን ቅኝ ግዛት አልሆነችም።']),
  s('tf-24', ['The Blue Nile Falls are called Tis Abay in Amharic.', 'የጥቁር ዓባይ ፏፏቴ በአማርኛ ጢስ ዓባይ ይባላል።'], true,
    ['Tis Abay means "smoking Nile", for the spray it throws up.', 'ጢስ ዓባይ ማለት የሚያጨስ ዓባይ ማለት ነው፤ በሚረጨው ጭጋግ ምክንያት።']),
  s('tf-25', ['Kitfo is usually served cooked well done.', 'ክትፎ አብዛኛውን ጊዜ በደንብ በስሎ ይቀርባል።'], false,
    ['Kitfo is minced beef usually served raw or lightly warmed (leb leb).', 'ክትፎ የተከተፈ የበሬ ሥጋ ሲሆን በጥሬው ወይም ለብ ለብ ተደርጎ ይቀርባል።']),
  s('tf-26', ['Tirunesh Dibaba is from the same family as Derartu Tulu.', 'ጥሩነሽ ዲባባ ከደራርቱ ቱሉ ጋር የአንድ ቤተሰብ አባል ናት።'], true,
    ['Derartu Tulu is Tirunesh Dibaba\'s cousin.', 'ደራርቱ ቱሉ የጥሩነሽ ዲባባ የአጎት ልጅ ናት።']),
  s('tf-27', ['Ethiopian Airlines was founded in the 1990s.', 'የኢትዮጵያ አየር መንገድ በ1990ዎቹ ተመሠረተ።'], false,
    ['It was founded in 1945 and is one of the oldest airlines in Africa.', 'በ1945 ተመሠረተ፤ በአፍሪካ ካሉ አንጋፋ አየር መንገዶች አንዱ ነው።']),
  s('tf-28', ['The African Union has its headquarters in Addis Ababa.', 'የአፍሪካ ኅብረት ዋና መሥሪያ ቤት አዲስ አበባ ነው።'], true,
    ['Addis Ababa also hosts the UN Economic Commission for Africa.', 'አዲስ አበባ የተመድ የአፍሪካ ኢኮኖሚክ ኮሚሽንንም ታስተናግዳለች።']),
  s('tf-29', ['Harar is surrounded by an old wall called the Jugol.', 'ሐረር ጀጎል በሚባል ጥንታዊ ግንብ ተከብባለች።'], true,
    ['Harar Jugol is a UNESCO World Heritage Site.', 'የሐረር ጀጎል በዩኔስኮ የዓለም ቅርስ ተመዝግቧል።']),
  s('tf-30', ['Gelada monkeys live mainly in the Ethiopian lowlands.', 'ጭላዳ ዝንጀሮዎች በዋናነት በኢትዮጵያ ቆላማ አካባቢዎች ይኖራሉ።'], false,
    ['Geladas live in the highlands, often above 2,000 m.', 'ጭላዳዎች በደጋማ ቦታዎች፣ ብዙ ጊዜ ከ2,000 ሜትር በላይ ይኖራሉ።']),
];

/** Quiz questions turned into statements: easy and medium only, so a statement can be read in a second or two. */
const SOURCE: Question[] = QUESTIONS.filter((q) => q.difficulty !== 'hard');

/** A question as a statement: its right answer (true) or one of its wrong answers (false). */
function fromQuestion(q: Question, truth: boolean): Statement {
  const wrong = 1 + (hashString(q.id) % 3);
  const choice = q.choices[truth ? 0 : wrong];
  const right = q.choices[0];
  return {
    id: `tf-${q.id}-${truth ? 't' : 'f'}`,
    prompt: q.text,
    text: choice,
    answer: truth,
    why: { en: `${right.en}. ${q.fact.en}`, am: `${right.am}። ${q.fact.am}` },
  };
}

/** How many hand-written statements go into each run. The rest come from the question bank. */
const HAND_PER_RUN = 6;

/**
 * A run of `count` statements, the same for the same key, about half true and half false.
 * The daily run uses `blitz:<day>`; practice uses a random key.
 */
export function blitzRun(key: string, count: number): Statement[] {
  const rand = seeded(key);
  const hand = shuffle(HAND_STATEMENTS, rand).slice(0, Math.min(HAND_PER_RUN, count));
  const trueLeft = Math.max(0, Math.round(count / 2) - hand.filter((x) => x.answer).length);
  const made = shuffle(SOURCE, rand)
    .slice(0, count - hand.length)
    .map((q, i) => fromQuestion(q, i < trueLeft));
  return shuffle([...hand, ...made], rand);
}
