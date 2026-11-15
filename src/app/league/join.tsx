import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Field } from '@/components/Field';
import { FadeInUp, PopIn, Shake } from '@/components/motion';
import { Button, Card, Icon, Screen, TopBar, Txt } from '@/components/ui';
import { useT } from '@/i18n';
import { normalizeLinkCode } from '@/lib/codes';
import { decodeLeague } from '@/lib/league';
import { haptic } from '@/services/haptics';
import { pasteText } from '@/services/share';
import { useGame } from '@/store/useGameStore';
import { modeColors, radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

/** Paste an invite, or arrive here from an invite link with `?c=` filled in. */
export default function JoinLeague() {
  const { colors } = useTheme();
  const { t } = useT();
  const params = useLocalSearchParams<{ c?: string }>();
  const joinLeague = useGame((s) => s.joinLeague);
  const [text, setText] = useState(() => (params.c ? normalizeLinkCode(params.c) : ''));
  const [error, setError] = useState<string | null>(null);
  // Counts failed attempts, so the field shakes again each time.
  const [fails, setFails] = useState(0);

  const invite = decodeLeague(text);

  const fail = (message: string) => {
    setError(message);
    setFails((n) => n + 1);
  };

  const join = () => {
    if (!invite) {
      haptic.error();
      return fail(t('league.badCode'));
    }
    const { league, already } = joinLeague(invite);
    if (already) return fail(t('league.already'));
    haptic.success();
    router.replace({ pathname: '/league/[id]', params: { id: league.id } });
  };

  return (
    <Screen>
      <TopBar title={t('league.joinTitle')} />
      <View style={styles.intro}>
        <PopIn>
          <View style={[styles.icon, { backgroundColor: modeColors.duel }]}>
            <Icon name="shield" size={36} color={colors.onAccent} />
          </View>
        </PopIn>
        <FadeInUp index={1}>
          <Txt tone="muted" center>
            {t('league.joinBody')}
          </Txt>
        </FadeInUp>
      </View>
      <FadeInUp index={2} style={{ gap: space.md }}>
        <Shake trigger={fails}>
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
        </Shake>
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
      </FadeInUp>
      {invite && (
        <FadeInUp>
          <Card style={styles.preview}>
            <PopIn delay={120}>
              <View style={[styles.previewIcon, { backgroundColor: modeColors.duel }]}>
                <Icon name="shield" size={18} color={colors.onAccent} />
              </View>
            </PopIn>
            <Txt variant="bodyStrong" style={{ flex: 1 }}>
              {invite.name}
            </Txt>
          </Card>
        </FadeInUp>
      )}
      <FadeInUp index={3}>
        <Button label={t('league.joinCta')} icon="enter-outline" onPress={join} disabled={text.trim().length === 0} />
      </FadeInUp>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { alignItems: 'center', gap: space.md, paddingVertical: space.md },
  icon: { width: 72, height: 72, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  preview: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  previewIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
