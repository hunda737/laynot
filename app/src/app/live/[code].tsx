import { Redirect, router, useLocalSearchParams, usePreventRemove } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Confetti, FadeInUp, Pop, PopIn, useCountUp } from '@/components/motion';
import { ProgressDots, QuestionView, RevealPanel, TimerBar } from '@/components/quiz';
import { CoinChip } from '@/components/status';
import { ChoiceBars } from '@/components/StreetStats';
import { Badge, Button, Card, HeroCard, Icon, Screen, TopBar, Txt } from '@/components/ui';
import { useNow } from '@/hooks/useNow';
import { useT } from '@/i18n';
import {
  botLiveAnswer,
  isRoomCode,
  LIVE_TIME_MS,
  liveCoins,
  livePhase,
  liveRoom,
  liveStandings,
  newRoomCode,
  playersAt,
  roomPicks,
  type LiveAnswer,
  type RoomMode,
  type Standing,
} from '@/lib/live';
import { scoreAnswer, type AnswerMark } from '@/lib/scoring';
import { haptic } from '@/services/haptics';
import { goBack } from '@/services/nav';
import { shareMessage } from '@/services/share';
import { nowTs, todayKey, useGame, type AnswerLog } from '@/store/useGameStore';
import { fixed, medals, modeColors, radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

export default function LiveRoomScreen() {
  const { code, mode } = useLocalSearchParams<{ code: string; mode?: string }>();
  if (!code || !isRoomCode(code)) return <Redirect href="/live" />;
  const roomMode: RoomMode = mode === 'join' ? 'join' : 'host';
  return <Game key={`${code}:${roomMode}`} code={code} mode={roomMode} />;
}

function Game({ code, mode }: { code: string; mode: RoomMode }) {
  const { colors } = useTheme();
  const { t, L } = useT();
  const now = useNow(200);
  const profile = useGame((s) => s.profile);
  const finishLiveRoom = useGame((s) => s.finishLiveRoom);
  const youName = profile?.name ?? t('ranks.you');

  const [openedAt] = useState(nowTs);
  const [room] = useState(() => liveRoom(code, mode, todayKey()));
  const [hostStart, setHostStart] = useState<number | null>(null);
  const [yours, setYours] = useState<(LiveAnswer | undefined)[]>([]);
  const [skips, setSkips] = useState<Record<string, number>>({});
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const startAt = mode === 'join' ? openedAt + (room.autoStartMs ?? 0) : hostStart;
  const started = startAt !== null && now >= startAt;
  const players = useMemo(
    () => playersAt(room, (started && startAt !== null ? startAt : now) - openedAt),
    [room, started, startAt, now, openedAt],
  );
  const phase = started && startAt !== null ? livePhase(room, players, startAt, yours, skips, now) : null;
  const final = phase?.kind === 'final';
  const standings = useMemo(
    () => (final ? liveStandings(room, players, yours, youName, room.questions.length - 1) : null),
    [final, room, players, yours, youName],
  );
  const me = standings?.find((s) => s.isYou);
  // Zero until the final results appear, so the score counts up on the last screen.
  const shownScore = useCountUp(me?.score ?? 0, 900);

  // Record the game once, when the final results first appear.
  const recorded = useRef(false);
  useEffect(() => {
    if (!me || !standings || recorded.current) return;
    recorded.current = true;
    finishLiveRoom(me.score, me.correct, me.rank);
    if (me.rank === 1) haptic.success();
  }, [me, standings, finishLiveRoom]);

  usePreventRemove(started && !final && !leaving, () => setConfirmLeave(true));

  // Navigate only after the guard above is off, or it would block the exit.
  useEffect(() => {
    if (leaving) router.dismissTo('/live');
  }, [leaving]);

  const leaveDialog = (
    <ConfirmDialog
      visible={confirmLeave}
      title={t('live.leaveTitle')}
      body={t('live.leaveBody')}
      confirmLabel={t('live.leave')}
      cancelLabel={t('common.cancel')}
      destructive
      onCancel={() => setConfirmLeave(false)}
      onConfirm={() => {
        setConfirmLeave(false);
        setLeaving(true);
      }}
    />
  );
  const close = () => (started && !final ? setConfirmLeave(true) : goBack());

  // ---------- Lobby ----------
  if (!phase) {
    const host = room.host;
    return (
      <Screen>
        <TopBar left="close" onLeft={close} title={t('live.title')} />
        <PopIn>
          <HeroCard color={modeColors.live} align="center" pattern="rings">
            <Txt variant="tiny" tone="onAccent" style={{ opacity: 0.85 }}>
              {t('live.codeLabel').toUpperCase()}
            </Txt>
            <Txt tone="onAccent" style={styles.code}>
              {code}
            </Txt>
            {host ? (
              <Txt tone="onAccent">{t('live.hostedBy', { name: host.name })}</Txt>
            ) : (
              <Button small kind="ink" icon="share-social" label={t('live.shareCode')} onPress={() => shareMessage(t('live.shareText', { code }))} />
            )}
          </HeroCard>
        </PopIn>

        <FadeInUp index={1} style={styles.lobbyHead}>
          <Txt variant="heading" style={{ flex: 1 }}>
            {t('live.lobby')}
          </Txt>
          <Pop trigger={players.length}>
            <Badge icon="people" label={t('live.players', { n: players.length + 1 })} bg={modeColors.live} fg={colors.onAccent} />
          </Pop>
        </FadeInUp>
        <View style={styles.grid}>
          <PopIn key="you">
            <PlayerChip name={youName} you />
          </PopIn>
          {/* Keyed by player, so only someone who just joined pops in. */}
          {players.map((p) => (
            <PopIn key={p.bot.id}>
              <PlayerChip name={p.bot.name} />
            </PopIn>
          ))}
        </View>

        {host ? (
          <Txt tone="muted" center>
            {startAt !== null && startAt - now < 1200 ? t('live.starting') : t('live.waitingHost', { name: host.name })}
          </Txt>
        ) : (
          <>
            <Button
              label={t('live.start')}
              icon="play"
              disabled={players.length === 0}
              onPress={() => {
                haptic.tap();
                setHostStart(nowTs());
              }}
            />
            {players.length === 0 && (
              <Txt variant="small" tone="muted" center>
                {t('live.needPlayers')}
              </Txt>
            )}
          </>
        )}
        <Txt variant="small" tone="muted" center>
          {t('live.demoNote')}
        </Txt>
        {leaveDialog}
      </Screen>
    );
  }

  // ---------- Final ----------
  if (phase.kind === 'final' && standings && me) {
    const coins = liveCoins(me.correct, me.rank);
    return (
      <Screen>
        <TopBar left="close" onLeft={() => router.dismissTo('/live')} title={t('live.final')} />
        <PopIn>
          <HeroCard color={me.rank === 1 ? colors.successStrong : modeColors.live} align="center">
            <Icon name="trophy" size={40} color={colors.onAccent} />
            <Txt variant="title" tone="onAccent" center>
              {t('live.place', { rank: me.rank, total: standings.length })}
            </Txt>
            <Txt variant="number" tone="onAccent" style={{ fontVariant: ['tabular-nums'] }}>
              {shownScore}{' '}
              <Txt variant="heading" tone="onAccent">
                {t('common.pts')}
              </Txt>
            </Txt>
            <PopIn delay={300} style={{ marginTop: space.xs }}>
              <CoinChip amount={coins} prefix="+" variant="onColor" />
            </PopIn>
          </HeroCard>
        </PopIn>
        <StandingsList key="final" rows={standings} showMoves={false} />
        <FadeInUp delay={300} style={{ gap: space.md }}>
          <Button
            label={t('live.again')}
            icon="refresh"
            onPress={() => router.replace({ pathname: '/live/[code]', params: { code: newRoomCode(), mode: 'host' } })}
          />
          <Button label={t('live.leave')} kind="secondary" onPress={() => router.dismissTo('/live')} />
        </FadeInUp>
        <Confetti fire={me.rank === 1} />
      </Screen>
    );
  }
  if (phase.kind === 'final') return null;

  // ---------- Question / reveal / standings ----------
  const i = phase.index;
  const pq = room.questions[i];
  const mine = yours[i];
  const total = players.length + 1;
  // Your answer to the current question stays hidden until the reveal.
  const shown = phase.kind === 'question' ? i : i + 1;
  const marks = Array.from({ length: shown }, (_, n): AnswerMark => {
    const a = yours[n];
    return !a || a.pick === null ? 'timeout' : a.pick === 0 ? 'correct' : 'wrong';
  });
  let score = 0;
  for (let n = 0; n < shown; n++) score += yours[n]?.points ?? 0;
  const header = (
    <TopBar
      left="close"
      onLeft={close}
      center={<ProgressDots marks={marks} total={room.questions.length} current={i} />}
      right={
        <Pop trigger={score}>
          <Txt variant="bodyStrong" style={styles.score}>
            {score}
          </Txt>
        </Pop>
      }
    />
  );
  const where = (
    <Txt variant="small" tone="muted">
      {t('live.title')} · {code} · {t('quiz.question', { n: i + 1, total: room.questions.length })}
    </Txt>
  );

  if (phase.kind === 'question') {
    const elapsed = now - phase.start;
    const answeredBots = players.filter((p) => botLiveAnswer(room, p.bot, i).atMs <= elapsed);
    const answeredIds = new Set(answeredBots.map((p) => p.bot.id));
    return (
      <Screen edges={['top', 'bottom', 'left', 'right']}>
        {header}
        <View style={{ gap: space.sm }}>
          {where}
          <TimerBar remaining={Math.max(0, LIVE_TIME_MS - elapsed)} limit={LIVE_TIME_MS} />
        </View>
        {mine ? (
          <Card style={{ gap: space.md }}>
            <Txt variant="question">{L(pq.question.text)}</Txt>
            <View style={[styles.locked, { backgroundColor: colors.surfaceAlt }]}>
              <PopIn style={[styles.lockIcon, { backgroundColor: modeColors.live }]}>
                <Icon name="lock-closed" size={16} color={colors.onAccent} />
              </PopIn>
              <Txt variant="bodyStrong" style={{ flex: 1 }}>
                {mine.pick === null ? t('quiz.timeout') : L(pq.question.choices[mine.pick])}
              </Txt>
            </View>
            <Txt tone="muted">{t('live.locked')}</Txt>
          </Card>
        ) : (
          <QuestionView
            key="question"
            pq={pq}
            revealed={null}
            onPick={(choice) => {
              haptic.tap();
              const atMs = nowTs() - phase.start;
              setYours((y) => {
                const next = [...y];
                next[i] = { pick: choice, atMs, points: scoreAnswer(choice === 0, atMs) };
                return next;
              });
            }}
          />
        )}
        <View style={{ gap: space.sm }}>
          <Txt variant="small" tone="muted">
            {t('live.answered', { n: answeredBots.length + (mine ? 1 : 0), total })}
          </Txt>
          {/* Each face pops as that player answers. Scale only, so nothing around the answers moves. */}
          <View style={styles.faces}>
            <Pop trigger={!!mine} style={{ opacity: mine ? 1 : 0.3 }}>
              <Avatar name={youName} size={30} color={colors.primaryStrong} />
            </Pop>
            {players.map((p) => (
              <Pop key={p.bot.id} trigger={answeredIds.has(p.bot.id)} style={{ opacity: answeredIds.has(p.bot.id) ? 1 : 0.3 }}>
                <Avatar name={p.bot.name} size={30} />
              </Pop>
            ))}
          </View>
        </View>
        {leaveDialog}
      </Screen>
    );
  }

  if (phase.kind === 'reveal') {
    const log: AnswerLog = {
      questionId: pq.question.id,
      pick: mine?.pick ?? null,
      mark: !mine || mine.pick === null ? 'timeout' : mine.pick === 0 ? 'correct' : 'wrong',
      points: mine?.points ?? 0,
    };
    return (
      <Screen edges={['top', 'bottom', 'left', 'right']}>
        {header}
        {where}
        {/* Same key as in the question phase: after a timeout the answers stay put and only show the result. */}
        <QuestionView key="question" pq={pq} revealed={log} onPick={() => {}} />
        <RevealPanel
          pq={pq}
          revealed={log}
          badge={log.mark === 'correct' ? `+${log.points} ${t('common.pts')}` : undefined}
          nextLabel={t('live.next')}
          onNext={() => setSkips((s) => ({ ...s, [`r${i}`]: nowTs() }))}
        >
          <ChoiceBars
            question={pq.question}
            order={pq.order}
            pick={log.pick}
            pcts={roomPicks(room, players, mine, i)}
            title={t('live.roomAnswers')}
            bg={colors.bg}
          />
        </RevealPanel>
        {leaveDialog}
      </Screen>
    );
  }

  // Standings
  const rows = liveStandings(room, players, yours, youName, i);
  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      {header}
      <Txt variant="heading">{t('live.standings', { n: i + 1 })}</Txt>
      {/* Keyed by question, so the rows arrive again on every standings view. */}
      <StandingsList key={i} rows={rows} showMoves={i > 0} />
      <Button label={t('live.next')} icon="arrow-forward" onPress={() => setSkips((s) => ({ ...s, [`s${i}`]: nowTs() }))} />
      {leaveDialog}
    </Screen>
  );
}

function PlayerChip({ name, you }: { name: string; you?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.chip, { backgroundColor: you ? colors.primarySoft : colors.surface, borderColor: you ? colors.primary : colors.border }]}>
      <Avatar name={name} size={28} color={you ? colors.primaryStrong : undefined} />
      <Txt variant="small" numberOfLines={1} style={{ fontWeight: '700', maxWidth: 110 }}>
        {name}
      </Txt>
    </View>
  );
}

function StandingsList({ rows, showMoves }: { rows: Standing[]; showMoves: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: space.sm }}>
      {rows.map((r, index) => {
        const moved = r.prevRank - r.rank;
        const medal = r.rank <= medals.length ? medals[r.rank - 1] : undefined;
        return (
          <FadeInUp
            key={r.id}
            index={Math.min(index, 10)}
            style={[
              styles.row,
              { backgroundColor: r.isYou ? colors.primarySoft : colors.surface, borderColor: r.isYou ? colors.primary : colors.border },
            ]}
          >
            <View style={[styles.rank, medal ? { backgroundColor: medal } : null]}>
              <Txt variant="small" style={[styles.rankText, { color: medal ? fixed.ink : colors.text }]}>
                {r.rank}
              </Txt>
            </View>
            <Avatar name={r.name} color={r.isYou ? colors.primaryStrong : undefined} />
            <Txt variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
              {r.name}
            </Txt>
            {showMoves && moved !== 0 && (
              <Icon name={moved > 0 ? 'caret-up' : 'caret-down'} size={16} color={moved > 0 ? colors.success : colors.danger} />
            )}
            <Txt variant="bodyStrong" style={{ fontVariant: ['tabular-nums'] }}>
              {r.score}
            </Txt>
          </FadeInUp>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  code: { fontSize: 48, lineHeight: 60, fontWeight: '900', letterSpacing: 10, fontVariant: ['tabular-nums'] },
  score: { minWidth: 44, textAlign: 'right', fontVariant: ['tabular-nums'] },
  lobbyHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingRight: space.md, padding: 4, borderRadius: radius.pill, borderWidth: 1 },
  locked: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.md },
  lockIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  faces: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.md, paddingVertical: space.sm, borderRadius: radius.md, borderWidth: 1 },
  rank: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  rankText: { fontWeight: '800', fontVariant: ['tabular-nums'] },
});
