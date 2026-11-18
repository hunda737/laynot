import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { GameDone, Note, useQuitGuard } from '@/components/games/GameKit';
import { PopIn, Shake } from '@/components/motion';
import { useRewardedAd } from '@/components/RewardedAd';
import { CoinChip } from '@/components/status';
import { Button, Card, Screen, TopBar, Txt } from '@/components/ui';
import { GROUP_PUZZLES } from '@/data/games/groups';
import { useAdsLeft } from '@/hooks/useEconomy';
import { useOpenGame } from '@/hooks/useOpenGame';
import { useT, type Localized } from '@/i18n';
import { dailyItem, practiceItem } from '@/lib/games/common';
import {
  checkGroup,
  GROUP_HINT_COST,
  groupOf,
  groupsGrid,
  groupsPoints,
  MAX_MISTAKES,
  tileId,
  type GroupPuzzle,
} from '@/lib/games/groups';
import { seeded, shuffle } from '@/lib/rng';
import { haptic } from '@/services/haptics';
import { todayKey, useGame } from '@/store/useGameStore';
import { modeColors, radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

/** Yellow (easiest), green, blue, purple (hardest), each with readable text. */
const LEVEL_LOOK = [
  { bg: '#F5C518', fg: '#1F1500' },
  { bg: '#15803D', fg: '#FFFFFF' },
  { bg: '#1D4ED8', fg: '#FFFFFF' },
  { bg: '#7E22CE', fg: '#FFFFFF' },
] as const;

const TOAST_MS = 1800;

export default function Groups() {
  const { t, L } = useT();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ mode?: string }>();
  const daily = params.mode !== 'practice';
  const [day] = useState(todayKey);
  const [puzzle] = useState<GroupPuzzle<Localized>>(() => {
    const today = dailyItem(GROUP_PUZZLES, 'groups', day);
    return daily ? today : practiceItem(GROUP_PUZZLES, Math.random, today);
  });
  const levelOf = (g: number) => puzzle.groups[g].level;

  const stored = useGame((s) => (daily ? s.gameResults[day]?.groups : undefined));
  const finishGameDaily = useGame((s) => s.finishGameDaily);
  const finishGamePractice = useGame((s) => s.finishGamePractice);
  const spendCoins = useGame((s) => s.spendCoins);
  const adsLeft = useAdsLeft();
  const ad = useRewardedAd();
  const open = useOpenGame();

  const allTiles = useMemo(() => puzzle.groups.flatMap((g, gi) => g.tiles.map((_, ti) => tileId(gi, ti))), [puzzle]);
  const [order, setOrder] = useState(() => shuffle(allTiles, daily ? seeded(`groups:${day}`) : Math.random));
  const [solved, setSolved] = useState<number[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [guesses, setGuesses] = useState<string[][]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [extra, setExtra] = useState(0);
  const [hinted, setHinted] = useState<number[]>([]);
  const [status, setStatus] = useState<'play' | 'lost' | 'done'>(() => (stored ? 'done' : 'play'));
  const [toast, setToast] = useState<{ text: string; n: number } | null>(null);
  const [outcome, setOutcome] = useState<{ points: number; solved: boolean; coins: number; streak?: number; grid: string } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(id);
  }, [toast]);

  const say = (text: string) => setToast((x) => ({ text, n: (x?.n ?? 0) + 1 }));
  const allowed = MAX_MISTAKES + extra;
  const tileText = (id: string) => L(puzzle.groups[groupOf(id)].tiles[Number(id.split('-')[1])]);

  const finish = (won: boolean, made: number, played: string[][]) => {
    const points = groupsPoints(made, won);
    const grid = groupsGrid(played, levelOf);
    if (daily) {
      const rec = finishGameDaily('groups', day, { points, solved: won, grid });
      setOutcome({ points: rec.points, solved: rec.solved, coins: rec.coins, streak: rec.streakAfter, grid: rec.grid });
    } else {
      setOutcome({ points, solved: won, coins: finishGamePractice(won), grid });
    }
    setStatus('done');
  };

  const toggle = (id: string) => {
    if (status !== 'play') return;
    haptic.tap();
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length < 4 ? [...s, id] : s));
  };

  const submit = () => {
    if (selected.length !== 4 || status !== 'play') return;
    const key = [...selected].sort().join();
    if (guesses.some((g) => [...g].sort().join() === key)) {
      haptic.warning();
      return say(t('games.groupsAlready'));
    }
    const played = [...guesses, selected];
    setGuesses(played);
    const result = checkGroup(selected);
    if (result.kind === 'correct') {
      haptic.success();
      const nextSolved = [...solved, result.group];
      setSolved(nextSolved);
      setOrder((o) => o.filter((id) => groupOf(id) !== result.group));
      setSelected([]);
      if (nextSolved.length === 4) finish(true, mistakes, played);
      return;
    }
    haptic.error();
    const made = mistakes + 1;
    setMistakes(made);
    say(result.kind === 'oneAway' ? t('games.groupsOneAway') : t('games.groupsWrong'));
    if (made >= allowed) {
      if (extra === 0 && adsLeft > 0) setStatus('lost');
      else finish(false, made, played);
    }
  };

  const hint = () => {
    const next = puzzle.groups
      .map((g, i) => ({ i, level: g.level }))
      .filter((g) => !solved.includes(g.i) && !hinted.includes(g.i))
      .sort((a, b) => a.level - b.level)[0];
    if (!next || solved.length + hinted.length >= 3) return say(t('games.noMoreHints'));
    if (!spendCoins(GROUP_HINT_COST)) return say(t('games.notEnoughCoins'));
    haptic.success();
    setHinted([...hinted, next.i]);
  };

  const extraMistake = () =>
    ad.show(t('games.rewardMistake'), () => {
      setExtra(1);
      setStatus('play');
    });

  const guard = useQuitGuard(guesses.length > 0 && status !== 'done', () => {
    if (daily) finish(false, mistakes, guesses);
  });

  const color = modeColors.groups;
  // When the round is over, every group is shown: the solved ones first, then the rest.
  const shownGroups = status === 'done' ? [...solved, ...[0, 1, 2, 3].filter((g) => !solved.includes(g))] : solved;

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <TopBar
        left="close"
        onLeft={guard.close}
        title={t('games.groups')}
        subtitle={daily ? t('games.daily') : t('games.practiceMode')}
        right={<CoinChip />}
      />

      {status === 'done' && (outcome || stored) && (
        <GameDone
          color={color}
          name={t('games.groups')}
          day={day}
          daily={daily}
          points={outcome?.points ?? stored!.points}
          solved={outcome?.solved ?? stored!.solved}
          coins={outcome?.coins ?? stored!.coins}
          streak={daily ? (outcome?.streak ?? stored?.streakAfter) : undefined}
          grid={outcome?.grid ?? stored!.grid}
          shareLine={t('games.pointsLine', { n: outcome?.points ?? stored!.points })}
          onAgain={() => open.practice('groups', { replace: true })}
        />
      )}

      <View style={{ gap: space.sm }}>
        {shownGroups.map((g) => {
          const group = puzzle.groups[g];
          const look = LEVEL_LOOK[group.level];
          return (
            <PopIn key={g}>
              <View style={[styles.solved, { backgroundColor: look.bg }]}>
                <Txt variant="bodyStrong" center style={{ color: look.fg }}>
                  {L(group.theme).toUpperCase()}
                </Txt>
                <Txt variant="small" center style={{ color: look.fg }}>
                  {group.tiles.map(L).join(' · ')}
                </Txt>
              </View>
            </PopIn>
          );
        })}

        {status !== 'done' && (
          <Shake trigger={mistakes}>
            <View style={styles.board}>
              {order.map((id) => {
                const on = selected.includes(id);
                return (
                  <Pressable
                    key={id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    onPress={() => toggle(id)}
                    style={({ pressed }) => [
                      styles.tile,
                      { backgroundColor: on ? colors.ink : colors.surfaceAlt, opacity: pressed ? 0.8 : 1 },
                    ]}
                  >
                    <Txt
                      variant="small"
                      center
                      numberOfLines={3}
                      adjustsFontSizeToFit
                      style={{ fontWeight: '800', color: on ? colors.onInk : colors.text }}
                    >
                      {tileText(id)}
                    </Txt>
                  </Pressable>
                );
              })}
            </View>
          </Shake>
        )}
      </View>

      {status === 'play' && (
        <>
          <View style={styles.mistakes}>
            <Txt variant="small" tone="muted">
              {t('games.mistakesLeft')}
            </Txt>
            {Array.from({ length: allowed }, (_, i) => (
              <View key={i} style={[styles.dot, { backgroundColor: i < allowed - mistakes ? colors.text : colors.border }]} />
            ))}
          </View>
          {toast && (
            <Txt variant="bodyStrong" center tone={toast.text === t('games.groupsOneAway') ? 'gold' : 'danger'}>
              {toast.text}
            </Txt>
          )}
          {hinted.length > 0 && (
            <Note>
              {hinted.map((g) => (
                <Txt key={g} variant="small">
                  {t('games.groupsHintTheme', { theme: L(puzzle.groups[g].theme) })}
                </Txt>
              ))}
            </Note>
          )}
          <View style={styles.actions}>
            <Button
              small
              kind="secondary"
              icon="shuffle"
              label={t('games.shuffle')}
              onPress={() => setOrder((o) => shuffle(o, Math.random))}
              style={{ flex: 1 }}
            />
            <Button
              small
              kind="secondary"
              icon="close-circle"
              label={t('games.deselect')}
              disabled={selected.length === 0}
              onPress={() => setSelected([])}
              style={{ flex: 1 }}
            />
          </View>
          <Button label={t('games.submit')} icon="checkmark" disabled={selected.length !== 4} onPress={submit} />
          <Button small kind="ghost" icon="bulb" label={t('games.groupsHint', { n: GROUP_HINT_COST })} onPress={hint} />
          <Txt variant="small" tone="muted" center>
            {t('games.groupsRule', { n: MAX_MISTAKES })}
          </Txt>
        </>
      )}

      {status === 'lost' && (
        <Card style={{ gap: space.md }}>
          <Txt variant="heading">{t('games.groupsLost')}</Txt>
          <Button label={t('games.watchMistake')} kind="sponsor" icon="play-circle" onPress={extraMistake} />
          <Button label={t('games.seeResult')} kind="secondary" onPress={() => finish(false, mistakes, guesses)} />
        </Card>
      )}

      {guard.dialog}
      {ad.modal}
      {open.sheet}
    </Screen>
  );
}

const styles = StyleSheet.create({
  solved: { borderRadius: radius.md, padding: space.md, gap: 2, minHeight: 64, justifyContent: 'center' },
  board: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  tile: {
    width: '23%',
    flexGrow: 1,
    aspectRatio: 1,
    maxHeight: 92,
    borderRadius: radius.sm,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mistakes: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm },
  dot: { width: 12, height: 12, borderRadius: 6 },
  actions: { flexDirection: 'row', gap: space.md },
});
