import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Field } from '@/components/Field';
import { Button, Header, Screen, Txt } from '@/components/ui';
import { topicKey } from '@/hooks/useDuels';
import { useT } from '@/i18n';
import { normalizeLinkCode } from '@/lib/codes';
import { decodeDuel, total } from '@/lib/duel';
import { haptic } from '@/services/haptics';
import { goBack } from '@/services/nav';
import { pasteText } from '@/services/share';
import { useGame } from '@/store/useGameStore';
import { radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

/** Paste a challenge or a reply. Also opened by a duel link with `?c=`. */
export default function JoinDuel() {
  const { colors } = useTheme();
  const { t } = useT();
  const params = useLocalSearchParams<{ c?: string }>();
  const enterDuelCode = useGame((s) => s.enterDuelCode);
  const [text, setText] = useState(() => (params.c ? normalizeLinkCode(params.c) : ''));
  const [error, setError] = useState<string | null>(null);

  const code = decodeDuel(text);
  const reply = code?.kind === 'reply';

  const open = () => {
    if (!code) {
      haptic.error();
      return setError(t('duel.badCode'));
    }
    const { result, id } = enterDuelCode(code);
    if (result === 'own') return setError(t('duel.own'));
    if (result === 'already') return setError(t('duel.already'));
    if (result === 'unknownReply') return setError(t('duel.unknownReply'));
    haptic.success();
    router.replace({ pathname: '/duel/[id]', params: { id } });
  };

  return (
    <Screen>
      <Header title={t('duel.joinTitle')} onBack={goBack} />
      <Txt tone="muted">{t('duel.joinBody')}</Txt>
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
      {code && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.md, backgroundColor: colors.primarySoft }}>
          <Avatar name={code.name} />
          <Txt variant="bodyStrong" style={{ flex: 1 }}>
            {reply
              ? t('duel.previewReply', { name: code.name, score: total(code.answers) })
              : t('duel.previewChallenge', { name: code.name, topic: t(topicKey(code.category)), score: total(code.answers) })}
          </Txt>
        </View>
      )}
      <Button label={t('duel.accept')} icon="flash" onPress={open} disabled={text.trim().length === 0} />
    </Screen>
  );
}
