import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { FadeInUp, PressableScale, Shake } from '@/components/motion';
import { Button, Icon, Screen, TopBar, Txt } from '@/components/ui';
import { useT } from '@/i18n';
import { haptic } from '@/services/haptics';
import { telegramDisplayName } from '@/services/telegram';
import { useGame } from '@/store/useGameStore';
import { radius, space, type as typeScale } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

const DEMO_CODE = '1234';
// Ethio telecom numbers start with 9, Safaricom Ethiopia with 7.
const PHONE_RE = /^[79]\d{8}$/;

type FieldId = 'name' | 'phone' | 'code';

export default function Signup() {
  const { colors } = useTheme();
  const { t } = useT();
  const signUp = useGame((s) => s.signUp);

  const [step, setStep] = useState<'details' | 'code'>('details');
  // Inside Telegram, start from the player's Telegram name.
  const [name, setName] = useState(() => telegramDisplayName());
  const [phone, setPhone] = useState('');
  const [adult, setAdult] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  // Which box the error belongs to, and how many times each has been refused (each refusal shakes it).
  const [bad, setBad] = useState<FieldId | null>(null);
  const [refused, setRefused] = useState<Record<FieldId, number>>({ name: 0, phone: 0, code: 0 });

  const close = () => (router.canGoBack() ? router.back() : router.replace('/home'));

  const refuse = (field: FieldId, message: string) => {
    setBad(field);
    setRefused((r) => ({ ...r, [field]: r[field] + 1 }));
    setError(message);
  };

  const sendCode = () => {
    if (name.trim().length < 2) return refuse('name', t('signup.invalidName'));
    if (!PHONE_RE.test(phone)) return refuse('phone', t('signup.invalidPhone'));
    setError(null);
    setBad(null);
    setSending(true);
    // Pretend to call an SMS service.
    setTimeout(() => {
      setSending(false);
      setStep('code');
    }, 700);
  };

  const verify = () => {
    if (code !== DEMO_CODE) {
      haptic.error();
      return refuse('code', t('signup.wrongCode'));
    }
    haptic.success();
    signUp({ name: name.trim(), phone, adult });
    close();
  };

  const inputStyle = (field: FieldId) => [
    styles.input,
    typeScale.bodyStrong,
    { color: colors.text, backgroundColor: colors.surface, borderColor: bad === field ? colors.danger : colors.border },
  ];

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <TopBar
        title={step === 'details' ? t('signup.title') : t('signup.codeTitle')}
        onLeft={step === 'code' ? () => setStep('details') : close}
      />

      {step === 'details' ? (
        <FadeInUp key="details" style={styles.step}>
          <Txt tone="muted">{t('signup.body')}</Txt>
          <View style={{ gap: space.sm }}>
            <Txt variant="small" style={{ fontWeight: '700' }}>
              {t('signup.name')}
            </Txt>
            <Shake trigger={refused.name}>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder={t('signup.namePlaceholder')}
                placeholderTextColor={colors.textMuted}
                style={inputStyle('name')}
                autoCapitalize="words"
                maxLength={24}
              />
            </Shake>
          </View>
          <View style={{ gap: space.sm }}>
            <Txt variant="small" style={{ fontWeight: '700' }}>
              {t('signup.phone')}
            </Txt>
            <Shake trigger={refused.phone} style={{ flexDirection: 'row', gap: space.sm }}>
              <View style={[styles.prefix, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                <Txt variant="bodyStrong">🇪🇹 +251</Txt>
              </View>
              <TextInput
                value={phone}
                onChangeText={(v) => setPhone(v.replace(/\D/g, '').slice(0, 9))}
                placeholder="9XXXXXXXX"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                style={[inputStyle('phone'), { flex: 1 }]}
              />
            </Shake>
            <Txt variant="small" tone="muted">
              {t('signup.phoneHint')}
            </Txt>
          </View>
          <PressableScale
            onPress={() => setAdult((v) => !v)}
            style={styles.check}
            scaleTo={0.98}
            hitSlop={6}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: adult }}
          >
            <View
              style={[
                styles.box,
                { borderColor: adult ? colors.primary : colors.border, backgroundColor: adult ? colors.primary : 'transparent' },
              ]}
            >
              {adult && <Icon name="checkmark" size={16} color={colors.onPrimary} />}
            </View>
            <Txt variant="small" style={{ flex: 1 }}>
              {t('signup.age')}
            </Txt>
          </PressableScale>
          {error && <Txt tone="danger">{error}</Txt>}
          <Button label={t('signup.sendCode')} onPress={sendCode} loading={sending} />
        </FadeInUp>
      ) : (
        <FadeInUp key="code" style={styles.step}>
          <Txt tone="muted">{t('signup.codeBody', { phone: `+251 ${phone}` })}</Txt>
          <Shake trigger={refused.code}>
            <TextInput
              value={code}
              onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 4))}
              keyboardType="number-pad"
              placeholder="••••"
              placeholderTextColor={colors.textMuted}
              style={[inputStyle('code'), styles.code]}
              autoFocus
            />
          </Shake>
          <View style={[styles.demoNote, { backgroundColor: colors.surfaceAlt }]}>
            <Icon name="information-circle" color={colors.textMuted} />
            <Txt variant="small" style={{ fontWeight: '700', flex: 1 }}>
              {t('signup.demoCode')}
            </Txt>
          </View>
          {error && <Txt tone="danger">{error}</Txt>}
          <Button label={t('signup.verify')} onPress={verify} disabled={code.length < 4} />
        </FadeInUp>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  step: { gap: space.lg },
  input: { minHeight: 54, borderRadius: radius.md, borderWidth: 1, paddingHorizontal: space.lg },
  prefix: { borderRadius: radius.md, borderWidth: 1, paddingHorizontal: space.md, justifyContent: 'center' },
  check: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  box: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  code: { fontSize: 28, letterSpacing: 12, textAlign: 'center' },
  demoNote: { flexDirection: 'row', gap: space.sm, alignItems: 'center', padding: space.md, borderRadius: radius.md },
});
