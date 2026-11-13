import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { OutOfLivesSheet } from '@/components/OutOfLivesSheet';
import { CoinsPill, LivesPill } from '@/components/status';
import { Card, Header, Icon, Screen, Txt, type IconName } from '@/components/ui';
import { CATEGORIES, type CategoryId } from '@/data/questions';
import { useLives } from '@/hooks/useEconomy';
import { useT, type StringKey } from '@/i18n';
import { goBack } from '@/services/nav';
import { useGame } from '@/store/useGameStore';
import { radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

export default function Topics() {
  const { colors } = useTheme();
  const { t } = useT();
  const { lives } = useLives();
  const stats = useGame((s) => s.topicStats);
  const missedCount = useGame((s) => s.missed.length);
  const [outOfLives, setOutOfLives] = useState(false);

  const open = (id: CategoryId) => {
    if (lives <= 0) setOutOfLives(true);
    else router.push({ pathname: '/topics/[category]', params: { category: id } });
  };

  return (
    <Screen>
      <Header
        title={t('topics.title')}
        onBack={goBack}
        right={
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <LivesPill onPress={lives <= 0 ? () => setOutOfLives(true) : undefined} />
            <CoinsPill />
          </View>
        }
      />
      <Txt tone="muted">{t('topics.body')}</Txt>

      <View style={styles.grid}>
        {CATEGORIES.map((c) => {
          const s = stats[c.id];
          return (
            <Card key={c.id} onPress={() => open(c.id)} style={styles.tile}>
              <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}>
                <Icon name={c.icon as IconName} size={24} color={colors.primary} />
              </View>
              <Txt variant="bodyStrong">{t(`cat.${c.id}` as StringKey)}</Txt>
              <Txt variant="small" tone={s ? 'success' : 'muted'}>
                {s ? t('topics.best', { n: s.best }) : t('topics.new')}
              </Txt>
            </Card>
          );
        })}
      </View>

      {missedCount > 0 && (
        <Card onPress={() => router.push('/review')} style={styles.row}>
          <Icon name="refresh" color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Txt variant="bodyStrong">{t('review.title')}</Txt>
            <Txt variant="small" tone="muted">
              {t('review.count', { n: missedCount })}
            </Txt>
          </View>
          <Icon name="chevron-forward" color={colors.textMuted} />
        </Card>
      )}

      <OutOfLivesSheet
        visible={outOfLives}
        onClose={() => setOutOfLives(false)}
        onLifeGained={() => setOutOfLives(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  tile: { flexBasis: '46%', flexGrow: 1, gap: space.sm },
  icon: { width: 46, height: 46, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
});
