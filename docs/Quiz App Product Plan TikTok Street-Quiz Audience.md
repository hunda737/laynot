# Quiz App Product Plan: TikTok Street-Quiz Audience

Nov 14, 2026 · @Hunda

## Summary

**Build a daily-habit quiz game with the TikTok street interviews as its hook, and keep ads and prizes as add-ons rather than the gate to playing.** Your core idea (multiple-choice questions, a leaderboard, weekly top-3 prizes, your own ad service) fits what has worked in this category. The part to change is the credit wall: a hard stop when credits run out is the most common complaint against comparable apps.

What the research shows:

- Apps that block play when a resource runs out collect bad reviews. Trivia Crack users complain about too many ads and short lives, and Duolingo's move from hearts to energy drew the same complaints.
- Apps that relied on big cash prizes and live virality, like HQ Trivia, lost players once the novelty faded and shut down in 2020.
- Apps with no hard gate, like Wordle (one puzzle a day, a spoiler-free share card, no signup), spread through group chats.

What I recommend (items marked *proposal* are my own ideas, not copied from a competitor):

1. A free **Daily Challenge** for everyone: the same 10 questions, a streak counter, and it counts for the prize leaderboard. No credits needed.
2. **Lives instead of credits** for extra practice. Lives refill over time, a rewarded ad gives +1 life at the moment of failure, and the player is never at a dead end.
3. A **"Beat the Street"** category built from the client's TikTok questions, showing the real share of strangers who got each one right. No generic trivia app has this. *Proposal.*
4. Sell advertisers **sponsored questions, categories and prizes** first, and use an ad network for rewarded video as filler. Build the self-serve ad platform later.
5. Make prizes **sponsor-funded, skill-based and free to enter**, and get a legal check for the target country before launch.
6. Add **friend duels and live rooms** in phase 2, once the daily habit works.

## What similar apps teach

**The quiz apps that lasted paired a daily habit with social play; the ones that died chased cash prizes or virality with no retention loop or revenue plan.** Six apps cover the useful lessons.

| App | What worked | What went wrong | Takeaway for you |
| --- | --- | --- | --- |
| [Trivia Crack](https://thinkwithgoogle.com/marketing-strategies/app-and-mobile/trivia-crack-wins-globally-by-staying-local) | Turn-based duels with friends. Ads paid for its growth: a Google case study says ads were [50% of revenue](https://admob.google.co.in/home/resources/admob-helps-trivia-crack-go-global-and-reach-over-millions-of-users/) at one point. | App Store reviews now complain of [too many ads and short lives](https://apps.apple.com/ph/app/trivia-crack/id651510680). | Lives plus ads can fund an app, but ad load decides how users feel about it. |
| [HQ Trivia](https://techcrunch.com/2019/04/14/trivia-game-of-thrones) | A live 12-question show with a cash jackpot reached 2.38 million players by March 2018. | The product changed little beyond guest hosts and a paid second chance. Its host, the main differentiator, left. It shut down in February 2020. | Prizes and live events create a spike, not a habit. A single personality can carry the product, which matters because your client is the draw. |
| [QuizUp](https://productmint.com/what-happened-to-quizup/) | Hundreds of niche topics drove engagement, and Coca-Cola [sponsored World Cup trivia](https://www.adweek.com/?p=157073) as an early ad model. | It was shut down after the developers could not monetize it. | Niche categories and sponsored quizzes work, but the revenue plan has to be built in from day one. |
| [Kahoot](https://fourweekmba.com/how-does-kahoot-make-money/) | Room-code live games, mostly user-made quizzes, and friend leagues. | Strong in classrooms and training, weaker for solo play. | Live rooms and user-made quizzes build a network effect. Good for phase 2 and 3. |
| [Duolingo](https://dev.to/pocket_linguist/why-duolingos-gamification-works-and-when-it-doesnt-1d4) | Streaks, weekly leagues, and a limited resource (hearts, now energy) that can be refilled by watching an ad. | Players can speed through easy lessons just to keep a streak, and the hearts-to-energy change drew complaints. | Limits retain and monetize, but add safety nets such as [streak freezes](https://japm.substack.com/p/the-psychology-behind-duolingos-most), and group the leaderboard by activity level. |
| [Wordle](https://dinogame.gg/blog/why-wordle-blew-up/) | One puzzle a day, a spoiler-free share card, no signup, and a light streak. | By design it caps play at one puzzle a day. | A daily puzzle with a share card spreads through group chats, and a no-signup first play removes install friction. |

For scale: third-party estimates put Trivia Crack at about 1.6 million monthly active users and $100K+ in monthly revenue, roughly 75% from ads ([AppGoblin](https://appgoblin.info/apps/651510680), an estimate). Even a famous quiz app earns little per user, so plan for volume and for advertiser deals rather than per-player income.

## Credits: replace the wall with lives and a free daily game

**Keep credits out of a new player's first session and out of the leaderboard.** Your idea (play until credits run out, then wait for tomorrow or watch an ad) has four weak points, each with a fix.

| Weak point | Why it hurts | Fix |
| --- | --- | --- |
| Hard stop at zero credits | A new TikTok visitor hits the wall before a habit forms. This is the main complaint in [Trivia Crack reviews](https://apps.apple.com/ph/app/trivia-crack/id651510680). | Never a dead end. At zero lives, offer the Daily Challenge, a friend duel, or a review of missed questions. |
| "Wait until tomorrow" | A day is long enough for the player to forget the app. | Refill one life every 30 minutes (a starting value to tune) and send a push when a life is back. |
| Credits limit attempts, and attempts feed the leaderboard | The top of the board would go to whoever watches the most ads, not whoever knows the most. | Rank on a fixed question set that costs no credits (see Leaderboards below). |
| Ads shown only when the player is blocked | The ad arrives at the moment of lowest goodwill. | Offer ads where the player wants to continue: +1 life after a miss, doubled coins after a round, a free hint. |

The flow below shows how a round would work with lives instead of credits.

&#91;embedded content: lives flow · 2 decisions, 3 ways back into play\]

Every branch leads back to play: wait, watch an ad, or switch to a mode that needs no lives.

Starting settings to tune against retention data:

- **Lives:** 5, lost only on a wrong answer, not per question. Duolingo's [heart system](https://dev.to/pocket_linguist/why-duolingos-gamification-works-and-when-it-doesnt-1d4) shows that a scarce resource makes people answer more carefully.
- **Rewarded-ad cap:** start at about 5 per player per day. One vendor guide suggests [6 to 10 per session and 15 to 20 per day](https://revenueflex.com/blog/rewarded-video-ads-mobile-game-monetization) for casual games, but quiz sessions are short, so raise the cap only if retention holds.
- **Ad health checks:** track the opt-in rate (the same guide targets 40% to 70%) and compare day-1 and day-7 retention for players who watch ads against those who do not.
- **Coins:** earned from correct answers, streaks and referrals, and spent on hints (50/50, skip) and cosmetics. Coins give players something to work toward besides the leaderboard.
- **Optional subscription:** ad-free play and unlimited lives. State exactly what it covers, because Trivia Crack users complain that a paid "no ads" option [lasts only 24 hours](https://marlvel.ai/api/llm/apps/games/trivia-crack-retro-brain-games).

## Game modes

**Launch with three modes that need no friends, and add the social modes once the daily habit holds.** The first three are enough to test the idea; friend play is where the proven apps (Trivia Crack, Kahoot) grew.

| Mode | How it works | Why it is there | Phase |
| --- | --- | --- | --- |
| Daily Challenge | The same 10 multiple-choice questions for everyone, one attempt a day, a streak counter, and a spoiler-free result card to share. | The Wordle pattern: a daily ritual that spreads through group chats. It is also the fair basis for the prize leaderboard. | 1 |
| Beat the Street *(proposal)* | Questions taken from the client's TikTok videos. After answering, the player sees what share of strangers got it right, and can tap through to the clip. | Nothing generic can copy it, and it gives every video a reason to send viewers to the app. | 1 |
| Topic Play | Solo multiple-choice rounds by category, using lives. | The core quiz loop and the place where rewarded ads appear. | 1 |
| Friend Duel | Challenge a friend to a 5-question match, played at different times, sent as a link through WhatsApp or Telegram. | Head-to-head play with friends is what drove Trivia Crack and QuizUp. | 2 |
| Live Room | A room code, 2 to 20 friends answering the same questions at the same time. | The Kahoot format, good for parties and group chats. | 2 |
| Weekly Live Show | A scheduled quiz hosted by the client, tied to a TikTok Live. | HQ Trivia showed the pull of a live host. Keep prizes modest and sponsor-funded, since HQ's board blamed too much focus on bigger prizes and too few new formats. | 3 |
| Community Questions | Players submit questions, and the best are asked on the street. | Feeds the content loop and lowers question-writing cost. It needs moderation. | 3 |

Question quality is a make-or-break detail. One app-intelligence summary lists [weak quality control on trivia content](https://marlvel.ai/intel-report/games/adventure-trivia-crack) among the complaints about a Trivia Crack spin-off. Add a "report this question" button and have a person review anything AI-generated before it goes live.

## Leaderboards and prizes

**Rank everyone on the same questions, keep prize entry free of both payment and ads, and have advertisers fund the prizes.** This keeps the board fair, keeps the app store reviewers comfortable, and means prizes do not come out of the client's pocket.

**Board design**

- Rank on the Daily Challenge, where everyone gets the same 10 questions. The weekly score is the sum of the best 5 of 7 days (*proposal*), so one missed day does not ruin a week. Cap the speed bonus so accuracy always counts more.
- Show three boards: global top 3 (the prize board), friends, and a small league of players with similar activity. One critic notes that plain leaderboards [motivate the already-motivated and discourage everyone else](https://medium.com/@shengyuchen/how-duolingos-new-gamification-mechanism-convinced-me-to-pay-2e0930dbba42), and Duolingo [groups players by engagement level](https://dev.to/pocket_linguist/why-duolingos-gamification-works-and-when-it-doesnt-1d4) for that reason.
- Pay prizes to ranked winners only. Avoid random draws among participants, because chance-based prizes fall under lottery law.

**Keeping it honest**

- Score and time every answer on the server, never on the phone.
- Give each question a short timer, shuffle the answer order, and keep a question pool larger than any week needs, so a copied answer sheet is of little use.
- Allow one account per verified phone number, and flag implausible speed or accuracy.
- Hold prizes for about 48 hours for review before paying (*proposal*), and require a minimum number of days played to qualify.

**Prize rules to check before launch.** I am not a lawyer, and the rules differ by country, so a local lawyer should review the official rules.

- **Apple.** As quoted on Apple's developer forums, [guideline 5.3.1](https://developer.apple.com/forums/thread/660501) says sweepstakes and contests must be sponsored by the developer of the app, and 5.3.4 requires licensing for real-money gaming and lotteries. Apple also requires official rules inside the app that say Apple is not a sponsor, and [Apple products cannot be prizes](https://forums.solar2d.com/t/rejected-help-ensure-that-the-contest-or-sweepstake-prizes-are-not-apple-products/328872). I could not open Apple's own page, so read the current text before submitting.
- **Google Play.** The [policy](https://support.google.com/googleplay/android-developer/answer/9877032) does not allow games that accept money and offer prizes of cash or other real-world value, and it prohibits real-money contests unless the app is an approved gambling or fantasy sports app. Entry therefore must not require payment.
- **Open question for a lawyer.** If watching an ad earns a life, and lives let players play, does ad-watching count as paying to enter? The safest design is a prize board built only on the Daily Challenge, which is free and needs no ads.
- **Age.** A TikTok audience includes minors. Set a minimum age for prizes and decide how winners are verified.

**Sponsor-funded prizes.** HQ Trivia's Ready Player One sponsorship came with [the largest player prize and sponsored questions](https://www.pmg.com/blog/the-digital-anomaly-that-is-hq-trivia). Copy that: an advertiser pays for the weekly prize and gets its name on the board.

## Ads and money

**Start with sponsorships that staff sell and set up by hand, fill unsold space with an existing ad network, and build the self-serve advertiser platform only once advertisers are asking for it.** A self-serve system needs billing, ad review, reporting and fraud checks, which is a large build for an audience that does not exist yet. A trivia app's strongest pitch to advertisers is [engagement](https://medium.com/exmachinagroup/4-ways-to-monetize-your-live-trivia-app-841293b07643), and a person selling a package can explain that better than a sign-up form.

| Ad format | What the advertiser gets | Pricing to start with | Phase |
| --- | --- | --- | --- |
| Sponsored question | A question themed on the brand with a logo and a message on the answer screen. Put it early in the round, where [attention is highest](https://medium.com/exmachinagroup/4-ways-to-monetize-your-live-trivia-app-841293b07643). | Flat fee per week | 1 (set up by staff) |
| Rewarded video | A 15 to 30 second video that a player chooses to watch for +1 life. It is opt-in, which is why developers prefer it to [forced ads](https://www.adjust.com/blog/understanding-rewarded-video-ads). | Per-view rate from an ad network such as AdMob | 1 |
| Sponsored category or round | "Football trivia presented by X", as Coca-Cola did on [QuizUp](https://www.adweek.com/?p=157073). | Flat fee per month | 2 |
| Sponsored prize | The brand funds the weekly prize and appears on the leaderboard. | Prize cost plus a fee | 2 |
| Sponsored refill | "This life refill is brought to you by X", one of the [options for live trivia](https://medium.com/exmachinagroup/4-ways-to-monetize-your-live-trivia-app-841293b07643). | Flat fee per campaign | 2 |
| Rewarded survey | A short survey for a bigger reward. One vendor claims it pays [more than video](https://www.pollfish.com/blog/app-monetization/monetizing-quiz-trivia-games-with-rewarded-surveys/) (about $70 against $25 to $45 per thousand views), but those are vendor figures. | Per-completion rate from a survey network | 3 (test) |

Build order:

1. **Week one:** an ad network for rewarded video and a results-screen banner. Confirm the network pays out in the client's country before relying on it.
2. **Staff admin panel:** create a sponsored question or prize with a logo, a link and start and end dates, and export a simple report.
3. **Advertiser login:** a live report of impressions, answers, share of correct answers and clicks.
4. **Self-serve:** campaign builder, online payment and an approval queue.

Ground rules: label every sponsored item as sponsored, never show an ad while a question timer runs, and launch without forced full-screen ads. Ad load is what wears down apps like Trivia Crack, so set a maximum number of ads per session and watch the reviews.

## Getting TikTok viewers into the app

**Make the jump from video to first answer as short as possible, then use the app to feed the next video.** Every extra step loses viewers, and many of them skip the link and [search the app's name in the store](https://www.airbridge.io/en/blog/influencer-marketing-deeplinks) instead, so a short, memorable app name matters as much as the link.

1. **End each video on an open question.** Show the question, show how many strangers got it wrong, and say "answer it in the app". *Proposal.*
2. **Put the link where viewers see it.** AppsFlyer's creator guidance, as summarized by [Make Influence](https://www.makeinfluence.com/en/academy/influencer-marketing-for-app-installs-creative-strategy), is to place it in the top line of the description and a pinned comment, since most viewers never open the profile bio, and to show a QR code on screen during the video.
3. **Use a deferred deep link.** It carries a new installer straight to that day's question instead of the home screen. Plain store links lose the source of the install, so you cannot tell which video worked ([Airbridge](https://www.airbridge.io/en/blog/influencer-marketing-deeplinks)). Use one link per video.
4. **Let people play before they sign up.** Wordle spread with [no app, no signup and no ads](https://dinogame.gg/blog/why-wordle-blew-up/). Show the first question within seconds, and ask for an account only after the first round, to save the streak and rank. A browser version of the Daily Challenge for the link is worth considering later (*proposal*).
5. **Feed the loop back to TikTok.** Feature each week's champion, post answer-reveal videos, and ask players to submit questions that the client then asks on the street.
6. **Bring players back.** Send a daily reminder, a streak-at-risk warning and a weekly result.

Measure each step from day one: link clicks, installs, first round finished, return the next day, return after a week, and ad opt-in rate. The step with the biggest drop is the one to fix first.

## MVP and roadmap

**Ship the Daily Challenge, Beat the Street and Topic Play first, prove that people come back, and only then add friends, live play and the advertiser platform.** The phases below are ordered by what each one proves, not by dates, because timing depends on team size and budget.

&#91;embedded content: roadmap · 3 phases, 2 gates\]

Set the exact targets for each gate with the client before launch, so that moving on is a decision the numbers make.

*Suggested build (not researched):* one cross-platform codebase such as Flutter or React Native for Android and iOS, a hosted backend with server-side scoring (Firebase or Supabase would do), push notifications, and a simple web admin for questions and sponsors.

## Platform order for Ethiopia

**Build the Android app first, add a small Telegram Daily Challenge bot second, and leave iPhone for last.** Ethiopia was confirmed as the target market after the first draft, so this section replaces the earlier assumption that iPhone would follow quickly.

| Platform | Why | When |
| --- | --- | --- |
| Android app | [Android is 93.65% to 97.53% of mobile traffic in Ethiopia](https://gs.statcounter.com/os-market-share/mobile/ethiopia) in mid-2026 (StatCounter). It is also where rewarded ads, lives and push reminders work best. | Phase 1 |
| Telegram bot or mini app | Ethiopia is one of the few countries where [Telegram is more popular than other messengers](https://www.lolinemag.com/article/why-telegram-became-the-go-to-platform-in-ethiopia), and it [uses less data](https://techsafari.beehiiv.com/p/hulugram) than WhatsApp. Chapa, a local payment provider, has [partnered with Telegram](https://techafricanews.com/?p=24654). Best as a no-install front door for the Daily Challenge and weekly board. Weaker for ads. | Phase 1, small version on the same backend |
| iPhone app | [iOS is 2.32% to 6.24%](https://gs.statcounter.com/os-market-share/mobile/ethiopia) of mobile traffic, and Apple's contest rules are stricter (see Leaderboards and prizes). | After gate 1, only if players ask for it |

Ethiopia-specific checks before building:

- **Selling inside the app.** In November 2024 [Shega reported](https://shega.co/news/ethiopian-developers-demand-more-from-google-console-access) that Google Play allowed developer registration in Ethiopia but not merchant registration, which is what lets a developer charge for in-app purchases. Confirm the current status with Google before planning the ad-free subscription.
- **Ad payouts.** AdMob's [country restrictions](https://support.google.com/admob/answer/6163675?hl=zh-Hant) list only sanctioned regions (Crimea, Cuba, parts of Ukraine, Iran, North Korea), and Ethiopia is not among them. The payout methods open to Ethiopian publishers still need to be checked when the account is created.
- **Paying winners.** Telebirr has [30.5 million subscribers](https://www.thereporterethiopia.com/35070/), but it does not work on devices connected to a VPN.
- **Blocks.** Ethiopia blocked Facebook, Telegram, TikTok and YouTube together for [more than five months in 2023](https://www.africanews.com/2023/07/19/ethiopiasocial-media-accessible-again-after-5-months-of-blockage/). Do not let either channel be the only way in, and make sure the app works while both are blocked.

## Risks and open questions

**The biggest risks are legal rules on prizes, too many ads, and depending on one TikTok account.** Each has a plan.

| Risk | Why it matters | What to do |
| --- | --- | --- |
| Prize law and store rules | Apple and Google both restrict contests with real prizes, and country laws on lotteries differ. | Free entry, skill-based ranking, official rules in the app, and a local lawyer's review before the first payout. |
| Ad fatigue | Users of Trivia Crack complain of too many ads and short lives. | Opt-in rewarded ads only at launch, a per-session ad limit, and a free path to play. |
| One account carries the product | HQ Trivia lost momentum after its co-founder died and its host left, and TikTok reach can change. | Collect a phone number or email at signup, cross-post to Instagram Reels and YouTube Shorts, and make the app's own content strong enough to stand alone. |
| Wrong or stale answers | Poor question quality is a recurring complaint about trivia apps. | Human review, source notes on each question, and a "report this question" button. |
| Cheating | Players can search for answers, and prizes raise the incentive. | Server-side scoring, timers, verified phone numbers and a review hold before payout. |
| Minors | TikTok audiences include under-18s, which affects prizes, ad settings and data rules. | Set a minimum age for prizes and use child-safe ad settings where an ad network offers them. |

**Questions for the client** (the answers change the ad network, payment method and legal advice):

- [ ] Which country and languages are the main audience?
- [ ] Android only at first, or iPhone too?
- [ ] Who writes and checks the questions, and how many are ready now?
- [ ] How will winners be paid in that country, and what prize budget or sponsor exists?
- [ ] What team size and budget are there for phase 1?
- [ ] Does the client want a subscription, or ads and sponsors only?

## Sources

Researched 14 November 2026. Three pages were opened in full; the rest were read as search excerpts, so check the figures before quoting them to the client. Vendor and app-intelligence figures are estimates or marketing claims.

**Opened in full**

- [Google Play: Real-Money Gambling, Games, and Contests policy](https://support.google.com/googleplay/android-developer/answer/9877032)
- [TechCrunch: HQ Trivia's decline](https://techcrunch.com/2019/04/14/trivia-game-of-thrones)
- [Make Influence: creator campaigns for app installs](https://www.makeinfluence.com/en/academy/influencer-marketing-for-app-installs-creative-strategy)

**Read as search excerpts**

- Trivia Crack: [Google AdMob case study](https://admob.google.co.in/home/resources/admob-helps-trivia-crack-go-global-and-reach-over-millions-of-users/), [Think with Google](https://thinkwithgoogle.com/marketing-strategies/app-and-mobile/trivia-crack-wins-globally-by-staying-local), [App Store reviews](https://apps.apple.com/ph/app/trivia-crack/id651510680), [AppGoblin estimates](https://appgoblin.info/apps/651510680), [Marlvel on the 24-hour no-ads purchase](https://marlvel.ai/api/llm/apps/games/trivia-crack-retro-brain-games), [Marlvel on content quality](https://marlvel.ai/intel-report/games/adventure-trivia-crack)
- HQ and QuizUp: [ProductMint on HQ Trivia](https://productmint.com/what-happened-to-hq-trivia/), [PMG on the Ready Player One sponsorship](https://www.pmg.com/blog/the-digital-anomaly-that-is-hq-trivia), [ProductMint on QuizUp](https://productmint.com/what-happened-to-quizup/), [Adweek on Coca-Cola and QuizUp](https://www.adweek.com/?p=157073)
- Duolingo, Kahoot, Wordle: [DEV Community on Duolingo](https://dev.to/pocket_linguist/why-duolingos-gamification-works-and-when-it-doesnt-1d4), [Substack on streaks](https://japm.substack.com/p/the-psychology-behind-duolingos-most), [Medium on leagues](https://medium.com/@shengyuchen/how-duolingos-new-gamification-mechanism-convinced-me-to-pay-2e0930dbba42), [FourWeekMBA on Kahoot](https://fourweekmba.com/how-does-kahoot-make-money/), [Wordle analysis](https://dinogame.gg/blog/why-wordle-blew-up/)
- Ads: [RevenueFlex](https://revenueflex.com/blog/rewarded-video-ads-mobile-game-monetization), [Adjust](https://www.adjust.com/blog/understanding-rewarded-video-ads), [Pollfish](https://www.pollfish.com/blog/app-monetization/monetizing-quiz-trivia-games-with-rewarded-surveys/), [Medium on sponsored live trivia](https://medium.com/exmachinagroup/4-ways-to-monetize-your-live-trivia-app-841293b07643)
- Prize rules: [Apple developer forums (guidelines 5.3.1 and 5.3.4)](https://developer.apple.com/forums/thread/660501), [Apple prize rules on Solar2D forums](https://forums.solar2d.com/t/rejected-help-ensure-that-the-contest-or-sweepstake-prizes-are-not-apple-products/328872)
- TikTok links: [Airbridge on deep links](https://www.airbridge.io/en/blog/influencer-marketing-deeplinks)
