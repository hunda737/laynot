import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Field } from '@/components/Field';
import { Button, Header, Icon, Screen, Txt } from '@/components/ui';
import { useT } from '@/i18n';
import { LEAGUE_NAME_MAX, LEAGUE_NAME_MIN } from '@/lib/league';
import { haptic } from '@/services/haptics';
import { goBack } from '@/services/nav';
import { useGame } from '@/store/useGameStore';
import { radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

export default function NewLeague() {
  const { colors } = useTheme();
  const { t } = useT();
  const createLeague = useGame((s) => s.createLeague);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const create = () => {
    const trimmed = name.trim();
    if (trimmed.length < LEAGUE_NAME_MIN || trimmed.length > LEAGUE_NAME_MAX) return setError(t('league.nameInvalid'));
    haptic.success();
    const league = createLeague(trimmed);
    router.replace({ pathname: '/league/[id]', params: { id: league.id } });
  };

  return (
    <Screen>
      <Header title={t('league.newTitle')} onBack={goBack} />
      <View style={{ alignItems: 'center', gap: space.md, paddingVertical: space.md }}>
        <View style={{ width: 72, height: 72, borderRadius: radius.lg, backgroundColor: colors.sponsorSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="shield" size={36} color={colors.sponsor} />
        </View>
        <Txt tone="muted" center>
          {t('league.newBody')}
        </Txt>
      </View>
      <Field
        label={t('league.nameLabel')}
        value={name}
        onChangeText={(v) => {
          setName(v);
          setError(null);
        }}
        placeholder={t('league.namePlaceholder')}
        maxLength={LEAGUE_NAME_MAX}
        autoCapitalize="words"
        returnKeyType="done"
        onSubmitEditing={create}
        error={error}
      />
      <Button label={t('league.create')} icon="add" onPress={create} />
    </Screen>
  );
}
