import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { FadeInUp, Pulse } from '@/components/motion';
import { Badge, Card, Icon, Screen, TopBar, Txt } from '@/components/ui';
import { STREET_EPISODES } from '@/data/street';
import { formatDay, useT } from '@/i18n';
import { useGame } from '@/store/useGameStore';
import { space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

/** Cards past this one arrive together, so a long list does not keep the reader waiting. */
const MAX_STAGGER = 10;

export default function Street() {
  const { colors } = useTheme();
  const { t, L, lang } = useT();
  const results = useGame((s) => s.streetResults);

  const episodes = [...STREET_EPISODES].sort((a, b) => b.posted.localeCompare(a.posted));

  return (
    <Screen>
      <TopBar title={t('street.title')} />
      <FadeInUp>
        <Txt tone="muted">{t('street.body')}</Txt>
      </FadeInUp>

      {episodes.map((ep, i) => {
        const r = results[ep.id];
        return (
          <FadeInUp key={ep.id} index={Math.min(i + 1, MAX_STAGGER)}>
            <Card
              onPress={() => router.push({ pathname: '/street/[episode]', params: { episode: ep.id } })}
              style={styles.card}
            >
              <View style={[styles.thumb, { backgroundColor: ep.color }]}>
                <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
                  <View style={[styles.shape, styles.shapeA]} />
                  <View style={[styles.shape, styles.shapeB]} />
                  <View style={[styles.shape, styles.shapeC]} />
                  <View style={styles.watermark}>
                    <Icon name="mic" size={96} color="rgba(255,255,255,0.16)" />
                  </View>
                </View>
                {/* The play button breathes on episodes not played yet. */}
                <Pulse active={!r} to={1.08}>
                  <View style={[styles.play, { backgroundColor: colors.onAccent }]}>
                    <Icon name="play" size={26} color={ep.color} />
                  </View>
                </Pulse>
                <View style={styles.topLeft}>
                  {!r && <Badge label={t('street.new').toUpperCase()} bg={colors.onAccent} fg={ep.color} />}
                </View>
                <View style={styles.bottomRight}>
                  <Badge label={ep.duration} icon="time-outline" bg={colors.overlay} fg={colors.onAccent} />
                </View>
              </View>
              <View style={styles.body}>
                <Txt variant="heading">{L(ep.title)}</Txt>
                <View style={styles.meta}>
                  <Icon name="location" size={14} color={colors.textMuted} />
                  <Txt variant="small" tone="muted" style={{ flex: 1 }} numberOfLines={1}>
                    {L(ep.location)} · {formatDay(lang, ep.posted)}
                  </Txt>
                </View>
                <View style={styles.meta}>
                  <Icon name="people" size={14} color={colors.textMuted} />
                  <Txt variant="small" tone="muted" style={{ flex: 1 }} numberOfLines={1}>
                    {t('street.asked', { n: ep.peopleAsked })}
                  </Txt>
                  {r && (
                    <Badge
                      label={t('street.you', { n: r.correct, total: r.total })}
                      icon="checkmark-circle"
                      bg={colors.successSoft}
                      fg={colors.success}
                    />
                  )}
                </View>
              </View>
            </Card>
          </FadeInUp>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { padding: 0, overflow: 'hidden', gap: 0 },
  thumb: { height: 132, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  shape: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.12)' },
  shapeA: { width: 170, height: 170, borderRadius: 85, top: -80, right: -40 },
  shapeB: { width: 110, height: 110, borderRadius: 55, bottom: -52, right: 84 },
  shapeC: { width: 56, height: 56, borderRadius: 28, top: 20, right: 116 },
  watermark: { position: 'absolute', left: -18, bottom: -22 },
  play: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', paddingLeft: 3 },
  topLeft: { position: 'absolute', left: space.md, top: space.md },
  bottomRight: { position: 'absolute', right: space.md, bottom: space.md },
  body: { padding: space.lg, gap: 6 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
