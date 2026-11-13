import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Brand } from '@/components/Brand';
import { Button, Icon, Screen, Txt } from '@/components/ui';
import { useT } from '@/i18n';
import { dailyQuestions } from '@/lib/daily';
import { randInt, seeded } from '@/lib/rng';
import { todayKey, useGame } from '@/store/useGameStore';
import { radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

export default function Welcome() {
  const { colors } = useTheme();
  const { t, L } = useT();
  const markOnboarded = useGame((s) => s.markOnboarded);

  const teaser = useMemo(() => {
    const day = todayKey();
    const first = dailyQuestions(day)[0].question;
    return { text: first.text, wrong: randInt(seeded(`street:${day}`), 52, 78) };
  }, []);

  const play = () => {
    markOnboarded();
    router.replace('/daily/play');
  };
  const skip = () => {
    markOnboarded();
    router.replace('/home');
  };

  return (
    <Screen scroll={false} edges={['top', 'bottom', 'left', 'right']} contentStyle={styles.root}>
      <View style={{ gap: space.xl }}>
        <Brand />
        <View style={{ gap: space.md }}>
          <Txt variant="tiny" tone="primary">
            {t('welcome.kicker').toUpperCase()}
          </Txt>
          <Txt variant="hero">{t('welcome.title')}</Txt>
          <Txt tone="muted">{t('welcome.body')}</Txt>
        </View>

        <View style={[styles.street, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.mic, { backgroundColor: colors.primarySoft }]}>
            <Icon name="mic" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Txt variant="bodyStrong" numberOfLines={2}>
              “{L(teaser.text)}”
            </Txt>
            <Txt variant="small" tone="danger" style={{ fontWeight: '700' }}>
              {t('welcome.streetStat', { n: teaser.wrong })}
            </Txt>
          </View>
        </View>
      </View>

      <View style={{ gap: space.md }}>
        <Button label={t('welcome.cta')} icon="play" onPress={play} />
        <Txt variant="small" tone="muted" center>
          {t('welcome.noSignup')}
        </Txt>
        <Pressable onPress={skip} hitSlop={8} accessibilityRole="button">
          <Txt variant="small" tone="primary" center style={{ fontWeight: '700' }}>
            {t('welcome.skip')}
          </Txt>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: { justifyContent: 'space-between', paddingTop: space.xxl },
  street: {
    flexDirection: 'row',
    gap: space.md,
    alignItems: 'center',
    padding: space.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  mic: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
