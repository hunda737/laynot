import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button, Card, Header, Icon, Screen, Txt } from '@/components/ui';
import { opponentName, useDuels, type DuelView } from '@/hooks/useDuels';
import { formatMinutes, formatSpan, useT, type StringKey } from '@/i18n';
import { botReplyAt, DUEL_EXPIRY_MS, outcome, total } from '@/lib/duel';
import { goBack } from '@/services/nav';
import { space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

const GROUPS: { status: DuelView['status']; title: StringKey }[] = [
  { status: 'yourTurn', title: 'duel.yourTurn' },
  { status: 'waiting', title: 'duel.waiting' },
  { status: 'finished', title: 'duel.finished' },
];

export default function Duels() {
  const { colors } = useTheme();
  const { t } = useT();
  const { views, now, fast } = useDuels();

  return (
    <Screen>
      <Header title={t('duel.title')} onBack={goBack} />
      <Txt tone="muted">{t('duel.home')}</Txt>
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <Button label={t('duel.new')} icon="flash" onPress={() => router.push('/duel/new')} style={{ flex: 1 }} />
        <Button label={t('duel.enterCode')} kind="secondary" icon="enter-outline" onPress={() => router.push('/duel/join')} style={{ flex: 1 }} />
      </View>

      {views.length === 0 && (
        <Card style={{ alignItems: 'center' }}>
          <Icon name="flash-outline" size={32} color={colors.textMuted} />
          <Txt tone="muted" center>
            {t('duel.empty')}
          </Txt>
        </Card>
      )}

      {GROUPS.map(({ status, title }) => {
        const list = views.filter((v) => v.status === status);
        if (list.length === 0) return null;
        return (
          <View key={status} style={{ gap: space.sm }}>
            <Txt variant="tiny" tone="muted">
              {t(title).toUpperCase()} · {list.length}
            </Txt>
            {list.map((v) => (
              <DuelRow key={v.duel.id} view={v} now={now} fast={fast} />
            ))}
          </View>
        );
      })}
    </Screen>
  );
}

function DuelRow({ view, now, fast }: { view: DuelView; now: number; fast: boolean }) {
  const { colors } = useTheme();
  const { t, lang } = useT();
  const { duel, status, theirs } = view;
  const name = opponentName(duel, lang);
  const topic = t(duel.category === 'mixed' ? 'level.mixed' : (`cat.${duel.category}` as StringKey));

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
      <View style={{ flex: 1, gap: 2 }}>
        <Txt variant="bodyStrong" numberOfLines={1}>
          {name} · {topic}
        </Txt>
        <Txt variant="small" tone={tone} numberOfLines={2} style={{ fontWeight: status === 'waiting' ? '400' : '700' }}>
          {line}
        </Txt>
      </View>
      <Icon name="chevron-forward" color={colors.textMuted} />
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
});
