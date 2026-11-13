import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Card, Header, Icon, Screen, Txt } from '@/components/ui';
import { STREET_EPISODES } from '@/data/street';
import { formatDay, useT } from '@/i18n';
import { goBack } from '@/services/nav';
import { useGame } from '@/store/useGameStore';
import { radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

export default function Street() {
  const { colors } = useTheme();
  const { t, L, lang } = useT();
  const results = useGame((s) => s.streetResults);

  const episodes = [...STREET_EPISODES].sort((a, b) => b.posted.localeCompare(a.posted));

  return (
    <Screen>
      <Header title={t('street.title')} onBack={goBack} />
      <Txt tone="muted">{t('street.body')}</Txt>

      {episodes.map((ep) => {
        const r = results[ep.id];
        return (
          <Card
            key={ep.id}
            onPress={() => router.push({ pathname: '/street/[episode]', params: { episode: ep.id } })}
            style={{ padding: 0, overflow: 'hidden', gap: 0 }}
          >
            <View style={[styles.thumb, { backgroundColor: ep.color }]}>
              <View style={styles.play}>
                <Icon name="play" size={26} color={ep.color} />
              </View>
              <View style={styles.duration}>
                <Txt variant="tiny" style={{ color: '#FFFFFF' }}>
                  {ep.duration}
                </Txt>
              </View>
              {!r && (
                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                  <Txt variant="tiny" tone="onPrimary">
                    {t('street.new').toUpperCase()}
                  </Txt>
                </View>
              )}
            </View>
            <View style={styles.body}>
              <Txt variant="heading">{L(ep.title)}</Txt>
              <View style={styles.meta}>
                <Icon name="location" size={14} color={colors.textMuted} />
                <Txt variant="small" tone="muted">
                  {L(ep.location)} · {formatDay(lang, ep.posted)}
                </Txt>
              </View>
              <View style={styles.meta}>
                <Icon name="people" size={14} color={colors.textMuted} />
                <Txt variant="small" tone="muted" style={{ flex: 1 }}>
                  {t('street.asked', { n: ep.peopleAsked })}
                </Txt>
                {r && (
                  <Txt variant="small" tone="success" style={{ fontWeight: '800' }}>
                    {t('street.you', { n: r.correct, total: r.total })}
                  </Txt>
                )}
              </View>
            </View>
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  thumb: { height: 120, alignItems: 'center', justifyContent: 'center' },
  play: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 3,
  },
  duration: {
    position: 'absolute',
    right: space.sm,
    bottom: space.sm,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  badge: { position: 'absolute', left: space.sm, top: space.sm, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.pill },
  body: { padding: space.lg, gap: 6 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
