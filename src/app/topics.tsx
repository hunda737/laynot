import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { DifficultyPicker } from '@/components/difficulty';
import { OutOfLivesSheet } from '@/components/OutOfLivesSheet';
import { CoinsPill, LivesPill } from '@/components/status';
import { Card, Header, Icon, Screen, Txt, type IconName } from '@/components/ui';
import { SponsorStrip } from '@/components/SponsorStrip';
import { CATEGORIES, type CategoryId } from '@/data/questions';
import { sponsoredCategory } from '@/data/sponsors';
import { useToday } from '@/hooks/useNow';
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
  const flash = useGame((s) => s.flashStats);
  const level = useGame((s) => s.topicLevel);
  const setLevel = useGame((s) => s.setTopicLevel);
  const missedCount = useGame((s) => s.missed.length);
  const [outOfLives, setOutOfLives] = useState(false);
  /** The category tapped while out of lives, opened once a life comes back. */
  const [pending, setPending] = useState<CategoryId | null>(null);
  const presented = sponsoredCategory(useToday());

  const open = (id: CategoryId) => {
    if (lives > 0) return router.push({ pathname: '/topics/[category]', params: { category: id } });
    setPending(id);
    setOutOfLives(true);
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

      <View style={{ gap: 6 }}>
        <DifficultyPicker value={level} onChange={setLevel} />
        <Txt variant="small" tone="muted">
          {t('level.coins')}
        </Txt>
      </View>

      <View style={styles.grid}>
        {CATEGORIES.map((c) => {
          const s = stats[c.id];
          const sponsored = presented.category === c.id;
          return (
            <Card key={c.id} onPress={() => open(c.id)} style={[styles.tile, sponsored && { borderColor: presented.sponsor.color }]}>
              <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}>
                <Icon name={c.icon as IconName} size={24} color={colors.primary} />
              </View>
              <Txt variant="bodyStrong">{t(`cat.${c.id}` as StringKey)}</Txt>
              <Txt variant="small" tone={s ? 'success' : 'muted'}>
                {s ? t('topics.best', { n: s.best }) : t('topics.new')}
              </Txt>
              {sponsored && <SponsorStrip sponsor={presented.sponsor} compact />}
            </Card>
          );
        })}
        <Card onPress={() => router.push('/flashcards')} style={[styles.tile, { borderColor: colors.sponsor }]}>
          <View style={[styles.icon, { backgroundColor: colors.sponsorSoft }]}>
            <Icon name="albums" size={24} color={colors.sponsor} />
          </View>
          <Txt variant="bodyStrong">{t('flash.title')}</Txt>
          <Txt variant="small" tone={flash.rounds > 0 ? 'success' : 'muted'}>
            {flash.rounds > 0
              ? t('flash.stats', { n: Math.round((100 * flash.known) / Math.max(flash.seen, 1)), rounds: flash.rounds })
              : `${t('flash.tile')} · ${t('lives.noLivesNeeded')}`}
          </Txt>
        </Card>
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
        onClose={() => {
          setOutOfLives(false);
          setPending(null);
        }}
        onLifeGained={() => {
          setOutOfLives(false);
          setPending(null);
          if (pending) router.push({ pathname: '/topics/[category]', params: { category: pending } });
        }}
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
