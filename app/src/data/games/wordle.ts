/**
 * Word lists for the word game.
 *
 * English: 5-letter answers, plus a longer list of words accepted as guesses.
 * Amharic: 4-character answers with their meaning. The Amharic list is a machine-drafted
 * first pass for the demo and needs a native-speaker editor before launch (spelling
 * variants such as ሀ/ሐ/ኀ and ሰ/ሠ especially).
 */

export interface AmharicWord {
  word: string;
  /** English meaning, shown after the round. */
  meaning: string;
}

const words = (list: string) => list.trim().split(/\s+/).map((w) => w.toUpperCase());

export const EN_ANSWERS: string[] = words(`
  apple beach brain bread chair chess cloud coast crown dance dream eagle earth field flame
  fruit globe grass heart honey horse house juice lemon light lunch mango money music north
  ocean paper piano plant queen river robot score shirt smile spice stone storm sugar table
  teach tiger toast train voice water wheat world youth pitch match coach medal goals
  `);

/** Accepted guesses besides the answers. */
const EN_EXTRA: string[] = words(`
  crane slate stare raise adieu trace crate least roast react
  about above actor acute admit adopt adult after again agent agree ahead alarm album alert
  alike alive allow alone along alter among angel anger angle angry apart apply arena argue
  arise armed aside asset audio audit avoid award aware awful bacon badge badly baker basic
  basin basis batch beard beast began begin being below bench berry birth black blade blame
  blank blast blend bless blind block blood bloom blown board boost booth bound boxer brand
  brave brick bride brief bring broad broke brown brush build built bunch burst buyer cabin
  cable camel canal candy cargo carry catch cause chain chalk charm chart chase cheap check
  cheek cheer chest chief child chill china choir chose civil claim class clean clear clerk
  click cliff climb clock close cloth clown coral couch could count court cover craft crash
  crazy cream crime crisp cross crowd cruel crush curve cycle daily dairy daisy dealt death
  debut delay delta dense depth diary dirty disco ditch dizzy doing donor doubt dough dozen
  draft drain drama drank drawn dress dried drift drill drink drive drove dying eager early
  eaten eight elbow elder elect elite empty enemy enjoy enter entry equal error essay event
  every exact exist extra fable faint faith false fancy fault feast fence ferry fever fiber
  fifth fifty fight final first flash fleet flesh float flock flood floor flour fluid flute
  focus force forge forth forty forum found frame fresh front frost froze fully funny genre
  ghost giant given glass glove going grace grade grain grand grant grape graph great greed
  green greet grief grill grind groom gross group grown guard guess guest guide habit happy
  harsh haven heavy hedge hello hence hobby holly honor hotel hound human humor hurry ideal
  image imply index inner input issue ivory jelly jewel joint joker judge knife knock known
  label labor large laser later laugh layer learn lease least leave legal level lever limit
  linen liver local lodge logic loose lover lower loyal lucky lyric magic major maker maple
  march marry marsh maybe mayor meant meter metal might minor minus mixed model moist month
  moral motor mount mouse mouth movie muddy naval nerve never newly night ninja noble noise
  nurse nylon offer often olive onion opera orbit order organ other ought ounce outer owner
  paint panel panic party pasta patch pause peace peach pearl pedal penny phase phone photo
  piece pilot pinch pizza place plain plane plate plaza point polar porch pound power press
  price pride prime print prior prize proof proud prove pupil purse quick quiet quilt quite
  quota quote radio raise rally ranch range rapid ratio reach react ready realm rebel refer
  relax relay reply rider ridge rifle right rigid rival roast rocky roman rough round route
  royal rugby ruler rural salad salon sauce scale scare scarf scene scent scout screw sense
  serve seven shade shake shall shape share shark sharp sheep sheet shelf shell shift shine
  shock shoot shore short shout sight silly since sixth sixty skill skirt slate sleep slice
  slide slope small smart smell smoke snack snake solar solid solve sorry sound south space
  spare spark speak speed spend spent spill spine spoke spoon sport spray squad stack staff
  stage stair stake stand start state steam steel steep stick still stock stood store story
  stove strap straw strip stuck study stuff style sunny super sweet swept swift swing sword
  taste teeth thank theme there thick thief thing think third those three threw throw thumb
  tight timer tired title today token tooth topic total touch tough tower toxic trace track
  trade trail trait treat trend trial tribe trick tried troop truck truly trunk trust truth
  twice twist ultra uncle under union unity until upper upset urban usage usual valid value
  video virus visit vital vivid vocal waist waste watch wheel where which while white whole
  whose woman women worry worse worst worth would wound write wrong wrote yield young zebra
  `);

export const EN_GUESSES: Set<string> = new Set([...EN_ANSWERS, ...EN_EXTRA]);

export const AM_ANSWERS: AmharicWord[] = [
  { word: 'ቤተሰብ', meaning: 'family' },
  { word: 'መጽሐፍ', meaning: 'book' },
  { word: 'ሰላምታ', meaning: 'greeting' },
  { word: 'እንጀራ', meaning: 'injera' },
  { word: 'ጋዜጠኛ', meaning: 'journalist' },
  { word: 'መምህር', meaning: 'teacher' },
  { word: 'ወንድም', meaning: 'brother' },
  { word: 'መንገድ', meaning: 'road' },
  { word: 'በርበሬ', meaning: 'berbere (chilli spice)' },
  { word: 'ቲማቲም', meaning: 'tomato' },
  { word: 'ፍራፍሬ', meaning: 'fruit' },
  { word: 'አማርኛ', meaning: 'Amharic (the language)' },
  { word: 'ኦሮምኛ', meaning: 'Afaan Oromo (the language)' },
  { word: 'ትግርኛ', meaning: 'Tigrinya (the language)' },
  { word: 'ማክሰኞ', meaning: 'Tuesday' },
  { word: 'ጥቅምት', meaning: 'Tikimt, the second Ethiopian month' },
  { word: 'መጋቢት', meaning: 'Megabit, the seventh Ethiopian month' },
  { word: 'ሚያዝያ', meaning: 'Miyazya, the eighth Ethiopian month' },
  { word: 'ግንቦት', meaning: 'Ginbot, the ninth Ethiopian month' },
  { word: 'ጤንነት', meaning: 'health' },
  { word: 'እንግዳ', meaning: 'guest' },
  { word: 'ገንዘብ', meaning: 'money' },
  { word: 'መስኮት', meaning: 'window' },
  { word: 'ወንበር', meaning: 'chair' },
  { word: 'ጠረጴዛ', meaning: 'table' },
  { word: 'ብርጭቆ', meaning: 'drinking glass' },
  { word: 'ደብተር', meaning: 'exercise book' },
  { word: 'አንበሳ', meaning: 'lion' },
  { word: 'ዝንጀሮ', meaning: 'monkey' },
  { word: 'ቢራቢሮ', meaning: 'butterfly' },
  { word: 'ክረምት', meaning: 'Kiremt, the main rainy season' },
  { word: 'ሰንበት', meaning: 'Sabbath, day of rest' },
  { word: 'መስቀል', meaning: 'cross; also the Meskel holiday' },
  { word: 'ጥምቀት', meaning: 'Timkat, the Epiphany holiday' },
  { word: 'ማሲንቆ', meaning: 'masinko, a one-string fiddle' },
  { word: 'ዋሽንት', meaning: 'washint, a bamboo flute' },
  { word: 'ሙዚቀኛ', meaning: 'musician' },
  { word: 'ተጫዋች', meaning: 'player' },
  { word: 'አትሌት', meaning: 'athlete' },
  { word: 'ማራቶን', meaning: 'marathon' },
  { word: 'ሳይንስ', meaning: 'science' },
  { word: 'ፕላኔት', meaning: 'planet' },
  { word: 'ሐይቆች', meaning: 'lakes' },
  { word: 'ተራሮች', meaning: 'mountains' },
  { word: 'ወንዞች', meaning: 'rivers' },
  { word: 'ደስተኛ', meaning: 'happy' },
  { word: 'ሰማያዊ', meaning: 'blue' },
  { word: 'ሐምራዊ', meaning: 'purple' },
];
