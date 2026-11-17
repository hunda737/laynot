import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Field } from '@/components/Field';
import { FadeInUp, PopIn, Shake } from '@/components/motion';
import { Button, Card, Icon, Screen, TopBar, Txt } from '@/components/ui';
import { topicKey } from '@/hooks/useDuels';
import { useT } from '@/i18n';
import { normalizeLinkCode } from '@/lib/codes';
import { decodeDuel, total } from '@/lib/duel';
import { haptic } from '@/services/haptics';
import { pasteText } from '@/services/share';
import { useGame } from '@/store/useGameStore';
import { modeColors, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

/** Paste a challenge or a reply. Also opened by a duel link with `?c=`. */
export default function JoinDuel() {
  const { colors } = useTheme();
  const { t } = useT();
  const params = useLocalSearchParams<{ c?: string }>();
  const enterDuelCode = useGame((s) => s.enterDuelCode);
  const [text, setText] = useState(() => (params.c ? normalizeLinkCode(params.c) : ''));
  const [error, setError] = useState<string | null>(null);
  // Counts failed attempts, so the field shakes again each time.
  const [fails, setFails] = useState(0);

  const code = decodeDuel(text);
  const reply = code?.kind === 'reply';

  const fail = (message: string) => {
    setError(message);
    setFails((n) => n + 1);
  };

  const open = () => {
    if (!code) {
      haptic.error();
      return fail(t('duel.badCode'));
    }
    const { result, id } = enterDuelCode(code);
    if (result === 'own') return fail(t('duel.own'));
    if (result === 'already') return fail(t('duel.already'));
    if (result === 'unknownReply') return fail(t('duel.unknownReply'));
    haptic.success();
    router.replace({ pathname: '/duel/[id]', params: { id } });
  };

  return (
    <Screen>
      <TopBar title={t('duel.joinTitle')} />
      <FadeInUp index={0}>
        <Txt tone="muted">{t('duel.joinBody')}</Txt>
      </FadeInUp>
      <FadeInUp index={1} style={{ gap: space.md }}>
        <Shake trigger={fails}>
          <Field
            label={t('duel.codeLabel')}
            value={text}
            onChangeText={(v) => {
              setText(v);
              setError(null);
            }}
            placeholder="LAYNOT:1.…"
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
      {code && (
        <FadeInUp>
          <Card style={styles.preview}>
            <Avatar name={code.name} />
            <Txt variant="bodyStrong" style={{ flex: 1 }}>
              {reply
                ? t('duel.previewReply', { name: code.name, score: total(code.answers) })
                : t('duel.previewChallenge', { name: code.name, topic: t(topicKey(code.category)), score: total(code.answers) })}
            </Txt>
            <PopIn delay={120}>
              <View style={[styles.previewIcon, { backgroundColor: modeColors.duel }]}>
                <Icon name="flash" size={16} color={colors.onAccent} />
              </View>
            </PopIn>
          </Card>
        </FadeInUp>
      )}
      <FadeInUp index={2}>
        <Button label={t('duel.accept')} icon="flash" onPress={open} disabled={text.trim().length === 0} />
      </FadeInUp>
    </Screen>
  );
}

const styles = StyleSheet.create({
  preview: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  previewIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
