import type { Localized } from '@/i18n';
import type { GroupDef, GroupLevel, GroupPuzzle } from '@/lib/games/groups';

type Pair = [en: string, am: string];
const L = ([en, am]: Pair): Localized => ({ en, am });

/** One group: its theme, difficulty (0 easy … 3 hard) and four tiles. */
const g = (level: GroupLevel, theme: Pair, tiles: [Pair, Pair, Pair, Pair]): GroupDef<Localized> => ({
  theme: L(theme),
  level,
  tiles: tiles.map(L) as GroupDef<Localized>['tiles'],
});

/** A tile written the same way in both languages (Amharic-only words, numbers). */
const same = (text: string): Pair => [text, text];

// Written for the demo. An editor must check that no tile fits two groups by accident,
// and a native speaker must check the Amharic, before any puzzle is used for real.
export const GROUP_PUZZLES: GroupPuzzle<Localized>[] = [
  {
    id: 'g01',
    groups: [
      g(0, ['Served with injera', 'ከእንጀራ ጋር የሚቀርቡ'], [['Doro wat', 'ዶሮ ወጥ'], ['Kitfo', 'ክትፎ'], ['Shiro', 'ሽሮ'], ['Tibs', 'ጥብስ']]),
      g(1, ['Ethiopian months', 'የኢትዮጵያ ወራት'], [['Meskerem', 'መስከረም'], ['Tikimt', 'ጥቅምት'], ['Hidar', 'ኅዳር'], ['Tahsas', 'ታኅሣሥ']]),
      g(2, ['Ethiopian Premier League clubs', 'የኢትዮጵያ ፕሪሚየር ሊግ ክለቦች'], [['Saint George', 'ቅዱስ ጊዮርጊስ'], ['Ethiopia Bunna', 'ኢትዮጵያ ቡና'], ['Fasil Kenema', 'ፋሲል ከነማ'], ['Hawassa City', 'ሀዋሳ ከተማ']]),
      g(3, ['Days of the week in Amharic', 'የሳምንቱ ቀናት'], [same('እሁድ'), same('ሰኞ'), same('ማክሰኞ'), same('ረቡዕ')]),
    ],
  },
  {
    id: 'g02',
    groups: [
      g(0, ['Ethiopian lakes', 'የኢትዮጵያ ሐይቆች'], [['Tana', 'ጣና'], ['Abaya', 'አባያ'], ['Ziway', 'ዝዋይ'], ['Langano', 'ላንጋኖ']]),
      g(1, ['Ethiopian rivers', 'የኢትዮጵያ ወንዞች'], [['Abay', 'ዓባይ'], ['Awash', 'አዋሽ'], ['Omo', 'ኦሞ'], ['Tekeze', 'ተከዜ']]),
      g(2, ['Ethiopian mountains', 'የኢትዮጵያ ተራሮች'], [['Ras Dashen', 'ራስ ዳሽን'], ['Tullu Dimtu', 'ቱሉ ዲምቱ'], ['Entoto', 'እንጦጦ'], ['Zuqualla', 'ዝቋላ']]),
      g(3, ['Ethiopian distance runners', 'የኢትዮጵያ የረጅም ርቀት ሯጮች'], [['Haile Gebrselassie', 'ኃይሌ ገብረሥላሴ'], ['Tirunesh Dibaba', 'ጥሩነሽ ዲባባ'], ['Kenenisa Bekele', 'ቀነኒሳ በቀለ'], ['Derartu Tulu', 'ደራርቱ ቱሉ']]),
    ],
  },
  {
    id: 'g03',
    groups: [
      g(0, ['Coffee ceremony', 'የቡና ሥነ ሥርዓት'], [['Jebena', 'ጀበና'], ['Sini', 'ሲኒ'], ['Rekebot', 'ረከቦት'], ['Incense', 'ዕጣን']]),
      g(1, ['Traditional instruments', 'የባህል የሙዚቃ መሣሪያዎች'], [['Krar', 'ክራር'], ['Masinko', 'ማሲንቆ'], ['Kebero', 'ከበሮ'], ['Washint', 'ዋሽንት']]),
      g(2, ['Ethiopian holidays', 'የኢትዮጵያ በዓላት'], [['Meskel', 'መስቀል'], ['Timkat', 'ጥምቀት'], ['Enkutatash', 'እንቁጣጣሽ'], ['Genna', 'ገና']]),
      g(3, ['The ሀ family of fidel', 'የ"ሀ" ቤተሰብ ፊደላት'], [same('ሀ'), same('ሁ'), same('ሂ'), same('ሃ')]),
    ],
  },
  {
    id: 'g04',
    groups: [
      g(0, ['Countries bordering Ethiopia', 'ከኢትዮጵያ ጋር የሚዋሰኑ አገሮች'], [['Kenya', 'ኬንያ'], ['Sudan', 'ሱዳን'], ['Djibouti', 'ጅቡቲ'], ['Somalia', 'ሶማሊያ']]),
      g(1, ['African capital cities', 'የአፍሪካ ዋና ከተሞች'], [['Nairobi', 'ናይሮቢ'], ['Cairo', 'ካይሮ'], ['Accra', 'አክራ'], ['Dakar', 'ዳካር']]),
      g(2, ['UNESCO sites in Ethiopia', 'በኢትዮጵያ ያሉ የዩኔስኮ ቅርሶች'], [['Lalibela', 'ላሊበላ'], ['Aksum', 'አክሱም'], ['Fasil Ghebbi', 'ፋሲል ግቢ'], ['Tiya', 'ጢያ']]),
      g(3, ['Ethiopian national parks', 'የኢትዮጵያ ብሔራዊ ፓርኮች'], [['Nechisar', 'ነጭ ሳር'], ['Mago', 'ማጎ'], ['Gambella', 'ጋምቤላ'], ['Abijatta-Shalla', 'አብጃታ ሻላ']]),
    ],
  },
  {
    id: 'g05',
    groups: [
      g(0, ['Football positions', 'የእግር ኳስ ቦታዎች'], [['Striker', 'አጥቂ'], ['Goalkeeper', 'በረኛ'], ['Defender', 'ተከላካይ'], ['Midfielder', 'አማካይ']]),
      g(1, ['English Premier League clubs', 'የእንግሊዝ ፕሪሚየር ሊግ ክለቦች'], [['Arsenal', 'አርሰናል'], ['Chelsea', 'ቼልሲ'], ['Liverpool', 'ሊቨርፑል'], ['Everton', 'ኤቨርተን']]),
      g(2, ['Spanish clubs', 'የስፔን ክለቦች'], [['Barcelona', 'ባርሴሎና'], ['Sevilla', 'ሲቪያ'], ['Valencia', 'ቫሌንሲያ'], ['Real Betis', 'ሪያል ቤቲስ']]),
      g(3, ['Ethiopian Premier League clubs', 'የኢትዮጵያ ፕሪሚየር ሊግ ክለቦች'], [['Saint George', 'ቅዱስ ጊዮርጊስ'], ['Fasil Kenema', 'ፋሲል ከነማ'], ['Ethiopia Bunna', 'ኢትዮጵያ ቡና'], ['Wolaitta Dicha', 'ወላይታ ድቻ']]),
    ],
  },
  {
    id: 'g06',
    groups: [
      g(0, ['Breads', 'የዳቦ ዓይነቶች'], [['Injera', 'እንጀራ'], ['Dabo', 'ዳቦ'], ['Ambasha', 'አምባሻ'], ['Kita', 'ቂጣ']]),
      g(1, ['Grains', 'እህሎች'], [['Teff', 'ጤፍ'], ['Barley', 'ገብስ'], ['Sorghum', 'ማሽላ'], ['Wheat', 'ስንዴ']]),
      g(2, ['Spices', 'ቅመሞች'], [['Berbere', 'በርበሬ'], ['Mitmita', 'ሚጥሚጣ'], ['Korerima', 'ኮረሪማ'], ['Tena adam', 'ጤና አዳም']]),
      g(3, ['Drinks', 'መጠጦች'], [['Buna', 'ቡና'], ['Tej', 'ጠጅ'], ['Tella', 'ጠላ'], ['Shai', 'ሻይ']]),
    ],
  },
  {
    id: 'g07',
    groups: [
      g(0, ['Farm animals', 'የቤት እንስሳት'], [['Cow', 'ላም'], ['Goat', 'ፍየል'], ['Sheep', 'በግ'], ['Donkey', 'አህያ']]),
      g(1, ['Cats, big and small', 'የድመት ዘሮች'], [['Lion', 'አንበሳ'], ['Leopard', 'ነብር'], ['Cheetah', 'አቦሸማኔ'], ['House cat', 'ድመት']]),
      g(2, ['Birds', 'ወፎች'], [['Eagle', 'ንስር'], ['Ostrich', 'ሰጎን'], ['Pigeon', 'ርግብ'], ['Vulture', 'ጥንብ አንሳ']]),
      g(3, ['Found only in Ethiopia', 'በኢትዮጵያ ብቻ የሚገኙ'], [['Walia ibex', 'ዋልያ'], ['Gelada', 'ጭላዳ'], ['Ethiopian wolf', 'ቀይ ቀበሮ'], ['Mountain nyala', 'የደጋ አጋዘን']]),
    ],
  },
  {
    id: 'g08',
    groups: [
      g(0, ['Planets', 'ፕላኔቶች'], [['Mars', 'ማርስ'], ['Venus', 'ቬነስ'], ['Jupiter', 'ጁፒተር'], ['Saturn', 'ሳተርን']]),
      g(1, ['Colours of the Ethiopian flag', 'የኢትዮጵያ ሰንደቅ ዓላማ ቀለሞች'], [['Green', 'አረንጓዴ'], ['Yellow', 'ቢጫ'], ['Red', 'ቀይ'], ['Blue', 'ሰማያዊ']]),
      g(2, ['Organs of the body', 'የሰውነት ክፍሎች'], [['Heart', 'ልብ'], ['Brain', 'አንጎል'], ['Lung', 'ሳንባ'], ['Liver', 'ጉበት']]),
      g(3, ['Metals', 'ብረታ ብረቶች'], [['Gold', 'ወርቅ'], ['Silver', 'ብር'], ['Iron', 'ብረት'], ['Copper', 'መዳብ']]),
    ],
  },
  {
    id: 'g09',
    groups: [
      g(0, ['Ethiopian singers', 'የኢትዮጵያ ዘፋኞች'], [['Teddy Afro', 'ቴዲ አፍሮ'], ['Aster Aweke', 'አስቴር አወቀ'], ['Mahmoud Ahmed', 'ማሕሙድ አሕመድ'], ['Gigi', 'ጂጂ']]),
      g(1, ['Languages of Ethiopia', 'የኢትዮጵያ ቋንቋዎች'], [['Amharic', 'አማርኛ'], ['Afaan Oromo', 'ኦሮምኛ'], ['Tigrinya', 'ትግርኛ'], ['Somali', 'ሶማሊኛ']]),
      g(2, ['Ethiopian writers', 'የኢትዮጵያ ደራሲያን'], [['Haddis Alemayehu', 'ሀዲስ ዓለማየሁ'], ['Tsegaye Gebre-Medhin', 'ጸጋዬ ገብረ መድኅን'], ['Bealu Girma', 'በዓሉ ግርማ'], ['Kebede Michael', 'ከበደ ሚካኤል']]),
      g(3, ['Emperors of Ethiopia', 'የኢትዮጵያ ነገሥታት'], [['Menelik II', 'ዳግማዊ ምኒልክ'], ['Tewodros II', 'ዳግማዊ ቴዎድሮስ'], ['Yohannes IV', 'አፄ ዮሐንስ'], ['Haile Selassie', 'ኃይለ ሥላሴ']]),
    ],
  },
  {
    id: 'g10',
    groups: [
      g(0, ['Numbers', 'ቁጥሮች'], [['One', 'አንድ'], ['Two', 'ሁለት'], ['Three', 'ሦስት'], ['Four', 'አራት']]),
      g(1, ['Ethiopian months', 'የኢትዮጵያ ወራት'], [['Tir', 'ጥር'], ['Yekatit', 'የካቲት'], ['Megabit', 'መጋቢት'], ['Pagume', 'ጳጉሜ']]),
      g(2, ['Ethiopian seasons', 'የኢትዮጵያ ወቅቶች'], [['Kiremt', 'ክረምት'], ['Bega', 'በጋ'], ['Belg', 'በልግ'], ['Tseday', 'ጸደይ']]),
      g(3, ['More days in Amharic', 'ሌሎች የሳምንቱ ቀናት'], [same('ሐሙስ'), same('ዓርብ'), same('ቅዳሜ'), same('ሰኞ')]),
    ],
  },
];
