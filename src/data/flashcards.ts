import type { Localized } from '@/i18n';
import type { CategoryId, Difficulty } from './questions';

/** An open question: no choices. The player flips the card and marks themselves. */
export interface FlashCard {
  id: string;
  topic: CategoryId;
  difficulty: Difficulty;
  front: Localized;
  back: Localized;
  fact: Localized;
}

type Pair = [en: string, am: string];
const L = ([en, am]: Pair): Localized => ({ en, am });
const LEVEL = { e: 'easy', m: 'medium', h: 'hard' } as const;

function fc(id: string, topic: CategoryId, level: keyof typeof LEVEL, front: Pair, back: Pair, fact: Pair): FlashCard {
  return { id, topic, difficulty: LEVEL[level], front: L(front), back: L(back), fact: L(fact) };
}

// Written from general knowledge for the demo. Check before showing to a client.
export const FLASH_CARDS: FlashCard[] = [
  // Easy
  fc('fc-e01', 'ethiopia', 'e',
    ['What is the clay coffee pot used in the coffee ceremony called?', 'በቡና ሥነ ሥርዓት የሚውለው የሸክላ የቡና ማፍያ ማን ይባላል?'],
    ['Jebena', 'ጀበና'],
    ['Coffee is usually served in three rounds: abol, tona and bereka.', 'ቡና ብዙውን ጊዜ በሦስት ዙር ይቀርባል፤ አቦል፣ ቶናና በረካ።']),
  fc('fc-e02', 'geography', 'e',
    ['What is the capital of Egypt?', 'የግብፅ ዋና ከተማ ማን ናት?'],
    ['Cairo', 'ካይሮ'],
    ['It sits on the River Nile.', 'በዓባይ ወንዝ ዳርቻ ትገኛለች።']),
  fc('fc-e03', 'science', 'e',
    ['What is H₂O better known as?', 'H₂O በይበልጥ በምን ስም ይታወቃል?'],
    ['Water', 'ውሃ'],
    ['Two hydrogen atoms and one oxygen atom.', 'ሁለት የሃይድሮጅንና አንድ የኦክስጅን አቶሞች።']),
  fc('fc-e04', 'general', 'e',
    ['How many continents are there?', 'ስንት አህጉራት አሉ?'],
    ['Seven', 'ሰባት'],
    ['Africa is the second largest, after Asia.', 'አፍሪካ ከእስያ ቀጥሎ ሁለተኛዋ ትልቅ አህጉር ናት።']),
  fc('fc-e05', 'movies', 'e',
    ["Which toy cowboy is the hero of 'Toy Story'?", "የ'ቶይ ስቶሪ' ዋና ገፀ ባሕሪ የሆነው የአሻንጉሊት ካውቦይ ማን ነው?"],
    ['Woody', 'ውዲ'],
    ['Toy Story (1995) was the first feature film made fully with computer animation.', 'ቶይ ስቶሪ (1995) ሙሉ በሙሉ በኮምፒውተር የተሠራ የመጀመሪያው ሙሉ ርዝመት ፊልም ነው።']),
  fc('fc-e06', 'ethiopia', 'e',
    ["What is Ethiopia's national airline called?", 'የኢትዮጵያ ብሔራዊ አየር መንገድ ማን ይባላል?'],
    ['Ethiopian Airlines', 'የኢትዮጵያ አየር መንገድ'],
    ['It is one of the largest airlines in Africa.', 'ከአፍሪካ ትልልቅ አየር መንገዶች አንዱ ነው።']),
  fc('fc-e07', 'science', 'e',
    ['What is the closest star to the Earth?', 'ለምድር በጣም ቅርብ የሆነው ኮከብ የትኛው ነው?'],
    ['The Sun', 'ፀሐይ'],
    ['The next closest, Proxima Centauri, is about 4.2 light years away.', 'ቀጣዩ ቅርብ ኮከብ ፕሮክሲማ ሴንታውሪ 4.2 የብርሃን ዓመት ገደማ ይርቃል።']),
  fc('fc-e08', 'geography', 'e',
    ['Which ocean lies to the east of Africa?', 'ከአፍሪካ በስተ ምሥራቅ የሚገኘው ውቅያኖስ የትኛው ነው?'],
    ['The Indian Ocean', 'የሕንድ ውቅያኖስ'],
    ['The Atlantic Ocean lies to the west.', 'አትላንቲክ ውቅያኖስ በስተ ምዕራብ ይገኛል።']),
  fc('fc-e09', 'general', 'e',
    ['Which colour do you get by mixing blue and yellow?', 'ሰማያዊና ቢጫ ሲቀላቀሉ ምን ዓይነት ቀለም ይሰጣሉ?'],
    ['Green', 'አረንጓዴ'],
    ['Blue, yellow and red are the classic primary colours of paint.', 'ሰማያዊ፣ ቢጫና ቀይ የቀለም መሠረታዊ ቀለሞች ናቸው።']),
  fc('fc-e10', 'football', 'e',
    ['What is it called when one player scores three goals in a match?', 'አንድ ተጫዋች በአንድ ጨዋታ ሦስት ጎል ሲያስቆጥር ምን ይባላል?'],
    ['A hat-trick', 'ሃትሪክ'],
    ['The name comes from cricket, where a bowler won a hat for it.', 'ስሙ የመጣው ከክሪኬት ጨዋታ ነው።']),

  // Medium
  fc('fc-m01', 'ethiopia', 'm',
    ['Which holiday is celebrated with a large bonfire called Demera?', 'ደመራ በተባለ ትልቅ እሳት የሚከበረው በዓል የትኛው ነው?'],
    ['Meskel', 'መስቀል'],
    ['UNESCO added it to its list of intangible heritage in 2013.', 'ዩኔስኮ በ2013 እ.ኤ.አ. በማይዳሰስ ቅርስነት መዘገበው።']),
  fc('fc-m02', 'science', 'm',
    ['What is the hardest natural substance?', 'በተፈጥሮ ከሚገኙ ነገሮች ሁሉ ጠንካራው ምንድን ነው?'],
    ['Diamond', 'አልማዝ'],
    ['It is a form of pure carbon.', 'የንጹሕ ካርቦን አንዱ ዓይነት ነው።']),
  fc('fc-m03', 'geography', 'm',
    ['What is the capital of Nigeria?', 'የናይጄሪያ ዋና ከተማ ማን ናት?'],
    ['Abuja', 'አቡጃ'],
    ['It replaced Lagos as the capital in 1991.', 'በ1991 እ.ኤ.አ. ሌጎስን ተክታ ዋና ከተማ ሆነች።']),
  fc('fc-m04', 'movies', 'm',
    ['Which actor played Iron Man in the Marvel films?', 'በማርቭል ፊልሞች አይረን ማንን ሆኖ የተወነው ተዋናይ ማን ነው?'],
    ['Robert Downey Jr.', 'ሮበርት ዳውኒ ጁኒየር'],
    ['He first played the role in 2008.', 'ገፀ ባሕሪውን ለመጀመሪያ ጊዜ በ2008 እ.ኤ.አ. ተጫወተ።']),
  fc('fc-m05', 'general', 'm',
    ['What is the square root of 144?', 'የ144 ስኩዌር ሩት ስንት ነው?'],
    ['12', '12'],
    ['12 × 12 = 144, also called a gross.', '12 × 12 = 144።']),
  fc('fc-m06', 'ethiopia', 'm',
    ['In which national park can you see the walia ibex?', 'ዋልያ አይቤክስን በየትኛው ብሔራዊ ፓርክ ማየት ይቻላል?'],
    ['Simien Mountains National Park', 'የሰሜን ተራሮች ብሔራዊ ፓርክ'],
    ['The walia ibex lives nowhere else in the world.', 'ዋልያ በዓለም ላይ ሌላ ቦታ አይገኝም።']),
  fc('fc-m07', 'science', 'm',
    ['What is the largest planet in our solar system?', 'በሥርዓተ ፀሐያችን ትልቋ ፕላኔት የትኛዋ ናት?'],
    ['Jupiter', 'ጁፒተር'],
    ['More than 1,300 Earths could fit inside it.', 'ከ1,300 በላይ ምድሮች በውስጧ ሊገቡ ይችላሉ።']),
  fc('fc-m08', 'movies', 'm',
    ['Which series follows a group of kids in the town of Hawkins?', 'በሃውኪንስ ከተማ የሚኖሩ የልጆች ቡድንን የሚከተለው ተከታታይ የትኛው ነው?'],
    ['Stranger Things', 'ስትሬንጀር ቲንግስ'],
    ['It is set in the 1980s and first aired on Netflix in 2016.', 'ታሪኩ በ1980ዎቹ ይፈጸማል፤ በ2016 እ.ኤ.አ. በኔትፍሊክስ መታየት ጀመረ።']),
  fc('fc-m09', 'football', 'm',
    ['Which country has won the most World Cups?', 'ብዙ የዓለም ዋንጫ ያሸነፈው አገር የትኛው ነው?'],
    ['Brazil', 'ብራዚል'],
    ['Brazil has won it five times.', 'ብራዚል አምስት ጊዜ አሸንፋለች።']),
  fc('fc-m10', 'geography', 'm',
    ['What is the longest mountain range on land?', 'በየብስ ላይ ረጅሙ የተራራ ሰንሰለት የትኛው ነው?'],
    ['The Andes', 'አንዲስ'],
    ['It runs about 7,000 km along South America.', 'በደቡብ አሜሪካ 7,000 ኪሎ ሜትር ገደማ ይዘረጋል።']),

  // Hard
  fc('fc-h01', 'ethiopia', 'h',
    ['Which empress helped found Addis Ababa?', 'አዲስ አበባን በመመሥረት የተሳተፉት እቴጌ ማን ናቸው?'],
    ['Empress Taytu Betul', 'እቴጌ ጣይቱ ብጡል'],
    ['She is said to have chosen the site for its hot springs.', 'ቦታውን በፍልውሃው ምክንያት እንደመረጡት ይነገራል።']),
  fc('fc-h02', 'science', 'h',
    ['What is the chemical symbol for iron?', 'የብረት ኬሚካላዊ ምልክት ምንድን ነው?'],
    ['Fe', 'Fe'],
    ["It comes from the Latin word 'ferrum'.", "ከላቲኑ 'ferrum' ቃል የመጣ ነው።"]),
  fc('fc-h03', 'geography', 'h',
    ['What is the capital of Australia?', 'የአውስትራሊያ ዋና ከተማ ማን ናት?'],
    ['Canberra', 'ካንቤራ'],
    ['Many people guess Sydney.', 'ብዙ ሰዎች ሲድኒ ይመስላቸዋል።']),
  fc('fc-h04', 'movies', 'h',
    ['Which film won the very first Oscar for Best Picture?', 'የመጀመሪያውን የኦስካር ምርጥ ፊልም ሽልማት ያሸነፈው ፊልም የትኛው ነው?'],
    ['Wings', 'ዊንግስ'],
    ['It is a silent film about First World War pilots.', 'ስለ አንደኛው የዓለም ጦርነት አብራሪዎች የሚያወሳ ድምፅ አልባ ፊልም ነው።']),
  fc('fc-h05', 'general', 'h',
    ['How many sides does a dodecagon have?', 'ዶዴካጎን ስንት ጎኖች አሉት?'],
    ['12', '12'],
    ["'Dodeca' means twelve in Greek.", "'ዶዴካ' በግሪክኛ አሥራ ሁለት ማለት ነው።"]),
  fc('fc-h06', 'ethiopia', 'h',
    ['Which king gave his name to the town of the rock-hewn churches?', 'ከአለት ለተፈለፈሉት አብያተ ክርስቲያናት ከተማ ስሙን የሰጠው ንጉሥ ማን ነው?'],
    ['King Lalibela', 'ንጉሥ ላሊበላ'],
    ['He ruled in the Zagwe dynasty, around the late 1100s.', 'በዛጉዌ ሥርወ መንግሥት፣ በ1100ዎቹ መጨረሻ ገደማ ነገሠ።']),
  fc('fc-h07', 'science', 'h',
    ['What is the most common element in the universe?', 'በዩኒቨርስ ውስጥ በብዛት የሚገኘው ንጥረ ነገር ምንድን ነው?'],
    ['Hydrogen', 'ሃይድሮጅን'],
    ['It makes up about three quarters of normal matter.', 'ከተለመደው ቁስ ሦስት አራተኛ ያህሉን ይይዛል።']),
  fc('fc-h08', 'movies', 'h',
    ["Who directed 'Jurassic Park' (1993)?", "'ጁራሲክ ፓርክ' (1993) ፊልምን ያዘጋጀው ማን ነው?"],
    ['Steven Spielberg', 'ስቲቨን ስፒልበርግ'],
    ["He also directed 'Jaws' and 'E.T.'.", "'ጆውስ'ንና 'ኢ.ቲ.'ንም አዘጋጅቷል።"]),
  fc('fc-h09', 'football', 'h',
    ['Which club has won the most UEFA Champions League titles?', 'ብዙ የአውሮፓ ሻምፒዮንስ ሊግ ዋንጫ ያሸነፈው ክለብ የትኛው ነው?'],
    ['Real Madrid', 'ሪያል ማድሪድ'],
    ['It had won 15 by 2024, far more than any other club.', 'እስከ 2024 ድረስ 15 ጊዜ አሸንፏል፤ ከማንኛውም ክለብ በእጅጉ ይበልጣል።']),
  fc('fc-h10', 'geography', 'h',
    ['Which African country has three capital cities?', 'ሦስት ዋና ከተሞች ያሏት የአፍሪካ አገር የትኛዋ ናት?'],
    ['South Africa', 'ደቡብ አፍሪካ'],
    ['Pretoria, Cape Town and Bloemfontein.', 'ፕሪቶሪያ፣ ኬፕ ታውንና ብሉምፎንቴን።']),
];
