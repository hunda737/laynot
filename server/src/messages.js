// All the words the bot says, in English and Amharic. Edit here, nowhere else.
// Messages are sent as HTML: anything that came from a person must go through esc() first.

export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const LANGS = ['en', 'am'];

const T = {
  playButton: { en: '▶ Play', am: '▶ ተጫወት' },
  openButton: { en: '▶ Open Laynot', am: '▶ ላይኖትን ክፈት' },

  welcome: {
    en:
      'Welcome to Laynot! 🎯\n' +
      '10 quick questions a day, the same for everyone. Keep your streak, beat the street and climb the weekly board.\n\n' +
      'Tap <b>Play</b> to start.\n\n' +
      "🔔 I'll remind you once a day if you haven't played. /remind to change the time, /stop to turn it off.",
    am:
      'ወደ ላይኖት እንኳን በደህና መጡ! 🎯\n' +
      'በየቀኑ 10 ፈጣን ጥያቄዎች፣ ለሁሉም አንድ ዓይነት። ተከታታይ ቀናትዎን ይጠብቁ፣ የመንገድ ጥያቄዎችን ይፈትኑ፣ በሳምንታዊው ሰንጠረዥ ይወጡ።\n\n' +
      'ለመጀመር <b>ተጫወት</b> ይጫኑ።\n\n' +
      '🔔 ካልተጫወቱ በቀን አንድ ጊዜ አስታውስዎታለሁ። ሰዓቱን ለመቀየር /remind፣ ለማቆም /stop።',
  },

  help: {
    en:
      '<b>Laynot</b> is a daily street-quiz game.\n' +
      '• 10 questions every day, the same for everyone\n' +
      '• Keep your streak going\n' +
      '• Beat the Street: see how strangers answered\n' +
      '• Duel friends and climb the weekly board\n\n' +
      'Commands: /play · /quiz · /top · /remind · /language\n\n' +
      'Tap <b>Play</b> to open the game.',
    am:
      '<b>ላይኖት</b> የዕለታዊ የመንገድ ጥያቄ ጨዋታ ነው።\n' +
      '• በየቀኑ 10 ጥያቄዎች፣ ለሁሉም አንድ ዓይነት\n' +
      '• ተከታታይ ቀናትዎን ይጠብቁ\n' +
      '• Beat the Street፦ እንግዶች እንዴት እንደመለሱ ይመልከቱ\n' +
      '• ጓደኞችን ይፈትኑ፣ በሳምንታዊው ሰንጠረዥ ይወጡ\n\n' +
      'ትዕዛዞች፦ /play · /quiz · /top · /remind · /language\n\n' +
      'ጨዋታውን ለመክፈት <b>ተጫወት</b> ይጫኑ።',
  },

  // Shown on the empty chat before Start (512 characters at most).
  description: {
    en:
      'A daily quiz: 10 questions, a streak and a weekly leaderboard. Includes Beat the Street, the questions from our TikTok street interviews with the share of strangers who got each one right. Tap Start, then Play.',
    am: 'የዕለት ጥያቄ ጨዋታ፦ 10 ጥያቄዎች፣ ተከታታይ ቀናት እና ሳምንታዊ ደረጃ። ከቲክቶክ የመንገድ ቃለ መጠይቆቻችን የተወሰዱ «Beat the Street» ጥያቄዎችንም ያካትታል። «Start» ይጫኑ፣ ከዚያ «Play»።',
  },
  // Shown on the bot's profile (120 characters at most).
  shortDescription: {
    en: 'Daily street-quiz game: 10 questions a day.',
    am: 'የዕለታዊ የመንገድ ጥያቄ ጨዋታ፦ በቀን 10 ጥያቄዎች።',
  },

  // Reminders
  nudge: {
    en: "🎯 Today's Daily Challenge #{n} is ready: 10 questions, about 2 minutes. Keep your streak going!",
    am: '🎯 የዛሬው ዕለታዊ ፈተና #{n} ዝግጁ ነው፦ 10 ጥያቄዎች፣ ወደ 2 ደቂቃ። ተከታታይ ቀናትዎን ይቀጥሉ!',
  },
  streak: {
    en: "🔥 Your {streak}-day streak ends at midnight. Play today's 10 questions to keep it alive.",
    am: '🔥 የ{streak} ቀን ተከታታይዎ እኩለ ሌሊት ያበቃል። ለማቆየት የዛሬውን 10 ጥያቄ ይጫወቱ።',
  },
  comeback3: {
    en: 'We miss you! 👋 Daily Challenge #{n} is waiting, and it takes about 2 minutes.',
    am: 'ናፍቀውናል! 👋 ዕለታዊ ፈተና #{n} እየጠበቀዎት ነው፤ ወደ 2 ደቂቃ ብቻ ይወስዳል።',
  },
  comeback7: {
    en: "It's been a week. Come back for one round: Beat the Street shows how strangers did on the questions from our videos.",
    am: 'አንድ ሳምንት አልፏል። ለአንድ ዙር ይመለሱ፤ «Beat the Street» ከቪዲዮዎቻችን በተወሰዱ ጥያቄዎች እንግዶች እንዴት እንደመለሱ ያሳያል።',
  },

  // /remind
  remindOn: { en: '🔔 Reminders are <b>on</b>: once a day at {hour}:00, your local time, only if you have not played yet.', am: '🔔 ማስታወሻ <b>በርቷል</b>፦ ገና ካልተጫወቱ በቀን አንድ ጊዜ በ{hour}:00 (በአካባቢዎ ሰዓት)።' },
  remindOff: { en: '🔕 Reminders are <b>off</b>.', am: '🔕 ማስታወሻ <b>ጠፍቷል</b>።' },
  turnOn: { en: 'Turn on', am: 'አብራ' },
  turnOff: { en: 'Turn off', am: 'አጥፋ' },
  stopped: { en: 'Okay, reminders are off. Send /remind to turn them back on.', am: 'እሺ፣ ማስታወሻ ጠፍቷል። መልሶ ለማብራት /remind ይላኩ።' },

  // /language
  chooseLanguage: { en: 'Choose the language for my messages:', am: 'የመልዕክቶቼን ቋንቋ ይምረጡ፦' },
  languageSet: { en: 'Done. I will write in English.', am: 'ተሠርቷል። በአማርኛ እጽፋለሁ።' },

  // /quiz, /top
  quizFallback: { en: 'No quiz question right now. Tap Play for today\'s challenge.', am: 'አሁን የጥያቄ ምርጫ የለም። የዛሬውን ፈተና ለመጫወት «ተጫወት» ይጫኑ።' },
  quizNext: { en: 'Want 10 more? Tap Play.', am: 'ተጨማሪ 10 ይፈልጋሉ? «ተጫወት» ይጫኑ።' },
  topHeader: { en: "🏆 <b>This week's top players</b>", am: '🏆 <b>የዚህ ሳምንት ምርጥ ተጫዋቾች</b>' },
  topEmpty: { en: 'No scores yet this week. Be the first: tap Play.', am: 'በዚህ ሳምንት ገና ውጤት የለም። የመጀመሪያው ይሁኑ፦ «ተጫወት» ይጫኑ።' },
  topFooter: { en: 'Best 5 of 7 days counts.', am: 'ከ7 ቀናት ውስጥ ምርጥ 5ቱ ይቆጠራል።' },

  // Channel
  channelDaily: {
    en: '📅 <b>Daily Challenge #{n} is live!</b>\n10 questions, the same for everyone. Keep your streak going.',
    am: '📅 <b>ዕለታዊ ፈተና #{n} ተጀምሯል!</b>\n10 ጥያቄዎች፣ ለሁሉም አንድ ዓይነት። ተከታታይ ቀናትዎን ይቀጥሉ።',
  },
  channelWinners: { en: "🏆 <b>Last week's top players</b>", am: '🏆 <b>የባለፈው ሳምንት ምርጥ ተጫዋቾች</b>' },
};

export function t(lang, key, vars = {}) {
  const entry = T[key];
  if (!entry) throw new Error(`Unknown message: ${key}`);
  const template = entry[lang] ?? entry.en;
  return template.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match));
}

/** The channel speaks both languages, since its readers mix. */
export function both(key, vars) {
  return `${t('en', key, vars)}\n\n${t('am', key, vars)}`;
}

export const COMMANDS = [
  { command: 'start', en: 'Open Laynot', am: 'ላይኖትን ክፈት' },
  { command: 'play', en: "Play today's challenge", am: 'የዛሬውን ፈተና ተጫወት' },
  { command: 'quiz', en: 'A quick quiz question', am: 'አንድ ፈጣን ጥያቄ' },
  { command: 'top', en: "This week's top players", am: 'የሳምንቱ ምርጥ ተጫዋቾች' },
  { command: 'remind', en: 'Daily reminder settings', am: 'የዕለት ማስታወሻ' },
  { command: 'language', en: 'Language / ቋንቋ', am: 'ቋንቋ / Language' },
  { command: 'help', en: 'How it works', am: 'እንዴት እንደሚሰራ' },
];
