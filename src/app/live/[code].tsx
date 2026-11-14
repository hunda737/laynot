import { Redirect, router, useLocalSearchParams, usePreventRemove } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { QuestionView, RevealPanel, TimerBar } from '@/components/quiz';
import { ChoiceBars } from '@/components/StreetStats';
import { Button, Card, Icon, IconButton, Screen, Txt } from '@/components/ui';
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
import { scoreAnswer } from '@/lib/scoring';
import { haptic } from '@/services/haptics';
import { goBack } from '@/services/nav';
import { shareMessage } from '@/services/share';
import { nowTs, todayKey, useGame, type AnswerLog } from '@/store/useGameStore';
import { radius, space } from '@/theme/tokens';
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
        <View style={styles.top}>
          <IconButton icon="close" onPress={close} label={t('common.close')} />
          <Txt variant="heading" style={{ flex: 1 }}>
            {t('live.title')}
          </Txt>
        </View>
        <View style={[styles.codeCard, { backgroundColor: colors.sponsorStrong }]}>
          <Txt variant="tiny" style={{ color: '#FFFFFF', opacity: 0.85 }}>
            {t('live.codeLabel').toUpperCase()}
          </Txt>
          <Txt style={styles.code}>{code}</Txt>
          {host ? (
            <Txt style={{ color: '#FFFFFF' }}>{t('live.hostedBy', { name: host.name })}</Txt>
          ) : (
            <Button small kind="inverse" icon="share-social" label={t('live.shareCode')} onPress={() => shareMessage(t('live.shareText', { code }))} />
          )}
        </View>

        <View style={styles.lobbyHead}>
          <Txt variant="heading">{t('live.lobby')}</Txt>
          <Txt variant="small" tone="muted">
            {t('live.players', { n: players.length + 1 })}
          </Txt>
        </View>
        <View style={styles.grid}>
          <PlayerChip name={youName} you />
          {players.map((p) => (
            <PlayerChip key={p.bot.id} name={p.bot.name} />
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
        <View style={styles.top}>
          <IconButton icon="close" onPress={() => router.dismissTo('/live')} label={t('common.close')} />
          <Txt variant="heading" style={{ flex: 1 }}>
            {t('live.final')}
          </Txt>
        </View>
        <View style={[styles.codeCard, { backgroundColor: me.rank === 1 ? colors.success : colors.sponsorStrong }]}>
          <Icon name="trophy" size={40} color="#FFFFFF" />
          <Txt variant="title" center style={{ color: '#FFFFFF' }}>
            {t('live.place', { rank: me.rank, total: standings.length })}
          </Txt>
          <Txt variant="bodyStrong" style={{ color: '#FFFFFF' }}>
            {me.score} {t('common.pts')}
          </Txt>
          <View style={styles.coins}>
            <Icon name="ellipse" size={14} color={colors.gold} />
            <Txt variant="bodyStrong" tone="gold">
              {t('topics.coinsEarned', { n: coins })}
            </Txt>
          </View>
        </View>
        <StandingsList rows={standings} showMoves={false} />
        <Button
          label={t('live.again')}
          icon="refresh"
          onPress={() => router.replace({ pathname: '/live/[code]', params: { code: newRoomCode(), mode: 'host' } })}
        />
        <Button label={t('live.leave')} kind="secondary" onPress={() => router.dismissTo('/live')} />
      </Screen>
    );
  }
  if (phase.kind === 'final') return null;

  // ---------- Question / reveal / standings ----------
  const i = phase.index;
  const pq = room.questions[i];
  const mine = yours[i];
  const total = players.length + 1;
  const header = (
    <View style={styles.top}>
      <IconButton icon="close" onPress={close} label={t('common.close')} />
      <View style={{ flex: 1 }}>
        <Txt variant="small" tone="muted">
          {t('live.title')} · {code}
        </Txt>
        <Txt variant="bodyStrong">{t('quiz.question', { n: i + 1, total: room.questions.length })}</Txt>
      </View>
    </View>
  );

  if (phase.kind === 'question') {
    const elapsed = now - phase.start;
    const answeredBots = players.filter((p) => botLiveAnswer(room, p.bot, i).atMs <= elapsed);
    const answeredIds = new Set(answeredBots.map((p) => p.bot.id));
    return (
      <Screen edges={['top', 'bottom', 'left', 'right']}>
        {header}
        <TimerBar remaining={Math.max(0, LIVE_TIME_MS - elapsed)} limit={LIVE_TIME_MS} />
        {mine ? (
          <Card style={{ gap: space.md }}>
            <Txt variant="question">{L(pq.question.text)}</Txt>
            <View style={[styles.locked, { backgroundColor: colors.sponsorSoft }]}>
              <Icon name="lock-closed" color={colors.sponsor} />
              <Txt variant="bodyStrong" style={{ flex: 1 }}>
                {mine.pick === null ? t('quiz.timeout') : L(pq.question.choices[mine.pick])}
              </Txt>
            </View>
            <Txt tone="muted">{t('live.locked')}</Txt>
          </Card>
        ) : (
          <QuestionView
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
          <View style={styles.faces}>
            <View style={{ opacity: mine ? 1 : 0.3 }}>
              <Avatar name={youName} size={30} color={colors.primary} />
            </View>
            {players.map((p) => (
              <View key={p.bot.id} style={{ opacity: answeredIds.has(p.bot.id) ? 1 : 0.3 }}>
                <Avatar name={p.bot.name} size={30} />
              </View>
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
        <QuestionView pq={pq} revealed={log} onPick={() => {}} />
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
      <StandingsList rows={rows} showMoves={i > 0} />
      <Button label={t('live.next')} icon="arrow-forward" onPress={() => setSkips((s) => ({ ...s, [`s${i}`]: nowTs() }))} />
      {leaveDialog}
    </Screen>
  );
}

function PlayerChip({ name, you }: { name: string; you?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.chip, { backgroundColor: you ? colors.primarySoft : colors.surface, borderColor: you ? colors.primary : colors.border }]}>
      <Avatar name={name} size={28} color={you ? colors.primary : undefined} />
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
      {rows.map((r) => {
        const moved = r.prevRank - r.rank;
        return (
          <View
            key={r.id}
            style={[
              styles.row,
              { backgroundColor: r.isYou ? colors.primarySoft : colors.surface, borderColor: r.isYou ? colors.primary : colors.border },
            ]}
          >
            <Txt variant="bodyStrong" style={styles.rank}>
              {r.rank}
            </Txt>
            <Avatar name={r.name} color={r.isYou ? colors.primary : undefined} />
            <Txt variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
              {r.name}
            </Txt>
            {showMoves && moved !== 0 && (
              <Icon name={moved > 0 ? 'caret-up' : 'caret-down'} size={16} color={moved > 0 ? colors.success : colors.danger} />
            )}
            <Txt variant="bodyStrong" style={{ fontVariant: ['tabular-nums'] }}>
              {r.score}
            </Txt>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  codeCard: { borderRadius: radius.lg, padding: space.xl, alignItems: 'center', gap: space.sm },
  code: { color: '#FFFFFF', fontSize: 48, lineHeight: 60, fontWeight: '900', letterSpacing: 10 },
  lobbyHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingRight: space.md, padding: 4, borderRadius: radius.pill, borderWidth: 1 },
  locked: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.md },
  faces: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  coins: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: space.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.md, paddingVertical: space.sm, borderRadius: radius.md, borderWidth: 1 },
  rank: { width: 26, textAlign: 'center', fontVariant: ['tabular-nums'] },
});
