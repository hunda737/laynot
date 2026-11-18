import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { GameDone, Note, useQuitGuard } from '@/components/games/GameKit';
import { PopIn, Shake } from '@/components/motion';
import { useRewardedAd } from '@/components/RewardedAd';
import { CoinChip } from '@/components/status';
import { Button, Card, Icon, Screen, Segmented, TopBar, Txt } from '@/components/ui';
import { AM_ANSWERS, EN_ANSWERS, EN_GUESSES } from '@/data/games/wordle';
import { useAdsLeft } from '@/hooks/useEconomy';
import { useOpenGame } from '@/hooks/useOpenGame';
import { useT, type StringKey } from '@/i18n';
import { dailyItem, practiceItem } from '@/lib/games/common';
import { familyOf, FIDEL } from '@/lib/games/fidel';
import {
  keyStates,
  MAX_GUESSES,
  scoreGuess,
  tiles,
  WORD_LENGTH,
  WORDLE_HINT_COST,
  wordleGrid,
  wordlePoints,
  type TileState,
  type WordleLang,
} from '@/lib/games/wordle';
import { haptic } from '@/services/haptics';
import { todayKey, useGame } from '@/store/useGameStore';
import { fixed, modeColors, radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

/** Orange for the Amharic "half" state: right consonant, wrong vowel. */
const HALF = '#C2410C';
const SYMBOL: Record<TileState, string> = { hit: '✓', present: '•', half: '½', miss: '×' };
const LEGEND: Record<TileState, StringKey> = {
  hit: 'games.legendHit',
  present: 'games.legendPresent',
  half: 'games.legendHalf',
  miss: 'games.legendMiss',
};

/** The answer and, for Amharic, its meaning. */
interface Target {
  word: string;
  meaning?: string;
}

function pickTarget(lang: WordleLang, daily: boolean, day: string): Target {
  if (lang === 'en') {
    const today = dailyItem(EN_ANSWERS, 'wordle-en', day);
    return { word: daily ? today : practiceItem(EN_ANSWERS, Math.random, today) };
  }
  const today = dailyItem(AM_ANSWERS, 'wordle-am', day);
  return daily ? today : practiceItem(AM_ANSWERS, Math.random, today);
}

export default function WordleScreen() {
  const { lang: uiLang } = useT();
  const params = useLocalSearchParams<{ mode?: string }>();
  const daily = params.mode !== 'practice';
  const [lang, setLang] = useState<WordleLang>(uiLang);
  // One game per language. Switching language starts that language's game.
  return <WordleGame key={lang} lang={lang} onLang={setLang} daily={daily} />;
}

function WordleGame({ lang, onLang, daily }: { lang: WordleLang; onLang: (lang: WordleLang) => void; daily: boolean }) {
  const { t } = useT();
  const [day] = useState(todayKey);
  const [target] = useState(() => pickTarget(lang, daily, day));
  const answer = useMemo(() => tiles(target.word, lang), [target, lang]);
  const length = WORD_LENGTH[lang];
  const game = lang === 'en' ? 'wordle-en' : 'wordle-am';

  const stored = useGame((s) => (daily ? s.gameResults[day]?.[game] : undefined));
  const finishGameDaily = useGame((s) => s.finishGameDaily);
  const finishGamePractice = useGame((s) => s.finishGamePractice);
  const spendCoins = useGame((s) => s.spendCoins);
  const adsLeft = useAdsLeft();
  const ad = useRewardedAd();
  const open = useOpenGame();

  const [guesses, setGuesses] = useState<string[][]>([]);
  const [marks, setMarks] = useState<TileState[][]>([]);
  const [current, setCurrent] = useState<string[]>([]);
  const [extra, setExtra] = useState(0);
  const [hints, setHints] = useState<number[]>([]);
  const [status, setStatus] = useState<'play' | 'lost' | 'done'>(() => (stored ? 'done' : 'play'));
  const [won, setWon] = useState(false);
  const [message, setMessage] = useState<{ text: string; n: number } | null>(null);
  const [outcome, setOutcome] = useState<{ points: number; coins: number; streak?: number; grid: string } | null>(null);

  const rows = MAX_GUESSES + extra;
  const keys = useMemo(() => keyStates(guesses, marks), [guesses, marks]);

  const say = (text: string) => {
    haptic.warning();
    setMessage((m) => ({ text, n: (m?.n ?? 0) + 1 }));
  };

  const finish = (solved: boolean, used: TileState[][]) => {
    const points = solved ? wordlePoints(used.length) : 0;
    const grid = wordleGrid(used);
    if (daily) {
      const rec = finishGameDaily(game, day, { points, solved, grid });
      setOutcome({ points: rec.points, coins: rec.coins, streak: rec.streakAfter, grid: rec.grid });
    } else {
      setOutcome({ points, coins: finishGamePractice(solved), grid });
    }
    setWon(solved);
    setStatus('done');
  };

  const type = (char: string) => {
    if (status !== 'play' || current.length >= length) return;
    haptic.tap();
    setCurrent([...current, char]);
  };

  const erase = () => {
    if (status !== 'play') return;
    setCurrent(current.slice(0, -1));
  };

  const submit = () => {
    if (status !== 'play') return;
    if (current.length < length) return say(t('games.wordleShort'));
    // English guesses must be real words. The Amharic list is still small, so any four characters are accepted.
    if (lang === 'en' && !EN_GUESSES.has(current.join(''))) return say(t('games.wordleUnknown'));
    const m = scoreGuess(current, answer, lang);
    const nextGuesses = [...guesses, current];
    const nextMarks = [...marks, m];
    setGuesses(nextGuesses);
    setMarks(nextMarks);
    setCurrent([]);
    setMessage(null);
    if (m.every((s) => s === 'hit')) {
      haptic.success();
      finish(true, nextMarks);
    } else if (nextGuesses.length >= rows) {
      haptic.error();
      if (extra === 0 && adsLeft > 0) setStatus('lost');
      else finish(false, nextMarks);
    }
  };

  const hint = () => {
    // Never give away the last unknown tile.
    const unknown = answer.map((_, i) => i).filter((i) => !hints.includes(i) && !marks.some((row) => row[i] === 'hit'));
    if (unknown.length <= 1) return say(t('games.noMoreHints'));
    if (!spendCoins(WORDLE_HINT_COST)) return say(t('games.notEnoughCoins'));
    haptic.success();
    setHints([...hints, unknown[0]]);
  };

  const extraGuess = () =>
    ad.show(t('games.rewardGuess'), () => {
      setExtra(1);
      setStatus('play');
    });

  const guard = useQuitGuard(guesses.length > 0 && status !== 'done', () => {
    if (daily) finish(false, marks);
  });

  const color = modeColors.wordle;
  const { width } = useWindowDimensions();
  const boardWidth = Math.min(width - space.lg * 2, lang === 'en' ? 330 : 300);
  const tileSize = Math.floor((boardWidth - (length - 1) * 6) / length);

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <TopBar
        left="close"
        onLeft={guard.close}
        title={t('games.wordle')}
        subtitle={daily ? t('games.daily') : t('games.practiceMode')}
        right={<CoinChip />}
      />

      {guesses.length === 0 && status === 'play' ? (
        <Segmented
          options={[
            { value: 'am', label: 'አማርኛ' },
            { value: 'en', label: 'English' },
          ]}
          value={lang}
          onChange={onLang}
        />
      ) : (
        <Txt variant="small" tone="muted" center>
          {lang === 'am' ? 'አማርኛ' : 'English'} · {t('games.wordleLetters', { n: length })}
        </Txt>
      )}

      {status === 'done' && (outcome || stored) ? (
        <GameDone
          color={color}
          name={`${t('games.wordle')} ${lang === 'am' ? 'አማ' : 'EN'}`}
          day={day}
          daily={daily}
          points={outcome?.points ?? stored!.points}
          solved={outcome ? won : stored!.solved}
          coins={outcome?.coins ?? stored!.coins}
          streak={daily ? (outcome?.streak ?? stored?.streakAfter) : undefined}
          grid={outcome?.grid ?? stored!.grid}
          shareLine={
            (outcome ? won : stored!.solved)
              ? `${(outcome?.grid ?? stored!.grid).split('\n').length}/${MAX_GUESSES}`
              : `X/${MAX_GUESSES}`
          }
          onAgain={() => open.practice('wordle', { replace: true })}
        >
          <Card style={{ alignItems: 'center', gap: space.xs }}>
            <Txt variant="small" tone="muted">
              {t('games.wordleAnswer')}
            </Txt>
            <Txt variant="hero">{target.word}</Txt>
            {target.meaning && (
              <Txt tone="muted" center>
                {t('games.meaning', { text: target.meaning })}
              </Txt>
            )}
          </Card>
        </GameDone>
      ) : (
        <>
          <View style={{ alignItems: 'center', gap: 6 }}>
            {Array.from({ length: rows }, (_, r) => {
              const row = r < guesses.length ? guesses[r] : r === guesses.length ? current : [];
              const rowMarks = marks[r];
              const tilesRow = (
                <View style={styles.row}>
                  {Array.from({ length }, (_, i) => (
                    <Tile key={i} char={row[i]} state={rowMarks?.[i]} size={tileSize} index={i} />
                  ))}
                </View>
              );
              return r === guesses.length ? (
                <Shake key={r} trigger={message?.n}>
                  {tilesRow}
                </Shake>
              ) : (
                <View key={r}>{tilesRow}</View>
              );
            })}
          </View>

          {message && (
            <Txt variant="small" tone="danger" center style={{ fontWeight: '700' }}>
              {message.text}
            </Txt>
          )}
          {hints.length > 0 && (
            <Txt variant="small" tone="muted" center>
              {hints.map((i) => t('games.hintTile', { n: i + 1, char: answer[i] })).join(' · ')}
            </Txt>
          )}

          {status === 'lost' ? (
            <Card style={{ gap: space.md }}>
              <Txt variant="heading">{t('games.wordleLost')}</Txt>
              <Button label={t('games.watchGuess')} kind="sponsor" icon="play-circle" onPress={extraGuess} />
              <Button label={t('games.seeResult')} kind="secondary" onPress={() => finish(false, marks)} />
            </Card>
          ) : (
            <>
              {lang === 'en' ? (
                <EnglishKeyboard keys={keys} onType={type} onErase={erase} onEnter={submit} />
              ) : (
                <FidelKeyboard keys={keys} onType={type} onErase={erase} onEnter={submit} />
              )}
              <Button small kind="ghost" icon="bulb" label={t('games.hint', { n: WORDLE_HINT_COST })} onPress={hint} />
              <Legend lang={lang} />
            </>
          )}
        </>
      )}

      {guard.dialog}
      {ad.modal}
      {open.sheet}
    </Screen>
  );
}

function useStateColors() {
  const { colors } = useTheme();
  return (state: TileState | undefined) => {
    switch (state) {
      case 'hit':
        return { bg: colors.successStrong, fg: fixed.white, border: colors.successStrong };
      case 'present':
        return { bg: colors.goldStrong, fg: fixed.white, border: colors.goldStrong };
      case 'half':
        return { bg: HALF, fg: fixed.white, border: HALF };
      case 'miss':
        return { bg: colors.textMuted, fg: fixed.white, border: colors.textMuted };
      default:
        return { bg: colors.surface, fg: colors.text, border: colors.border };
    }
  };
}

function Tile({ char, state, size, index }: { char?: string; state?: TileState; size: number; index: number }) {
  const look = useStateColors()(state);
  const body = (
    <View style={[styles.tile, { width: size, height: size, backgroundColor: look.bg, borderColor: char && !state ? look.fg : look.border }]}>
      <Txt style={{ color: look.fg, fontSize: size * 0.48, lineHeight: size * 0.6, fontWeight: '800' }}>{char ?? ''}</Txt>
      {state && <Txt style={[styles.symbol, { color: look.fg }]}>{SYMBOL[state]}</Txt>}
    </View>
  );
  // Scored tiles pop in one after another.
  return state ? (
    <PopIn index={index} delay={0}>
      {body}
    </PopIn>
  ) : (
    body
  );
}

interface KeyboardProps {
  keys: Record<string, TileState>;
  onType: (char: string) => void;
  onErase: () => void;
  onEnter: () => void;
}

const QWERTY = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];

function EnglishKeyboard({ keys, onType, onErase, onEnter }: KeyboardProps) {
  const { t } = useT();
  return (
    <View style={styles.keyboard}>
      {QWERTY.map((row) => (
        <View key={row} style={styles.keyRow}>
          {Array.from(row).map((c) => (
            <Key key={c} label={c} state={keys[c]} onPress={() => onType(c)} />
          ))}
        </View>
      ))}
      {/* Delete and Enter get their own row, as on the Amharic keyboard, so they stay full size on narrow phones. */}
      <View style={styles.keyRow}>
        <Key label="⌫" wide onPress={onErase} />
        <Key label={t('games.enter')} wide accent onPress={onEnter} />
      </View>
    </View>
  );
}

/** Amharic: tap a consonant family, then pick one of its vowel forms. */
function FidelKeyboard({ keys, onType, onErase, onEnter }: KeyboardProps) {
  const { t } = useT();
  const [family, setFamily] = useState<string | null>(null);
  const forms = FIDEL.find((f) => f.base === family)?.forms ?? [];

  // A family key shows the best clue any of its characters has given; "miss" on one form says nothing about the others.
  const familyState = (base: string): TileState | undefined => {
    let best: TileState | undefined;
    for (const [c, s] of Object.entries(keys)) {
      if (familyOf(c) !== base || s === 'miss') continue;
      if (s === 'hit' || (s === 'present' && best !== 'hit') || (s === 'half' && !best)) best = s;
    }
    return best;
  };

  return (
    <View style={styles.keyboard}>
      {family ? (
        <View style={styles.formRow}>
          {forms.map((c) => (
            <Key
              key={c}
              label={c}
              big
              state={keys[c]}
              onPress={() => {
                onType(c);
                setFamily(null);
              }}
            />
          ))}
          <Key label="✕" onPress={() => setFamily(null)} />
        </View>
      ) : (
        <Txt variant="tiny" tone="muted" center>
          {t('games.fidelPick')}
        </Txt>
      )}
      <View style={styles.familyGrid}>
        {FIDEL.map((f) => (
          <Key key={f.base} label={f.base} state={familyState(f.base)} selected={family === f.base} onPress={() => setFamily(f.base)} grid />
        ))}
      </View>
      <View style={styles.keyRow}>
        <Key label="⌫" wide onPress={onErase} />
        <Key label={t('games.enter')} wide accent onPress={onEnter} />
      </View>
    </View>
  );
}

function Key({
  label,
  state,
  onPress,
  wide,
  big,
  grid,
  selected,
  accent,
}: {
  label: string;
  state?: TileState;
  onPress: () => void;
  wide?: boolean;
  big?: boolean;
  grid?: boolean;
  selected?: boolean;
  /** The Enter key: filled with the brand colour so it is easy to find. */
  accent?: boolean;
}) {
  const { colors } = useTheme();
  const look = useStateColors()(state);
  const bg = accent ? colors.primary : selected ? colors.ink : state ? look.bg : colors.surfaceAlt;
  const fg = accent ? colors.onPrimary : selected ? colors.onInk : state ? look.fg : colors.text;
  // Word labels ("Enter", "አስገባ") get a smaller size than single characters.
  const fontSize = big ? 22 : label.length > 2 ? 14 : 17;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={state ? `${label}, ${state}` : label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.key,
        wide && styles.keyWide,
        big && styles.keyBig,
        grid && styles.keyGrid,
        { backgroundColor: bg, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Txt numberOfLines={1} adjustsFontSizeToFit style={{ color: fg, fontWeight: '800', fontSize }}>
        {label}
      </Txt>
    </Pressable>
  );
}

function Legend({ lang }: { lang: WordleLang }) {
  const { t } = useT();
  const look = useStateColors();
  const items: TileState[] = lang === 'am' ? ['hit', 'present', 'half', 'miss'] : ['hit', 'present', 'miss'];
  return (
    <Note>
      {items.map((s) => (
        <View key={s} style={styles.legendRow}>
          <View style={[styles.legendTile, { backgroundColor: look(s).bg }]}>
            <Txt style={{ color: fixed.white, fontWeight: '800', fontSize: 12 }}>{SYMBOL[s]}</Txt>
          </View>
          <Txt variant="small" style={{ flex: 1 }}>
            {t(LEGEND[s])}
          </Txt>
        </View>
      ))}
      <View style={styles.legendRow}>
        <Icon name="information-circle" size={16} />
        <Txt variant="small" tone="muted" style={{ flex: 1 }}>
          {t('games.wordleRule', { n: MAX_GUESSES })}
        </Txt>
      </View>
    </Note>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6 },
  tile: { borderWidth: 2, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  symbol: { position: 'absolute', right: 4, bottom: 1, fontSize: 11, fontWeight: '800' },
  keyboard: { gap: 6, alignSelf: 'stretch' },
  keyRow: { flexDirection: 'row', gap: 5, justifyContent: 'center' },
  formRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, justifyContent: 'center' },
  familyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, justifyContent: 'center' },
  key: { minWidth: 28, flexGrow: 1, flexBasis: 0, maxWidth: 44, height: 48, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  keyWide: { maxWidth: 96, flexGrow: 1.6 },
  keyBig: { minWidth: 40, maxWidth: 48, height: 54 },
  keyGrid: { flexBasis: '9%', flexGrow: 0, minWidth: 32 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  legendTile: { width: 22, height: 22, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
});
