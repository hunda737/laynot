import type { ImageSourcePropType } from 'react-native';

import type { Localized } from '@/i18n';

/**
 * Guess the Player content. Every player has five text clues, from vague to obvious,
 * shown one per step next to the photo as it sharpens.
 *
 * Photos: put a square .jpg you have the rights to in `assets/players/`, named after the
 * player's id (e.g. `salah.jpg`), and add a line to `PHOTOS` below. Players without a photo
 * show a silhouette. See assets/players/README.md.
 *
 * The clues are written from general knowledge for the demo. Check every fact, and update
 * clubs each season, before a client sees them.
 */
export interface FootballPlayer {
  id: string;
  name: Localized;
  clues: [Localized, Localized, Localized, Localized, Localized];
  photo?: ImageSourcePropType;
}

// Add a line per photo, e.g.:
//   salah: require('../../../assets/players/salah.jpg'),
const PHOTOS: Record<string, ImageSourcePropType> = {};

type Pair = [en: string, am: string];
const L = ([en, am]: Pair): Localized => ({ en, am });
const p = (id: string, name: Pair, clues: [Pair, Pair, Pair, Pair, Pair]): FootballPlayer => ({
  id,
  name: L(name),
  clues: clues.map(L) as FootballPlayer['clues'],
  photo: PHOTOS[id],
});

// Ethiopian players first, then the African and European stars Ethiopian fans follow.
export const FOOTBALL_PLAYERS: FootballPlayer[] = [
  p('saladin', ['Saladin Said', 'ሳላዲን ሰዒድ'], [
    ['Plays as a striker.', 'የአጥቂ ቦታ ተጫዋች ነው።'],
    ['Born in Ethiopia in 1988.', 'በ1988 እ.ኤ.አ. በኢትዮጵያ ተወለደ።'],
    ['Played club football in Egypt and in Belgium.', 'በግብፅና በቤልጂየም ክለቦች ተጫውቷል።'],
    ['A Saint George striker for many seasons.', 'ለብዙ ዓመታት የቅዱስ ጊዮርጊስ አጥቂ ነበር።'],
    ['Led the Walia line at the 2013 Africa Cup of Nations.', 'በ2013 የአፍሪካ ዋንጫ የዋልያዎቹ የፊት መስመር መሪ ነበር።'],
  ]),
  p('mengistu', ['Mengistu Worku', 'መንግሥቱ ወርቁ'], [
    ['A forward from the 1950s and 1960s.', 'በ1950ዎቹና 1960ዎቹ የተጫወተ አጥቂ።'],
    ['Spent his playing career in Addis Ababa.', 'የተጫዋችነት ዘመኑን በአዲስ አበባ አሳልፏል።'],
    ['A Saint George legend.', 'የቅዱስ ጊዮርጊስ ታላቅ ተጫዋች።'],
    ['Later coached the national team.', 'በኋላ ብሔራዊ ቡድኑን አሰልጥኗል።'],
    ['Won the 1962 Africa Cup of Nations with Ethiopia.', 'በ1962 ከኢትዮጵያ ጋር የአፍሪካ ዋንጫን አሸንፏል።'],
  ]),
  p('getaneh', ['Getaneh Kebede', 'ጌታነህ ከበደ'], [
    ['Plays as a striker.', 'የአጥቂ ቦታ ተጫዋች ነው።'],
    ['Born in Ethiopia in the early 1990s.', 'በ1990ዎቹ መጀመሪያ በኢትዮጵያ ተወለደ።'],
    ['Played in the South African league.', 'በደቡብ አፍሪካ ሊግ ተጫውቷል።'],
    ['Was a top scorer in the Ethiopian Premier League.', 'የኢትዮጵያ ፕሪሚየር ሊግ ከፍተኛ ግብ አግቢ ነበር።'],
    ['A long-time Walia striker.', 'የዋልያዎቹ የረጅም ጊዜ አጥቂ።'],
  ]),
  p('salah', ['Mohamed Salah', 'መሐመድ ሳላህ'], [
    ['Plays in the English Premier League.', 'በእንግሊዝ ፕሪሚየር ሊግ ይጫወታል።'],
    ['Born in 1992.', 'በ1992 እ.ኤ.አ. ተወለደ።'],
    ['A left-footed right winger.', 'በግራ እግሩ የሚጫወት የቀኝ ክንፍ ተጫዋች።'],
    ['Played for Basel, Chelsea, Fiorentina and Roma.', 'ለባዝል፣ ለቼልሲ፣ ለፊዮረንቲና እና ለሮማ ተጫውቷል።'],
    ['Liverpool\'s Egyptian King.', 'የሊቨርፑሉ "የግብፅ ንጉሥ"።'],
  ]),
  p('mane', ['Sadio Mané', 'ሳዲዮ ማኔ'], [
    ['An African forward.', 'አፍሪካዊ አጥቂ።'],
    ['Born in 1992.', 'በ1992 እ.ኤ.አ. ተወለደ።'],
    ['Played for Salzburg, Southampton and Bayern Munich.', 'ለሳልዝበርግ፣ ለሳውዝሃምፕተን እና ለባየርን ሙኒክ ተጫውቷል።'],
    ['Won the Champions League with Liverpool in 2019.', 'በ2019 ከሊቨርፑል ጋር የሻምፒዮንስ ሊግን አሸንፏል።'],
    ['Scored the winning penalty as Senegal won the 2021 Africa Cup of Nations.', 'ሴኔጋል የ2021 የአፍሪካ ዋንጫን ስታሸንፍ የመጨረሻውን ፍፁም ቅጣት ምት አስቆጠረ።'],
  ]),
  p('drogba', ['Didier Drogba', 'ዲዲዬ ድሮግባ'], [
    ['A striker, now retired.', 'ጡረታ የወጣ አጥቂ።'],
    ['Born in 1978.', 'በ1978 እ.ኤ.አ. ተወለደ።'],
    ['Played for Marseille before moving to England.', 'ወደ እንግሊዝ ከመሄዱ በፊት ለማርሴይ ተጫውቷል።'],
    ['Scored the winning penalty in the 2012 Champions League final.', 'በ2012 የሻምፒዮንስ ሊግ ፍፃሜ የማሸነፊያውን ፍፁም ቅጣት ምት አስቆጠረ።'],
    ['Chelsea and Ivory Coast legend.', 'የቼልሲና የአይቮሪ ኮስት ታላቅ ተጫዋች።'],
  ]),
  p('etoo', ['Samuel Eto\'o', 'ሳሙኤል ኤቶ'], [
    ['A striker, now retired.', 'ጡረታ የወጣ አጥቂ።'],
    ['Born in 1981.', 'በ1981 እ.ኤ.አ. ተወለደ።'],
    ['Won the Champions League with two different clubs.', 'የሻምፒዮንስ ሊግን ከሁለት የተለያዩ ክለቦች ጋር አሸንፏል።'],
    ['Played for Barcelona and Inter Milan.', 'ለባርሴሎና እና ለኢንተር ሚላን ተጫውቷል።'],
    ['Cameroon\'s all-time top scorer.', 'የካሜሩን የምንጊዜም ከፍተኛ ግብ አግቢ።'],
  ]),
  p('osimhen', ['Victor Osimhen', 'ቪክቶር ኦሲምሄን'], [
    ['Plays as a striker.', 'የአጥቂ ቦታ ተጫዋች ነው።'],
    ['Born in 1998.', 'በ1998 እ.ኤ.አ. ተወለደ።'],
    ['Played for Wolfsburg and Lille.', 'ለቮልፍስበርግ እና ለሊል ተጫውቷል።'],
    ['Won the Italian league with Napoli in 2023.', 'በ2023 ከናፖሊ ጋር የጣሊያን ሊግን አሸንፏል።'],
    ['Nigeria\'s striker, known for his face mask.', 'በፊት ጭምብሉ የሚታወቀው የናይጄሪያ አጥቂ።'],
  ]),
  p('hakimi', ['Achraf Hakimi', 'አሽራፍ ሀኪሚ'], [
    ['Plays as a right-back.', 'የቀኝ ተከላካይ ነው።'],
    ['Born in Madrid in 1998.', 'በ1998 እ.ኤ.አ. በማድሪድ ተወለደ።'],
    ['Played for Real Madrid, Dortmund and Inter Milan.', 'ለሪያል ማድሪድ፣ ለዶርትሙንድ እና ለኢንተር ሚላን ተጫውቷል።'],
    ['Plays for Paris Saint-Germain.', 'ለፓሪስ ሴንት ዠርሜን ይጫወታል።'],
    ['Reached the 2022 World Cup semi-final with Morocco.', 'በ2022 የዓለም ዋንጫ ከሞሮኮ ጋር ግማሽ ፍፃሜ ደርሷል።'],
  ]),
  p('messi', ['Lionel Messi', 'ሊዮኔል ሜሲ'], [
    ['A forward.', 'አጥቂ ተጫዋች።'],
    ['Born in 1987.', 'በ1987 እ.ኤ.አ. ተወለደ።'],
    ['Has won the Ballon d\'Or a record eight times.', 'የባሎን ዶርን በክብረ ወሰን ስምንት ጊዜ አሸንፏል።'],
    ['Played for Barcelona, Paris Saint-Germain and Inter Miami.', 'ለባርሴሎና፣ ለፒኤስጂ እና ለኢንተር ማያሚ ተጫውቷል።'],
    ['Won the 2022 World Cup as Argentina\'s captain.', 'በ2022 የአርጀንቲና አምበል ሆኖ የዓለም ዋንጫን አሸነፈ።'],
  ]),
  p('ronaldo', ['Cristiano Ronaldo', 'ክርስቲያኖ ሮናልዶ'], [
    ['A forward.', 'አጥቂ ተጫዋች።'],
    ['Born in 1985.', 'በ1985 እ.ኤ.አ. ተወለደ።'],
    ['Started his career at Sporting Lisbon.', 'የእግር ኳስ ሕይወቱን በስፖርቲንግ ሊዝበን ጀመረ።'],
    ['Played for Manchester United, Real Madrid and Juventus.', 'ለማንቸስተር ዩናይትድ፣ ለሪያል ማድሪድ እና ለዩቬንቱስ ተጫውቷል።'],
    ['Won Euro 2016 with Portugal.', 'ዩሮ 2016ን ከፖርቱጋል ጋር አሸነፈ።'],
  ]),
  p('mbappe', ['Kylian Mbappé', 'ኪሊያን ምባፔ'], [
    ['A forward.', 'አጥቂ ተጫዋች።'],
    ['Born in 1998.', 'በ1998 እ.ኤ.አ. ተወለደ።'],
    ['Started his career at Monaco.', 'የእግር ኳስ ሕይወቱን በሞናኮ ጀመረ።'],
    ['Played for Paris Saint-Germain before joining Real Madrid.', 'ሪያል ማድሪድን ከመቀላቀሉ በፊት ለፒኤስጂ ተጫውቷል።'],
    ['Won the 2018 World Cup with France.', 'በ2018 ከፈረንሳይ ጋር የዓለም ዋንጫን አሸነፈ።'],
  ]),
  p('haaland', ['Erling Haaland', 'ኧርሊንግ ሃላንድ'], [
    ['Plays as a striker.', 'የአጥቂ ቦታ ተጫዋች ነው።'],
    ['Born in 2000.', 'በ2000 እ.ኤ.አ. ተወለደ።'],
    ['Played for Molde, Salzburg and Borussia Dortmund.', 'ለሞልዴ፣ ለሳልዝበርግ እና ለቦሩሲያ ዶርትሙንድ ተጫውቷል።'],
    ['Scored 36 goals in his first Premier League season.', 'በመጀመሪያው የፕሪሚየር ሊግ የውድድር ዘመኑ 36 ግቦችን አስቆጠረ።'],
    ['Manchester City\'s Norwegian striker.', 'የማንቸስተር ሲቲው ኖርዌያዊ አጥቂ።'],
  ]),
  p('saka', ['Bukayo Saka', 'ቡካዮ ሳካ'], [
    ['Plays in the English Premier League.', 'በእንግሊዝ ፕሪሚየር ሊግ ይጫወታል።'],
    ['Born in London in 2001.', 'በ2001 እ.ኤ.አ. በለንደን ተወለደ።'],
    ['Usually plays on the right wing.', 'አብዛኛውን ጊዜ በቀኝ ክንፍ ይጫወታል።'],
    ['Came through his club\'s Hale End academy.', 'ያደገው በክለቡ የሄል ኤንድ አካዳሚ ነው።'],
    ['Arsenal\'s number 7 and an England winger.', 'የአርሰናል 7 ቁጥርና የእንግሊዝ ክንፍ ተጫዋች።'],
  ]),
  p('vinicius', ['Vinícius Júnior', 'ቪኒሲየስ ጁኒየር'], [
    ['A left winger.', 'የግራ ክንፍ ተጫዋች።'],
    ['Born in 2000.', 'በ2000 እ.ኤ.አ. ተወለደ።'],
    ['Started his career at Flamengo.', 'የእግር ኳስ ሕይወቱን በፍላሜንጎ ጀመረ።'],
    ['Scored in the 2022 and 2024 Champions League finals.', 'በ2022 እና 2024 የሻምፒዮንስ ሊግ ፍፃሜዎች ግብ አስቆጥሯል።'],
    ['Real Madrid\'s Brazilian number 7.', 'የሪያል ማድሪዱ ብራዚላዊ 7 ቁጥር።'],
  ]),
];

/** Names that appear in the guess list but are never the answer, so the list cannot give it away. */
export const DECOY_NAMES: Localized[] = [
  ['Neymar', 'ኔይማር'],
  ['Harry Kane', 'ሃሪ ኬን'],
  ['Luka Modrić', 'ሉካ ሞድሪች'],
  ['Robert Lewandowski', 'ሮበርት ሌቫንዶቭስኪ'],
  ['Karim Benzema', 'ካሪም ቤንዜማ'],
  ['Riyad Mahrez', 'ሪያድ ማህሬዝ'],
  ['Pierre-Emerick Aubameyang', 'ፒየር ኤምሪክ ኦባሜያንግ'],
  ['Yaya Touré', 'ያያ ቱሬ'],
  ['Michael Essien', 'ማይክል ኤሲየን'],
  ['Jay-Jay Okocha', 'ጄይ ጄይ ኦኮቻ'],
  ['Thierry Henry', 'ቲየሪ ኦንሪ'],
  ['Zinedine Zidane', 'ዚነዲን ዚዳን'],
  ['Ronaldinho', 'ሮናልዲንሆ'],
  ['Kevin De Bruyne', 'ኬቨን ደ ብሩይን'],
  ['Jude Bellingham', 'ጁድ ቤሊንግሃም'],
  ['Adane Girma', 'አዳነ ግርማ'],
].map(([en, am]) => ({ en, am }));

/** Everything the guess box can suggest. */
export const ALL_NAMES: Localized[] = [...FOOTBALL_PLAYERS.map((x) => x.name), ...DECOY_NAMES];
