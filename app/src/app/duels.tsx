import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { FadeInUp, PopIn } from '@/components/motion';
import { Badge, Button, Card, HeroCard, Icon, Screen, TopBar, Txt } from '@/components/ui';
import { opponentName, useDuels, type DuelView } from '@/hooks/useDuels';
import { formatMinutes, formatSpan, useT, type StringKey } from '@/i18n';
import { botReplyAt, DUEL_EXPIRY_MS, outcome, total } from '@/lib/duel';
import { modeColors, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

const GROUPS: { status: DuelView['status']; title: StringKey }[] = [
  { status: 'yourTurn', title: 'duel.yourTurn' },
  { status: 'waiting', title: 'duel.waiting' },
  { status: 'finished', title: 'duel.finished' },
];

/** Entrances stop staggering after this many items, so a long list never waits. */
const MAX_STAGGER = 10;

export default function Duels() {
  const { colors } = useTheme();
  const { t } = useT();
  const { views, now, fast, yourTurn } = useDuels();

  const groups = GROUPS.map((g) => ({ ...g, list: views.filter((v) => v.status === g.status) })).filter(
    (g) => g.list.length > 0,
  );
  // Where each group's rows start in the stagger, so the whole page arrives top to bottom.
  const starts = groups.map((_, gi) => groups.slice(0, gi).reduce((n, g) => n + g.list.length, 0));

  return (
    <Screen>
      <TopBar title={t('duel.title')} />

      <PopIn>
        <HeroCard color={modeColors.duel} pattern="rings" watermark="flash">
          <View style={styles.heroTop}>
            <View style={styles.heroIcon}>
              <Icon name="flash" size={22} color={colors.onAccent} />
            </View>
            {yourTurn > 0 && (
              <Badge label={t('duel.yourTurnCount', { n: yourTurn })} bg={colors.onAccent} fg={modeColors.duel} />
            )}
          </View>
          <Txt tone="onAccent">{t('duel.home')}</Txt>
        </HeroCard>
      </PopIn>

      <FadeInUp index={1} style={styles.actions}>
        <Button label={t('duel.new')} icon="flash" onPress={() => router.push('/duel/new')} style={{ flex: 1 }} />
        <Button
          label={t('duel.enterCode')}
          kind="secondary"
          icon="enter-outline"
          onPress={() => router.push('/duel/join')}
          style={{ flex: 1 }}
        />
      </FadeInUp>

      {views.length === 0 && (
        <FadeInUp index={2}>
          <Card style={{ alignItems: 'center' }}>
            <Icon name="flash-outline" size={32} color={colors.textMuted} />
            <Txt tone="muted" center>
              {t('duel.empty')}
            </Txt>
          </Card>
        </FadeInUp>
      )}

      {groups.map(({ status, title, list }, gi) => (
        <View key={status} style={{ gap: space.sm }}>
          <FadeInUp index={Math.min(2 + starts[gi], MAX_STAGGER)} style={styles.groupHead}>
            <Txt variant="tiny" tone="muted">
              {t(title).toUpperCase()}
            </Txt>
            <Badge
              label={String(list.length)}
              bg={status === 'yourTurn' ? colors.primaryStrong : colors.surfaceAlt}
              fg={status === 'yourTurn' ? colors.onAccent : colors.textMuted}
            />
          </FadeInUp>
          {list.map((v, i) => (
            <FadeInUp key={v.duel.id} index={Math.min(3 + starts[gi] + i, MAX_STAGGER)}>
              <DuelRow view={v} now={now} fast={fast} />
            </FadeInUp>
          ))}
        </View>
      ))}
    </Screen>
  );
}

function DuelRow({ view, now, fast }: { view: DuelView; now: number; fast: boolean }) {
  const { colors, cat } = useTheme();
  const { t, lang } = useT();
  const { duel, status, theirs } = view;
  const name = opponentName(duel, lang);
  const topic = t(duel.category === 'mixed' ? 'level.mixed' : (`cat.${duel.category}` as StringKey));
  const topicTint =
    duel.category === 'mixed'
      ? { bg: colors.surfaceAlt, fg: colors.textMuted }
      : { bg: cat[duel.category].soft, fg: cat[duel.category].fg };

  let line: string;
  let tone: 'primary' | 'muted' | 'success' | 'danger' = 'muted';
  if (status === 'yourTurn') {
    tone = 'primary';
    line =
      duel.role === 'challenged'
        ? `${t('duel.challengedYou', { name })} · ${t('duel.expiresIn', { time: formatSpan(lang, duel.createdAt + DUEL_EXPIRY_MS - now) })}`
        : t('duel.playFirst');
  } else if (status === 'waiting') {
    line =
      duel.opponent.kind === 'open'
        ? t('duel.waitingCode')
        : duel.opponent.kind === 'bot'
          ? t('duel.replyIn', { time: formatMinutes(lang, botReplyAt(duel, fast) - now) })
          : t('duel.waitingFor', { name });
  } else {
    const o = outcome(duel.mine!, theirs!);
    tone = o === 'win' ? 'success' : o === 'loss' ? 'danger' : 'muted';
    line = `${o === 'win' ? t('duel.win') : o === 'loss' ? t('duel.loss', { name }) : t('duel.draw')} · ${total(duel.mine)}–${total(theirs)}`;
  }

  return (
    <Card
      onPress={() => router.push({ pathname: '/duel/[id]', params: { id: duel.id } })}
      style={[styles.row, status === 'yourTurn' && { borderColor: colors.primary }]}
    >
      <Avatar name={duel.opponent.kind === 'open' ? '?' : name} />
      <View style={{ flex: 1, gap: 4 }}>
        <View style={styles.nameRow}>
          <Txt variant="bodyStrong" numberOfLines={1} style={{ flexShrink: 1 }}>
            {name}
          </Txt>
          <Badge label={topic} bg={topicTint.bg} fg={topicTint.fg} />
        </View>
        <Txt variant="small" tone={tone} numberOfLines={2} style={{ fontWeight: status === 'waiting' ? '400' : '700' }}>
          {line}
        </Txt>
      </View>
      <Icon name="chevron-forward" color={colors.textMuted} />
    </Card>
  );
}

const styles = StyleSheet.create({
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  heroIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  actions: { flexDirection: 'row', gap: space.sm },
  groupHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
});
