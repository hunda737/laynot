import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Field } from '@/components/Field';
import { FadeInUp, PopIn, Shake } from '@/components/motion';
import { Button, Icon, Screen, TopBar, Txt } from '@/components/ui';
import { useT } from '@/i18n';
import { LEAGUE_NAME_MAX, LEAGUE_NAME_MIN } from '@/lib/league';
import { haptic } from '@/services/haptics';
import { useGame } from '@/store/useGameStore';
import { modeColors, radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

export default function NewLeague() {
  const { colors } = useTheme();
  const { t } = useT();
  const createLeague = useGame((s) => s.createLeague);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  // Counts failed attempts, so the field shakes again each time.
  const [fails, setFails] = useState(0);

  const create = () => {
    const trimmed = name.trim();
    if (trimmed.length < LEAGUE_NAME_MIN || trimmed.length > LEAGUE_NAME_MAX) {
      setFails((n) => n + 1);
      return setError(t('league.nameInvalid'));
    }
    haptic.success();
    const league = createLeague(trimmed);
    router.replace({ pathname: '/league/[id]', params: { id: league.id } });
  };

  return (
    <Screen>
      <TopBar title={t('league.newTitle')} />
      <View style={styles.intro}>
        <PopIn>
          <View style={[styles.icon, { backgroundColor: modeColors.duel }]}>
            <Icon name="shield" size={36} color={colors.onAccent} />
          </View>
        </PopIn>
        <FadeInUp index={1}>
          <Txt tone="muted" center>
            {t('league.newBody')}
          </Txt>
        </FadeInUp>
      </View>
      <FadeInUp index={2}>
        <Shake trigger={fails}>
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
        </Shake>
      </FadeInUp>
      <FadeInUp index={3}>
        <Button label={t('league.create')} icon="add" onPress={create} />
      </FadeInUp>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { alignItems: 'center', gap: space.md, paddingVertical: space.md },
  icon: { width: 72, height: 72, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
});
