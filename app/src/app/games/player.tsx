import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Image, StyleSheet, TextInput, View } from 'react-native';

import { GameDone, useQuitGuard } from '@/components/games/GameKit';
import { FadeInUp, PressableScale, Shake } from '@/components/motion';
import { useRewardedAd } from '@/components/RewardedAd';
import { CoinChip } from '@/components/status';
import { Button, Card, Icon, Screen, TopBar, Txt } from '@/components/ui';
import { ALL_NAMES, FOOTBALL_PLAYERS, type FootballPlayer } from '@/data/games/players';
import { useAdsLeft } from '@/hooks/useEconomy';
import { useOpenGame } from '@/hooks/useOpenGame';
import { useT, type Localized } from '@/i18n';
import { dailyItem, practiceItem } from '@/lib/games/common';
import { blurForStep, CHOICES_COST, PLAYER_STEPS, playerGrid, playerPoints, searchNames, zoomForStep } from '@/lib/games/player';
import { seeded, shuffle } from '@/lib/rng';
import { haptic } from '@/services/haptics';
import { todayKey, useGame } from '@/store/useGameStore';
import { modeColors, radius, space, type as typeScale } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

const MAX_SUGGESTIONS = 5;
const LAST = PLAYER_STEPS - 1;

export default function PlayerGame() {
  const { t, L } = useT();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ mode?: string }>();
  const daily = params.mode !== 'practice';
  const [day] = useState(todayKey);
  const [player] = useState<FootballPlayer>(() => {
    const today = dailyItem(FOOTBALL_PLAYERS, 'player', day);
    return daily ? today : practiceItem(FOOTBALL_PLAYERS, Math.random, today);
  });

  const stored = useGame((s) => (daily ? s.gameResults[day]?.player : undefined));
  const finishGameDaily = useGame((s) => s.finishGameDaily);
  const finishGamePractice = useGame((s) => s.finishGamePractice);
  const spendCoins = useGame((s) => s.spendCoins);
  const adsLeft = useAdsLeft();
  const ad = useRewardedAd();
  const open = useOpenGame();

  const [step, setStep] = useState(0);
  const [wrong, setWrong] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [choices, setChoices] = useState<Localized[] | null>(null);
  const [extraUsed, setExtraUsed] = useState(false);
  const [status, setStatus] = useState<'play' | 'lost' | 'done'>(() => (stored ? 'done' : 'play'));
  const [outcome, setOutcome] = useState<{ points: number; solved: boolean; coins: number; streak?: number; grid: string } | null>(null);

  const suggestions = useMemo(
    () => searchNames(ALL_NAMES, query).filter((n) => !wrong.includes(n.en)).slice(0, MAX_SUGGESTIONS),
    [query, wrong],
  );

  const finish = (won: boolean, at: number) => {
    const points = won ? playerPoints(at) : 0;
    const grid = playerGrid(at + 1, won);
    if (daily) {
      const rec = finishGameDaily('player', day, { points, solved: won, grid });
      setOutcome({ points: rec.points, solved: rec.solved, coins: rec.coins, streak: rec.streakAfter, grid: rec.grid });
    } else {
      setOutcome({ points, solved: won, coins: finishGamePractice(won), grid });
    }
    setStatus('done');
  };

  const guess = (name: Localized) => {
    if (status !== 'play') return;
    setQuery('');
    if (name.en === player.name.en) {
      haptic.success();
      return finish(true, step);
    }
    haptic.error();
    setWrong((w) => [...w, name.en]);
    setChoices((c) => c?.filter((x) => x.en !== name.en) ?? null);
    if (step < LAST) setStep(step + 1);
    else if (!extraUsed && adsLeft > 0) setStatus('lost');
    else finish(false, step);
  };

  const nextClue = () => {
    if (step < LAST) {
      haptic.tap();
      setStep(step + 1);
    }
  };

  const showChoices = () => {
    if (!spendCoins(CHOICES_COST)) return haptic.warning();
    haptic.success();
    const decoys = shuffle(
      ALL_NAMES.filter((n) => n.en !== player.name.en && !wrong.includes(n.en)),
      seeded(`${player.id}:${day}`),
    ).slice(0, 3);
    setChoices(shuffle([player.name, ...decoys], Math.random));
  };

  const extraGuess = () =>
    ad.show(t('games.rewardGuess'), () => {
      setExtraUsed(true);
      setStatus('play');
    });

  const guard = useQuitGuard((step > 0 || wrong.length > 0) && status !== 'done', () => {
    if (daily) finish(false, step);
  });

  const color = modeColors.player;
  const over = status === 'done';
  const shownStep = over ? LAST : step;
  const clues = player.clues.slice(0, over ? player.clues.length : Math.min(step + 1, player.clues.length));

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <TopBar
        left="close"
        onLeft={guard.close}
        title={t('games.player')}
        subtitle={daily ? t('games.daily') : t('games.practiceMode')}
        right={<CoinChip />}
      />

      {over && (outcome || stored) && (
        <GameDone
          color={color}
          name={t('games.player')}
          day={day}
          daily={daily}
          points={outcome?.points ?? stored!.points}
          solved={outcome?.solved ?? stored!.solved}
          coins={outcome?.coins ?? stored!.coins}
          streak={daily ? (outcome?.streak ?? stored?.streakAfter) : undefined}
          grid={outcome?.grid ?? stored!.grid}
          shareLine={t('games.pointsLine', { n: outcome?.points ?? stored!.points })}
          onAgain={() => open.practice('player', { replace: true })}
        >
          <Card style={{ alignItems: 'center', gap: space.xs }}>
            <Txt variant="small" tone="muted">
              {t('games.playerAnswer')}
            </Txt>
            <Txt variant="title" center>
              {L(player.name)}
            </Txt>
          </Card>
        </GameDone>
      )}

      <Shake trigger={wrong.length}>
        <Photo player={player} step={shownStep} />
      </Shake>

      {!over && (
        <View style={styles.stepRow}>
          <Txt variant="small" tone="muted">
            {t('games.playerStep', { n: step + 1, total: PLAYER_STEPS })}
          </Txt>
          <Txt variant="bodyStrong" tone="gold">
            {t('games.forPoints', { n: playerPoints(step) })}
          </Txt>
        </View>
      )}

      <View style={{ gap: space.sm }}>
        {clues.map((c, i) => (
          <FadeInUp key={i}>
            <Card style={styles.clue}>
              <View style={[styles.clueNo, { backgroundColor: colors.surfaceAlt }]}>
                <Txt variant="small" style={{ fontWeight: '800' }}>
                  {i + 1}
                </Txt>
              </View>
              <Txt style={{ flex: 1 }}>{L(c)}</Txt>
            </Card>
          </FadeInUp>
        ))}
      </View>

      {status === 'play' && (
        <>
          {wrong.length > 0 && (
            <Txt variant="small" tone="danger">
              {t('games.playerWrong', { names: wrong.join(', ') })}
            </Txt>
          )}
          {choices ? (
            <View style={{ gap: space.sm }}>
              {choices.map((n) => (
                <Button key={n.en} kind="secondary" label={L(n)} onPress={() => guess(n)} />
              ))}
            </View>
          ) : (
            <View style={{ gap: space.sm }}>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={t('games.playerSearch')}
                placeholderTextColor={colors.textMuted}
                autoCorrect={false}
                autoCapitalize="words"
                style={[styles.input, typeScale.bodyStrong, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
              />
              {suggestions.map((n) => (
                <PressableScale
                  key={n.en}
                  accessibilityRole="button"
                  onPress={() => guess(n)}
                  style={[styles.suggestion, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <Icon name="person-circle" size={22} color={colors.textMuted} />
                  <View style={{ flex: 1 }}>
                    <Txt variant="bodyStrong">{L(n)}</Txt>
                    <Txt variant="small" tone="muted">
                      {L(n) === n.en ? n.am : n.en}
                    </Txt>
                  </View>
                </PressableScale>
              ))}
              {query.length > 0 && suggestions.length === 0 && (
                <Txt variant="small" tone="muted">
                  {t('games.playerNoMatch')}
                </Txt>
              )}
            </View>
          )}
          <View style={styles.actions}>
            <Button
              small
              kind="secondary"
              icon="eye"
              label={t('games.nextClue')}
              disabled={step >= LAST}
              onPress={nextClue}
              style={{ flex: 1 }}
            />
            {!choices && (
              <Button small kind="secondary" icon="list" label={t('games.showChoices', { n: CHOICES_COST })} onPress={showChoices} style={{ flex: 1 }} />
            )}
          </View>
        </>
      )}

      {status === 'lost' && (
        <Card style={{ gap: space.md }}>
          <Txt variant="heading">{t('games.playerLost')}</Txt>
          <Button label={t('games.watchGuess')} kind="sponsor" icon="play-circle" onPress={extraGuess} />
          <Button label={t('games.seeResult')} kind="secondary" onPress={() => finish(false, step)} />
        </Card>
      )}

      {guard.dialog}
      {ad.modal}
      {open.sheet}
    </Screen>
  );
}

/**
 * The player's photo, blurred and zoomed in at early steps. The blur is done on the phone,
 * so the clear photo is in the app: fine for the demo, but a real release should serve a
 * pre-blurred image per step. Without a photo, a silhouette stands in.
 */
function Photo({ player, step }: { player: FootballPlayer; step: number }) {
  const { colors } = useTheme();
  const { t } = useT();
  return (
    <View style={[styles.photo, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
      {player.photo ? (
        <Image
          source={player.photo}
          blurRadius={blurForStep(step)}
          resizeMode="cover"
          style={[StyleSheet.absoluteFill, { transform: [{ scale: zoomForStep(step) }] }]}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <View style={styles.placeholder}>
          <Icon name="person" size={140} color={colors.border} />
          <Txt variant="tiny" tone="muted">
            {t('games.photoMissing')}
          </Txt>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  photo: {
    width: '100%',
    maxWidth: 320,
    aspectRatio: 1,
    alignSelf: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.xs },
  stepRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  clue: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  clueNo: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  input: { minHeight: 54, borderRadius: radius.md, borderWidth: 1, paddingHorizontal: space.lg },
  suggestion: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.md, borderWidth: 1 },
  actions: { flexDirection: 'row', gap: space.md },
});
