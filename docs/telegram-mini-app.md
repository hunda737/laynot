# Laynot on Telegram (Mini App, no server)

The Telegram version is the same Expo app, built for the web and opened inside Telegram as a **Mini App**. It has every feature of the demo and uses the same demo data. There is no backend:

| Need | Handled by |
|---|---|
| Saving progress | Telegram **CloudStorage**: per user, synced across their devices, with localStorage as a fallback |
| Duel, league and room invites | Mini App links `t.me/<bot>/<app>?startapp=...`, which open the join screen with the code filled in |
| Sharing results | Telegram's own chat picker |
| Look and feel | Telegram's light or dark theme, native back button, haptics, and a confirmation before closing mid-challenge |

On its own (no server) the bot can't answer chat messages or remind anyone, and real players don't see each other on the leaderboards. The small Node server in [`server/`](../server) adds all of that. See [Bot backend](#bot-backend-node-server) below.

The Telegram code only runs inside Telegram (see `app/src/services/telegram.ts`). The native app and the normal web build are unchanged.

## 1. Create the bot and the Mini App (BotFather)

In Telegram, open [@BotFather](https://t.me/BotFather):

1. `/newbot` and pick a name and a username, for example `laynot_bot`. You don't need the token: nothing runs on a server.
2. `/newapp`, choose the bot, then give it:
   - a title and short description;
   - a 640×360 photo;
   - the **HTTPS URL** of the hosted build (step 3);
   - a **short name**, for example `play`. Links become `https://t.me/laynot_bot/play`.
3. `/mybots` → your bot → **Bot Settings** → **Configure Mini App** → enable it with the same URL. This adds an "Open app" button to the bot's profile.
4. `/setmenubutton` → your bot → the same URL and the label `Play`. This button shows in the chat with the bot.
5. `/setdescription`: the text people see before they press Start, for example "Daily quiz from the street. Tap Play below." The bot can't reply to messages, so this text and the Play button are the way in.

## 2. Set the link names and build

In `app/`, copy `.env.example` to `.env.local` and set the bot username and short name:

```
EXPO_PUBLIC_TG_BOT=laynot_bot
EXPO_PUBLIC_TG_APP=play
```

Then build:

```
cd app
npx expo export -p web
```

The site is written to `app/dist/`. Rebuild after changing `.env.local`, because the values are built in.

## 3. Host it (any HTTPS static host)

Host `dist/` at the **root** of a domain, not a sub-folder. Some options:

- **Netlify Drop:** drag the `dist` folder onto https://app.netlify.com/drop. `dist/_redirects` (from `app/public/_redirects`) already sends every path to `index.html`.
- **Cloudflare Pages:** `npx wrangler pages deploy dist`.
- **Vercel:** needs a rewrite from `/:path*` to `/`.

Put the resulting URL into BotFather (steps 1.2 to 1.4).

## 4. Test on your own machine

1. Serve the build: `npx serve dist --single` (port 3000).
2. Make a temporary HTTPS URL: `cloudflared tunnel --url http://localhost:3000`, which prints a `https://….trycloudflare.com` address.
3. Create a separate test bot and Mini App in BotFather with that URL, so the real bot keeps its stable URL.

For developer tools inside Telegram Desktop, go to **Settings → Advanced → Experimental settings** and turn on **Enable webview inspection**. Then right-click the Mini App and choose **Inspect**.

## 5. What to check

1. Open from the Play button. The colours follow Telegram's light or dark mode.
2. Play the Daily Challenge:
   - it has the same 10 questions as the phone app on the same day;
   - phones vibrate on answers;
   - closing mid-challenge asks first.
3. Share the result. Telegram's chat picker opens with the score grid and a link to the app.
4. Create a duel and send it to a second account. Opening the link shows the join screen with the code filled in. League and Live Room invites work the same way.
5. On inner screens, Telegram's back button appears and goes back.
6. Close and reopen, or open on another device with the same account. The streak, coins and history are still there.

## How it works (for developers)

- `app/public/index.html` loads `telegram-web-app.js` before the app, so the launch data in the URL hash is read before the router changes the URL.
- `app/src/services/telegram.ts`: typed SDK wrapper, theme hook, close guard, share and link helpers.
- `app/src/services/storage.ts`: CloudStorage adapter for the game store.
  - Values are capped at 4096 characters, so the state is split into pieces (`app/src/lib/chunks.ts`).
  - Saves alternate between two slots, and a small meta key that names the complete slot is written last. A save cut off half way never replaces the last good one.
  - Writes wait 1 s so a burst of changes becomes one upload, and are sent at once when the app is hidden.
  - On load, the newer of the cloud and local copies wins.
- `app/src/lib/startParam.ts`: `startapp` only allows `A-Za-z0-9_-`, so duel and league codes travel as `d_`/`l_` plus base64url. Room codes travel as `r_1234`.
- `app/src/app/index.tsx` opens the linked screen on launch. `app/src/components/TelegramBridge.tsx` handles the back button, colours and first-launch language: Amharic if the user's Telegram language is Amharic.

## Bot backend (Node server)

`server/` is one small Node program with no dependencies. It runs the bot, serves the built Mini App, and receives progress reports from the app, all on port 3000. It replaces `npx serve`, so you need **one** ngrok tunnel.

```
trivia/
├── app/       the Expo app; `npx expo export -p web` writes app/dist
├── server/    the Node server (reads ../app/dist, does not copy it)
└── docs/
```

### What it does

| For players | |
|---|---|
| `/start`, `/play`, any text | Welcome with a **Play** button that opens the Mini App |
| Menu button, `/` commands, empty-chat description | Set by the bot at startup, in English and Amharic |
| `/remind`, `/stop` | Turn the daily reminder on or off and pick 17:00, 19:00 or 21:00 |
| `/language` | English or አማርኛ for the bot's messages |
| `/quiz` | One question from the app's bank as a Telegram quiz poll |
| `/top` | This week's top real players (best 5 of 7 days) |
| `/help`, `/id` | How it works; the sender's Telegram ID |

**Reminders** (automatic, at most one a day, only if the player hasn't played that day):
- the usual nudge at the chosen hour (up to three hours late if the server was down);
- a streak alert when they played yesterday and have 2 or more days: "ends at midnight";
- one comeback message after 3 days away and one after 7, then silence until they play again.

**For admins** (Telegram IDs in `ADMIN_IDS`):
- `/broadcast [en|am|all] text` shows a preview first, with Send and Cancel buttons, and sends at about 25 messages a second.
- `/stats` shows players, active in 7 days, played today, reminders on and blocked.
- `/channel text` posts to the channel, if `CHANNEL_ID` is set.

**Channel** (optional): the Daily Challenge post with a quiz poll at 08:00 Ethiopian time, and last week's winners on Monday at 09:00 (players need 3 days).

### Set up

1. In `server/`, copy `.env.example` to `.env` and fill in:
   - `BOT_TOKEN`: from BotFather. **Keep it secret and never commit it.** `.env` is git-ignored.
   - `WEBAPP_URL`: the public https address of this server (the ngrok address).
   - `MINIAPP_SHORT_NAME`: the Mini App's short name, for example `myapp`.
   - `ADMIN_IDS`: leave empty at first. Send `/id` to the bot, then put your number here.
   - `CHANNEL_ID`: optional, `@channelname`. Add the bot to the channel as an administrator.
2. Build the app and start everything (three terminals):
   ```
   cd app    && npx expo export -p web        # whenever the app changes; no server restart needed
   cd server && npm start                     # bot + API + the Mini App on port 3000
   ngrok http 3000                            # public https address
   ```
3. Put the ngrok address in `server/.env` as `WEBAPP_URL`, restart the server, and put the same address in BotFather as the Mini App URL (`/mybots` → Bot Settings → Configure Mini App, and `/myapps` → your app → Edit Web App URL).

The menu button, `/start` button and descriptions follow `WEBAPP_URL` on every start. The only value BotFather keeps is the profile "Open App" URL. To stop it changing each time, use a free ngrok static domain: `ngrok http 3000 --url=your-name.ngrok-free.app`.

Run `cd server && npm test` for the server's tests. Only one copy of the server can run at once: Telegram answers a second one with an error, and the log says so.

### How the app talks to the server

When the app opens, and a couple of seconds after the streak, today's result or the name changes, it sends `POST /api/event` with the streak, last played day, today's score, name and the phone's time zone. The request carries Telegram's signed launch data (`Authorization: tma <initData>`). The server checks the signature with the bot token and rejects anything older than a day, so only real Telegram users of this bot are accepted.

That is what lets reminders skip people who already played, and gives `/top` and the weekly winners their real scores.

**Limits to know about:**
- Scores are reported by the app, so a determined player could send a made-up one. That is fine for a demo, but real prizes need the server to check the answers itself.
- A person who only opens the Mini App from a link, and has never pressed Start in the chat, shows up in the stats but can't be sent reminders, because Telegram only allows messages to people who started the bot.
- The app's demo "skip a day" tool moves the app's clock; the server ignores reports from a clock that far off.
- The app's own Ranks tab still shows the demo players. Real players appear in `/top` and the winners post.

### Files

| File | Job |
|---|---|
| `src/index.js` | Starts everything |
| `src/bot.js`, `src/messages.js` | Commands, buttons, all the wording (edit wording in `messages.js`) |
| `src/reminders.js` | Who gets which reminder, and the 1-minute timer |
| `src/admin.js` | `/broadcast`, `/stats`, `/channel` |
| `src/content.js` | Quiz polls, the weekly board, channel posts |
| `src/api.js`, `src/auth.js` | The web server: static app, `/api/event`, signature check |
| `src/db.js` | SQLite database at `server/data/laynot.db` (git-ignored) |
| `src/telegram.js` | Telegram client and the throttled sender |
| `src/register.js`, `src/shared.js` | Lets the server import the app's own question bank and rules, so both always agree |
