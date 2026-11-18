# Games Section: How the Mini-Games Work (Ethiopia Edition)

Nov 18, 2026 · @Hunda

## Overview

**The Games section adds four short games to the quiz app, and all of them use the same lives, coins, streak and leaderboard as the main quiz.** A player has one wallet and one daily score, so playing any game moves them toward the same weekly prize board.

The four games:

1. **Wordle-style word game.** Guess a hidden word in a few tries, with colour feedback. In Amharic and English.
2. **Group the Four.** Sort 16 items into 4 hidden groups of 4.
3. **True or False Blitz.** Swipe through statements against a short clock.
4. **Guess the Player.** Name the footballer from a photo that gets clearer with every clue.

**Decisions (Nov 18, 2026):**

- **Languages:** Amharic and English only for now. Afaan Oromo and other languages come later.
- **No music:** the "Guess the Song" game is dropped. There is no audio anywhere in the Games section.
- **Football uses photos:** Guess the Player is built around player photos, with text clues alongside.
- **Demo first:** the demo has no backend for the games. All puzzles, words and photos are stored inside the app (see "Demo build" below).

This document covers the rules they share (next section), how each game works, and what to change for the Ethiopian market. Rules and numbers marked *proposal* are my starting values, to be tuned with player data. Facts about Ethiopia come from the sources listed at the end. This extends the main product plan, so the lives, coins, ad and prize rules described there still apply.

## Shared Rules: One Wallet, One Leaderboard

The Games section is a separate tab, but it does not have its own economy. Every game spends and earns the **same lives and coins** as the main quiz, and feeds the **same weekly leaderboard**. A player has one wallet and one streak, however they play.

&#91;embedded content: shared economy · 4 games, 1 wallet, 1 leaderboard\]

Each game talks to the wallet in both directions (it spends lives and coins and pays coins back), while its result goes one way, into daily points and the weekly leaderboard.

| Rule | How it works (all *proposal*) |
| --- | --- |
| Daily puzzle | Free for everyone, one attempt per game per day, the same puzzle for all players. It never costs a life. The word game has one daily word per language. |
| Practice puzzle | Costs 1 life to start. The life is returned if the player solves it (or hits the game's target score), so only failures cost lives. |
| Out of lives | The player can still play the daily puzzles. For practice, they wait for a refill or watch a rewarded ad. |
| Coins | Spent on hints inside a game (a letter reveal, a group's theme, +5 seconds, four choices). Earned by solving (15 for a daily, 10 for a practice win), by streaks and by the main quiz. |
| Rewarded ad | Gives +1 life or one extra try, at most once per round. It is always optional, and counts toward the app's daily ad limit. |
| Streak | One streak for the whole app: playing any daily puzzle keeps it alive. A missed day can be saved with coins. |
| Points | Each game converts its result to daily points, and the weekly leaderboard adds them to the main quiz's points, up to a daily cap. |
| Prizes | Entering the prize draw is free and shows no ads, so winning never depends on watching ads or spending coins. |

**Why share instead of separating.** One wallet means a coin earned in Wordle can be spent in the main quiz, which gives players a reason to try every section. It also keeps the economy simple to balance and explain, and the ad inventory stays in one place.

**Guard against abuse.** In production, the server must hold the wallet, the daily puzzle and the answers, and check every result. Otherwise a modified app could give itself coins, lives or a perfect score, and the prize leaderboard would lose its meaning. The demo skips this (see "Demo build").

**Keep the games from swallowing the quiz.** Games points count toward a day's leaderboard score only up to a cap, so the main quiz remains the core of the weekly ranking. The demo uses **400 points a day** (*proposal*); a full Daily Challenge scores up to about 1,500.

## Game 1: Wordle-style word game

**Everyone gets the same hidden word each day and has six guesses, with colour feedback on every guess. The Amharic version is built around fidel characters (syllables) instead of letters.**

How a round works:

1. The player picks a language: Amharic (4 characters) or English (5 letters). Each language has its own daily word.
2. They have six guesses. Each guess must be a real word from the game's word list.
3. After each guess, every tile is coloured: green (right character, right place), yellow (right character, wrong place), grey (not in the word). Amharic adds a fourth state, "half" (right consonant family in this place, wrong vowel). Each state also has its own symbol (✓ • ½ ×), so colour-blind players can read it.
4. Solving the word earns points and coins. If the player fails, the answer is shown with its meaning, and a rewarded ad can buy one extra guess.
5. A share card (emoji grid, puzzle number, tries used) goes to Telegram, WhatsApp or TikTok without revealing the word.

**What fidel changes.** Fidel is a syllable script: each character is a consonant plus a vowel. Sources count [about 33 to 34 consonant bases with 7 vowel forms each](https://wisc.pb.unizin.org/lctlresources/chapter/beginning-the-amharic-alphabet/), [roughly 238 characters plus about 49 labialized ones](https://apps.apple.com/tr/app/id1617682635). A copy of English Wordle does not work, so each point below is a design change.

| Issue | Why it matters | Proposed fix |
| --- | --- | --- |
| Word length | One character is a whole syllable, so 5-character words are long and uncommon. | Daily word has 4 characters. Easy practice could use 3 later. |
| Keyboard | About 240 characters cannot fit on a phone screen. One keyboard developer notes that [most designs fail by trying to fit the whole alphabet](https://www.github.com/utopiaio/eKeyboard) on screen. | A two-step picker: tap a consonant family, then pick one of its 7 vowel forms (plus its "wa" form, such as ኳ or ጓ). This follows how fidel is built. |
| Feedback | With about 240 options per tile, plain green/yellow/grey is too hard. | The "half" state tells players the consonant is right so they only need the vowel. |
| Word list | A good list is the hardest asset to get. | A native-speaker editor builds two lists: a short list of answers and a longer list of accepted guesses. An [open-source Amharic Wordle](https://awesome.ecosyste.ms/projects/github.com%2Fquantum9innovation%2Fwordle-am) (listed as MIT-licensed) may help as a starting point, but check its word quality. |
| Spelling variants | Several fidel families sound the same and are spelled differently in some words. | The editor picks one spelling per answer and accepts the common alternates as guesses. *Proposal; confirm with an editor.* |
| Competition | Amharic Wordle-style apps already exist, such as [Kal](https://apps.apple.com/us/app/-/id6757680335), which has unlimited play. | Differentiate with one shared daily puzzle, the leaderboard, the share card and your client's brand. |

**Lives, coins and points** (all *proposal*):

- **Daily puzzle:** free, one attempt per language, no lives needed, feeds the weekly leaderboard.
- **Practice puzzle:** stakes 1 life. Solving it returns the life and adds 10 coins. Failing it loses the life.
- **Hint:** 30 coins reveals one tile. The last unknown tile is never revealed.
- **Points:** 120 minus 20 for every guess after the first, so a first-try solve scores 120 and a sixth-try solve scores 20.

**Ethiopian touches.** After a solve, show the word's meaning and a related proverb, which makes the game feel like learning. Schedule themed words around Enkutatash, Meskel, Timkat and other holidays, and take some words from the client's TikTok videos.

## Game 2: Group the Four

**The player sees 16 tiles and sorts them into four hidden groups of four, with four mistakes allowed.** This is the Connections format: a [grid of 16 cards](https://www.engadget.com/gaming/best-online-games-puzzles-120059484.html), [four difficulty levels and a four-mistake limit](https://www.summerengine.com/zh/blog/games-like-wordle) that creates real tension.

How a round works:

1. The player taps four tiles they think belong together and presses Submit.
2. A correct set locks in, shows its theme, and takes a colour for its difficulty (yellow easiest, then green, blue, purple hardest).
3. A wrong set costs one mistake. If three of the four tiles were right, the game says "one away" (*proposal*). Trying the same four tiles again costs nothing.
4. After four mistakes the puzzle ends and the remaining groups are revealed with their themes.
5. The share card shows the coloured rows in the order the player solved them.

**Puzzle design rules** (*proposal*): every puzzle has one easy group, one wordplay or knowledge-heavy group, and at least one red herring, meaning a tile that seems to fit two groups. An editor must check that no tile fits two groups by accident, because an unfair puzzle is the fastest way to lose players.

Theme ideas built from Ethiopian material:

| Theme | Example tiles | Notes |
| --- | --- | --- |
| Served with injera | doro wat, kitfo, shiro, tibs | Easy group. |
| Months of the Ethiopian calendar | Meskerem, Tikimt, Hidar, Tahsas | The [calendar has 13 months](https://mail.ethioembassy.org.uk/about_us/calendar.htm), so a 13th-month trick is possible. |
| Premier League clubs | Saint George, Ethiopian Coffee, Defence Force, Ethiopian Insurance | Names from the [league's club list](https://www.wikiwand.com/en/articles/Ethiopian_Premier_League). Add a current-clubs check each season. |
| Days of the week in Amharic | እሁድ, ሰኞ, ማክሰኞ, ረቡዕ | The [Amharic names](https://addistools.pages.dev/resources/calendar-info) make a pure-script group. |
| Coffee ceremony | jebena, sini, rekebot, incense | Teaches while it plays. |

**Lives, coins and points** (all *proposal*):

- **Daily puzzle:** free, one attempt, feeds the weekly leaderboard.
- **Practice puzzle:** stakes 1 life. Solving it returns the life and adds 10 coins.
- **Hint:** 40 coins reveals the theme of one group, easiest first. Shuffling the tiles is always free.
- **Extra mistake:** a rewarded ad grants one extra mistake after the fourth one, once per round.
- **Points:** 100 minus 20 for each mistake used. A failed puzzle scores 0.

**Ethiopian touches.** Bundle an Ethiopic font in the app so every tile displays correctly on every phone, and keep tap targets large because fidel tiles are wide. Mix Amharic and English in the same puzzle where it helps. Keep clear of political, ethnic and religious-dispute topics, which could draw complaints. Take some groups straight from the client's street-interview topics.

## Game 3: True or False Blitz

**A timed run of short statements: swipe right for true, swipe left for false, and keep a combo going until the clock ends.** It is the cheapest game to build, because it uses the same question bank as the main quiz, and it records well for TikTok.

How a round works (all numbers *proposal*):

1. A run lasts 45 seconds. One statement shows at a time, ideally on a single line. True and False buttons sit under the card for players who would rather tap.
2. A right answer scores 10 points and grows the combo. Every 5 right answers in a row raises the multiplier, up to 3 times.
3. A wrong answer costs 3 seconds and resets the combo. Three wrong answers end the run.
4. At the end, each wrong answer comes with a one-line explanation. That teaches the player and shows the game is fair.
5. The share card shows the score and a row of right and wrong marks.

**Fair daily run.** The daily run uses the same fixed sequence of 20 statements for every player, half true and half false, which keeps the leaderboard fair. Practice runs draw randomly from a larger pool.

**Statement rules.** One fact per statement, no double negatives, and about half true and half false each day. A false statement should be a believable variant of a true one, never an absurd one. Every statement carries a source note and an explanation, and stays under about 12 words.

Sample statements for Ethiopia:

| Statement | Answer | Explanation |
| --- | --- | --- |
| The Ethiopian calendar has 13 months. | True | [Twelve months of 30 days, plus Pagume with five or six days](https://people.howstuffworks.com/culture-traditions/cultural-traditions/ethiopian-calendar.htm). |
| Afaan Oromo is written with the Latin-based Qubee alphabet. | True | [Qubee was formally adopted in 1991](https://wikiwand.com/en/Afaan_Oromo). |
| 7:00 a.m. on a Western clock is 7:00 in Ethiopian time. | False | The [Ethiopian day starts at 6:00 a.m., so 7:00 a.m. is 1:00](https://mail.ethioembassy.org.uk/about_us/calendar.htm). |
| Saint George has won more top-flight league titles than any other Ethiopian club. | True | The [league page counts about 30 or 31 titles](https://www.doc.surf/wiki/ethiopian-premier-league) for Saint George, including pre-Premier League titles; the next club has 11. The page is inconsistent on the exact total. |

**Lives, coins and points** (all *proposal*):

- **Daily run:** free, one attempt, feeds the weekly leaderboard. It counts as solved at 10 right answers.
- **Practice run:** stakes 1 life. Reaching 10 correct answers returns the life and adds 10 coins.
- **Power-ups:** 20 coins for +5 seconds, 15 coins to skip a statement.
- **Rewarded ad:** one "continue" after the third wrong answer, once per run.
- **Points:** 10 per correct answer times the combo multiplier.

**Weak connections.** Download each day's run in advance with its answers protected, play it offline, and let the server check the score and timing when the phone reconnects. Reject results with impossible timing.

**Ethiopian touches.** Keep Amharic statements short enough to fit one line in a large font, and follow the app's language setting. Cover history, geography, football, coffee and calendar topics. Add a "Street Stat" variant built on the client's videos: the statement is shown with the share of strangers who said true, and the player guesses whether the majority was right. Keep clear of disputed political history, and require a source for every statement.

## Game 4: Guess the Player

**A footballer's photo starts heavily blurred and zoomed in, and gets clearer with every clue. Each step also adds one text clue. The fewer steps a player needs, the more points they get.**

How a round works:

1. Step 1 shows the most blurred, most zoomed-in photo and the first text clue (the vaguest, such as the position or the league).
2. Each wrong guess, or each tap on "next clue", moves to the next step: the photo sharpens and one more text clue appears. There are 6 steps: five text clues (position, birth year, clubs, a career highlight, the national team) and finally the clear photo.
3. Answers are typed with autocomplete from a fixed list of names, in fidel or Latin letters, so spelling does not decide the result. The list includes names that are never the answer, so it cannot give the answer away. For coins, the player can switch to picking from 4 choices.
4. Points: 60 for a solve at step 1, then 50, 40, 30, 20, and 10 at step 6. No solve scores 0.

**Photos.** The game needs one photo per player, and each must be one you have the rights to use: licensed agency photos, photos supplied by clubs or the federation with their agreement, or the client's own photos from matches. Until a photo is added, the game shows a silhouette and plays on the text clues alone.

**Content to prepare.** One player per day, each with 1 photo and 5 text clues, which is 30 photos and 150 clues a month. Mix Ethiopian national team players, Ethiopian Premier League players, and international stars that Ethiopian fans follow, so everybody has something they can win.

**Lives, coins and points** (all *proposal*):

- **Daily puzzle:** free, one per day, scored on the weekly leaderboard.
- **Practice puzzle:** stakes 1 life, refunded on a solve, plus 10 coins.
- **Next clue:** free, but it lowers the points available.
- **Coins:** 25 to switch from typing to 4 choices.
- **Rewarded ad:** one extra guess after the last step, once per round.

**Weak connections.** Photos are the heaviest part of the section. Compress each to a small square image (around 600 × 600 px, under 100 KB), download tomorrow's photo over Wi-Fi in the background, and in data saver mode use a lower-resolution photo.

**Protect the answer.** In production, the server should send a separately blurred image for each step, so the clear photo never reaches the phone before the round ends. The demo blurs on the phone instead.

**Ethiopian touches.** Put Saint George, Fasil Kenema, Ethiopia Bunna and the national team "Walia Ibex" first, with the big European clubs second. Show names in both fidel and Latin letters.

## Adapting for the Ethiopian Market

The four games are global formats. What makes them work in Ethiopia is language, script, calendar, data cost and content rights. These are the changes to plan for, grouped by area.

### Language and script

| Area | The issue | What to do |
| --- | --- | --- |
| Amharic (fidel) | Fidel is an abugida: each character is a consonant plus a vowel, so there are about 238 base characters, plus extra labialized forms. A Wordle letter-by-letter check does not fit. | Use 4-character words, a two-step picker (consonant, then vowel), and a third "half" feedback state: right consonant, wrong vowel. |
| Launch languages | Every language multiplies the content and review work. | Launch with Amharic and English only. Add Afaan Oromo next, and others only when you can find a native reviewer. |
| Mixed language | Many Ethiopians switch between Amharic and English in a sentence. | Let True/False and Group the Four mix both languages, and follow the app's language setting in every game. |
| Keyboard | Phones have different fidel keyboards, and many people do not use one. | Ship your own in-game fidel keyboard, so nobody needs to install anything. |
| Fonts | Older Android versions may not render fidel correctly. | Bundle an Ethiopic font in the app, rather than depending on the phone. |

### Calendar and time

- **Daily reset.** Set the puzzle to change at midnight Ethiopian local time (EAT), not at the server's time zone.
- **Ethiopian clock.** The [Ethiopian day starts at 6:00 a.m.](https://mail.ethioembassy.org.uk/about_us/calendar.htm), so 7:00 a.m. is 1:00 in local usage. Show times in whichever format the player picks, and never mix them on one screen.
- **Ethiopian calendar.** The [calendar has 13 months](https://people.howstuffworks.com/culture-traditions/cultural-traditions/ethiopian-calendar.htm). Show streak days in the player's calendar if they choose it, and keep the internal date in one format to avoid bugs around the short thirteenth month, Pagume.
- **Holidays.** Run themed daily sets for Enkutatash, Meskel, Timkat and Genna, as well as Ramadan and Eid. Mark fasting seasons with non-food themes where it fits.

### Data, phones and payments

- **Low data.** Keep the app small, cache the daily puzzles, and show a "data saver" mode with lower-resolution player photos.
- **Low-end Android.** Test on cheap phones with 2 GB of RAM or less, and keep animations light.
- **Connectivity.** Games should start offline from the downloaded daily set and sync later. The server must validate scores, so offline play cannot be used to cheat.
- **Coin purchases.** Card payments are hard for most Ethiopian players, so plan for telebirr or other local mobile money for any coin pack, plus rewarded ads as the free route. The product plan covers the Google Play merchant issue.
- **Telegram.** Wordle and True/False are the easiest to run as a Telegram bot first, since they need only text.

### Content and culture

- **Topics that travel well:** football, coffee, food, geography, history before the modern era, proverbs, and the client's own street questions.
- **Topics to avoid:** current politics, ethnic comparisons, border and regional disputes, and anything religious that picks a side. Review every set with a native reviewer before release.
- **Respect for regions.** Spread names and places across regions so no group feels like an afterthought.
- **Rights.** Football photos need permission, as set out in Game 4. There is no music in the Games section, so no audio licences are needed.
- **Football.** The Premier League that matters locally is the Ethiopian one, but a large share of fans follow the English and Spanish leagues, so both belong in the pool.

### Fit with the TikTok audience

Each game should also make a clip. A Wordle reveal, a Group the Four solve, a True/False duel between two strangers and a "guess the player from a blurred photo" on the street all work as short videos. Put the daily puzzle number on every share card, so TikTok viewers see it and open the app.

## Demo build

The demo shows the four games working inside the app, without a backend for the games.

- **Content lives in the app.** Statements, word lists, group puzzles and player clues are bundled in the app's code (`app/src/data/games/`). The daily puzzle is picked on the phone from the date, so every phone gets the same one.
- **Photos are added by hand.** Player photos go in `app/assets/players/`, one file per player, and are switched on in `players.ts`. The folder's README explains how. Players without a photo show a silhouette.
- **No server checks.** Scores, coins and lives are kept on the phone (or in Telegram's cloud storage inside the Mini App). That is fine for a demo, but not for real prizes.
- **Games points stay on the phone.** They show on the in-app leaderboard, Home and the streak strip, but the Telegram bot's `/top` and winners post still use only the Daily Challenge score.
- **Amharic guesses are not checked against a word list yet.** The Amharic list is short, so any four characters are accepted as a guess. English guesses must be in the word list.
- **Machine-drafted text.** The Amharic text and every fact in the demo content were drafted for the demo and need a native-speaker and fact check before a client sees them.

## Build Order and Content Workload

### What to build first

| Order | Game | Why this position | Main work |
| --- | --- | --- | --- |
| 1 | True or False Blitz | Reuses the main quiz's question bank and needs the least new interface. It also proves the shared wallet (lives, coins, points) with the smallest game. | Swipe screen, timer, combo, explanation card |
| 2 | Wordle (English first) | Simple rules and the best-known share card. Doing English first lets you test the daily-puzzle and streak systems before the harder script work. | Tile grid, own keyboard, word lists, share card |
| 3 | Group the Four | Needs a content writer more than a programmer. It is a good second daily habit. | Tile board, mistake counter, set editor |
| 4 | Guess the Player | Popular with football fans. The interface is simple; the work is in sourcing photos with the right permissions. | Photo stepper (blur and zoom), clue ladder, autocomplete list, photo sourcing |
| 5 | Amharic Wordle | The hardest interface work, so it comes after the shared systems are stable. | Fidel picker, "half" feedback state, Amharic word lists |

Ship the section in two steps: games 1 and 2 first, then the rest. Launching all four at once spreads the content team too thin. (The demo already includes all four, so the client can see the whole section.)

### Monthly content workload

This counts one language and one puzzle per day (all numbers are the *proposal* from each game section).

| Game | Items per day | Items per 30 days |
| --- | --- | --- |
| Wordle | 1 word | 30 |
| Group the Four | 16 tiles (4 groups of 4) | 480 |
| True or False Blitz | 20 statements | 600 |
| Guess the Player | 1 photo + 5 clues | 180 |
| **Total** | **43** | **1,290** |

Launching in both Amharic and English roughly doubles the text items, to about 2,500 a month. The player photos are shared by both languages, so they do not double. Adding a third language later adds another 1,260 or so, so the language list is a staffing decision as much as a product one.

### Ways to keep the workload manageable

- **Build an admin screen first.** Writers enter items in a simple form with a date, a language and a status (draft, reviewed, scheduled), so nobody edits a database by hand.
- **Keep a two-week buffer.** Content should be scheduled at least 14 days ahead, so a sick writer never leaves a gap.
- **Reuse the question bank.** Turn existing multiple-choice questions into true/false statements by pairing each with its right or a wrong answer. The demo already does this, and it can cover a large part of the 600 a month.
- **Use the client's videos.** Every street interview is a source of statements, "street stat" items and Group the Four themes.
- **Use AI only for drafts.** Let a model draft statements and clue ladders, but have a native speaker check every item for facts, spelling and tone, especially in Amharic.
- **Recycle after a gap.** Past puzzles can return in practice mode, so older content keeps its value, while the daily puzzle always stays new.
- **Watch the numbers.** Track completion rate, average clues used, and which items most players get wrong, then fix or retire the ones that confuse people.

## Open Questions

- [x] **Launch languages.** Decided: Amharic and English only for now.
- [x] **Music rights.** Decided: no music. Guess the Song is dropped.
- [x] **Football content.** Decided: Guess the Player uses photos, with text clues alongside.
- [ ] **Photo source.** Who supplies licensed player photos: a photo agency, the clubs, the federation, or the client's own match photos?
- [ ] **Content team.** Who writes and reviews the daily puzzles, and is there a native Amharic reviewer and an English editor?
- [ ] **Coin packs.** Will coins be sold at launch (which needs telebirr or another local payment route), or earned only through play and ads at first?
- [ ] **Daily points cap.** The demo counts up to 400 games points a day toward the leaderboard. Is that the right weight next to the main quiz?
- [ ] **Telegram.** Do you want a Telegram bot version of Wordle and True/False as a way to bring people in before the Android app is out?

## Sources

- [Ethiopian calendar (HowStuffWorks)](https://people.howstuffworks.com/culture-traditions/cultural-traditions/ethiopian-calendar.htm): 13 months, Pagume.
- [Ethiopian Embassy, London: calendar and clock](https://mail.ethioembassy.org.uk/about_us/calendar.htm): the 6:00 a.m. start of the Ethiopian day.
- [Afaan Oromo (Wikiwand)](https://wikiwand.com/en/Afaan_Oromo): Qubee Latin alphabet (used in a True/False sample statement).
- [Ethiopian Premier League (doc.surf)](https://www.doc.surf/wiki/ethiopian-premier-league): clubs and title counts.
- Product plan for the quiz app, the first document: platform order, Google Play merchant limits, telebirr and the shared lives and coins rules.

The point values, timers, coin prices and counts in this document are proposals to tune in testing, not figures from any source.
