import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Field } from '@/components/Field';
import { Button, Card, Header, Icon, Screen, Txt } from '@/components/ui';
import { useT } from '@/i18n';
import { isRoomCode, newRoomCode } from '@/lib/live';
import { goBack } from '@/services/nav';
import { useGame } from '@/store/useGameStore';
import { radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

export default function LiveHome() {
  const { colors } = useTheme();
  const { t } = useT();
  const stats = useGame((s) => s.liveStats);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const join = () => {
    if (!isRoomCode(code)) return setError(t('live.badCode'));
    router.push({ pathname: '/live/[code]', params: { code, mode: 'join' } });
  };

  return (
    <Screen>
      <Header title={t('live.title')} onBack={goBack} />
      <View style={[styles.hero, { backgroundColor: colors.sponsorStrong }]}>
        <Icon name="people" size={36} color="#FFFFFF" />
        <Txt center style={{ color: '#FFFFFF' }}>
          {t('live.home')}
        </Txt>
        {stats.played > 0 && (
          <Txt variant="small" center style={{ color: '#FFFFFF', opacity: 0.85 }}>
            {t('live.stats', { played: stats.played, wins: stats.wins })}
          </Txt>
        )}
      </View>

      <Card>
        <Txt variant="heading">{t('live.host')}</Txt>
        <Txt variant="small" tone="muted">
          {t('live.hostBody')}
        </Txt>
        <Button
          label={t('live.host')}
          icon="radio"
          onPress={() => router.push({ pathname: '/live/[code]', params: { code: newRoomCode(), mode: 'host' } })}
        />
      </Card>

      <Card>
        <Txt variant="heading">{t('live.join')}</Txt>
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
        <Button label={t('live.joinCta')} kind="secondary" icon="enter-outline" onPress={join} disabled={code.length !== 4} />
      </Card>

      <Txt variant="small" tone="muted" center>
        {t('live.demoNote')}
      </Txt>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: radius.lg, padding: space.xl, alignItems: 'center', gap: space.sm },
});
