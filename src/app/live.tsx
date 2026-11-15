import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Field } from '@/components/Field';
import { FadeInUp, PopIn, Shake } from '@/components/motion';
import { Badge, Button, Card, HeroCard, Icon, Screen, TopBar, Txt, type IconName } from '@/components/ui';
import { useT } from '@/i18n';
import { isRoomCode, newRoomCode } from '@/lib/live';
import { useGame } from '@/store/useGameStore';
import { modeColors, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

export default function LiveHome() {
  const { colors } = useTheme();
  const { t } = useT();
  const stats = useGame((s) => s.liveStats);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  // Counts failed attempts, so the field shakes again each time.
  const [fails, setFails] = useState(0);

  const join = () => {
    if (!isRoomCode(code)) {
      setFails((n) => n + 1);
      return setError(t('live.badCode'));
    }
    router.push({ pathname: '/live/[code]', params: { code, mode: 'join' } });
  };

  return (
    <Screen>
      <TopBar title={t('live.title')} />
      <PopIn>
        <HeroCard color={modeColors.live} align="center" pattern="rings">
          <View style={styles.heroIcon}>
            <Icon name="people" size={30} color={colors.onAccent} />
          </View>
          <Txt tone="onAccent" center>
            {t('live.home')}
          </Txt>
          {stats.played > 0 && (
            <View style={{ marginTop: space.xs }}>
              <Badge
                icon="trophy"
                label={t('live.stats', { played: stats.played, wins: stats.wins })}
                bg="rgba(255,255,255,0.2)"
                fg={colors.onAccent}
              />
            </View>
          )}
        </HeroCard>
      </PopIn>

      <FadeInUp index={1}>
        <Card>
          <CardHead icon="radio" title={t('live.host')} body={t('live.hostBody')} />
          <Button
            label={t('live.host')}
            icon="radio"
            onPress={() => router.push({ pathname: '/live/[code]', params: { code: newRoomCode(), mode: 'host' } })}
          />
        </Card>
      </FadeInUp>

      <FadeInUp index={2}>
        <Card>
          <CardHead icon="keypad" title={t('live.join')} />
          <Shake trigger={fails}>
            <Field
              label={t('live.joinBody')}
              value={code}
              onChangeText={(v) => {
                setCode(v.replace(/\D/g, '').slice(0, 4));
                setError(null);
              }}
              placeholder="0000"
              keyboardType="number-pad"
              maxLength={4}
              onSubmitEditing={join}
              error={error}
              style={{ letterSpacing: 8, textAlign: 'center', fontSize: 22 }}
            />
          </Shake>
          <Button label={t('live.joinCta')} kind="secondary" icon="enter-outline" onPress={join} disabled={code.length !== 4} />
        </Card>
      </FadeInUp>

      <FadeInUp index={3}>
        <Txt variant="small" tone="muted" center>
          {t('live.demoNote')}
        </Txt>
      </FadeInUp>
    </Screen>
  );
}

function CardHead({ icon, title, body }: { icon: IconName; title: string; body?: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.cardHead}>
      <View style={[styles.cardIcon, { backgroundColor: modeColors.live }]}>
        <Icon name={icon} size={18} color={colors.onAccent} />
      </View>
      <View style={{ flex: 1 }}>
        <Txt variant="heading">{title}</Txt>
        {body ? (
          <Txt variant="small" tone="muted">
            {body}
          </Txt>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  cardIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
