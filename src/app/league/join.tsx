import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Field } from '@/components/Field';
import { Button, Header, Icon, Screen, Txt } from '@/components/ui';
import { useT } from '@/i18n';
import { normalizeLinkCode } from '@/lib/codes';
import { decodeLeague } from '@/lib/league';
import { haptic } from '@/services/haptics';
import { goBack } from '@/services/nav';
import { pasteText } from '@/services/share';
import { useGame } from '@/store/useGameStore';
import { radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

/** Paste an invite, or arrive here from an invite link with `?c=` filled in. */
export default function JoinLeague() {
  const { colors } = useTheme();
  const { t } = useT();
  const params = useLocalSearchParams<{ c?: string }>();
  const joinLeague = useGame((s) => s.joinLeague);
  const [text, setText] = useState(() => (params.c ? normalizeLinkCode(params.c) : ''));
  const [error, setError] = useState<string | null>(null);

  const invite = decodeLeague(text);

  const join = () => {
    if (!invite) {
      haptic.error();
      return setError(t('league.badCode'));
    }
    const { league, already } = joinLeague(invite);
    if (already) return setError(t('league.already'));
    haptic.success();
    router.replace({ pathname: '/league/[id]', params: { id: league.id } });
  };

  return (
    <Screen>
      <Header title={t('league.joinTitle')} onBack={goBack} />
      <Txt tone="muted">{t('league.joinBody')}</Txt>
      <Field
        label={t('league.codeLabel')}
        value={text}
        onChangeText={(v) => {
          setText(v);
          setError(null);
        }}
        placeholder="LAYNOT-L:1.…"
        autoCapitalize="none"
        autoCorrect={false}
        multiline
        error={error}
      />
      <Button
        small
        kind="secondary"
        icon="clipboard-outline"
        label={t('league.paste')}
        onPress={async () => {
          const pasted = await pasteText();
          if (pasted) {
            setText(pasted);
            setError(null);
          }
        }}
      />
      {invite && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.md, backgroundColor: colors.sponsorSoft }}>
          <Icon name="shield" color={colors.sponsor} />
          <Txt variant="bodyStrong" style={{ flex: 1 }}>
            {invite.name}
          </Txt>
        </View>
      )}
      <Button label={t('league.joinCta')} icon="enter-outline" onPress={join} disabled={text.trim().length === 0} />
    </Screen>
  );
}
