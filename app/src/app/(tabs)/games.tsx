import { StyleSheet, View } from 'react-native';

import { GAME_CARDS } from '@/components/games/catalog';
import { FadeInUp } from '@/components/motion';
import { CoinChip, Hearts } from '@/components/status';
import { Badge, Button, Card, HeroCard, Icon, ProgressBar, Screen, Txt } from '@/components/ui';
import { useNow } from '@/hooks/useNow';
import { useOpenGame } from '@/hooks/useOpenGame';
import { useT } from '@/i18n';
import { dayKey } from '@/lib/clock';
import { gamesDayPoints, GAMES_DAILY_CAP } from '@/lib/games/common';
import { useGame } from '@/store/useGameStore';
import { modeColors, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

export default function Games() {
  const { colors } = useTheme();
  const { t } = useT();
  const today = dayKey(useNow());
  const results = useGame((s) => s.gameResults[today]);
  const open = useOpenGame();
  const counted = gamesDayPoints(results);

  return (
    <Screen tabBarInset>
      <FadeInUp index={0} style={styles.top}>
        <View style={{ flex: 1 }}>
          <Txt variant="hero">{t('games.title')}</Txt>
          <Txt variant="small" tone="muted">
            {t('games.subtitle')}
          </Txt>
        </View>
        <CoinChip />
      </FadeInUp>

      <FadeInUp index={1}>
        <Card style={{ gap: space.md }}>
          <View style={styles.row}>
            <Txt variant="tiny" tone="muted" style={{ flex: 1 }}>
              {t('games.todayPoints').toUpperCase()}
            </Txt>
            <Hearts size="sm" />
          </View>
          <View style={styles.row}>
            <ProgressBar value={counted} max={GAMES_DAILY_CAP} color={colors.gold} style={{ flex: 1 }} />
            <Txt variant="bodyStrong" style={{ fontVariant: ['tabular-nums'] }}>
              {counted}/{GAMES_DAILY_CAP}
            </Txt>
          </View>
          <Txt variant="small" tone="muted">
            {t('games.rules')}
          </Txt>
        </Card>
      </FadeInUp>

      {GAME_CARDS.map((card, i) => {
        const color = modeColors[card.kind];
        const done = card.ids.filter((x) => results?.[x.id]);
        const allDone = done.length === card.ids.length;
        return (
          <FadeInUp key={card.kind} index={i + 2}>
            <HeroCard color={color} pattern="rings" watermark={card.icon}>
              <View style={styles.cardTop}>
                <Icon name={card.icon} size={24} color={colors.onAccent} />
                <Txt variant="heading" tone="onAccent" style={{ flex: 1 }}>
                  {t(card.title)}
                </Txt>
              </View>
              <Txt variant="small" tone="onAccent" style={{ opacity: 0.9 }}>
                {t(card.body)}
              </Txt>
              {done.length > 0 && (
                <View style={styles.badges}>
                  {done.map((x) => (
                    <Badge
                      key={x.id}
                      icon="checkmark-circle"
                      label={`${x.label ? `${x.label} · ` : ''}${t('games.donePoints', { n: results?.[x.id]?.points ?? 0 })}`}
                      bg={colors.onAccent}
                      fg={color}
                    />
                  ))}
                </View>
              )}
              <View style={styles.buttons}>
                <Button
                  small
                  kind="ink"
                  icon={allDone ? 'eye' : 'calendar'}
                  label={allDone ? t('games.seeDaily') : t('games.playDaily')}
                  onPress={() => open.daily(card.kind)}
                  style={{ flex: 1 }}
                />
                <Button
                  small
                  kind="inverse"
                  icon="heart"
                  label={t('games.practice')}
                  onPress={() => open.practice(card.kind)}
                  style={{ flex: 1 }}
                />
              </View>
            </HeroCard>
          </FadeInUp>
        );
      })}

      {open.sheet}
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  buttons: { flexDirection: 'row', gap: space.sm, marginTop: space.sm },
});
