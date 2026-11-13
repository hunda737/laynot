import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Button, Header, Icon, Screen, Txt } from '@/components/ui';
import { useT } from '@/i18n';
import { haptic } from '@/services/haptics';
import { useGame } from '@/store/useGameStore';
import { radius, space, type as typeScale } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

const DEMO_CODE = '1234';
// Ethio telecom numbers start with 9, Safaricom Ethiopia with 7.
const PHONE_RE = /^[79]\d{8}$/;

export default function Signup() {
  const { colors } = useTheme();
  const { t } = useT();
  const signUp = useGame((s) => s.signUp);

  const [step, setStep] = useState<'details' | 'code'>('details');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [adult, setAdult] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/home'));

  const sendCode = () => {
    if (name.trim().length < 2) return setError(t('signup.invalidName'));
    if (!PHONE_RE.test(phone)) return setError(t('signup.invalidPhone'));
    setError(null);
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
      return setError(t('signup.wrongCode'));
    }
    haptic.success();
    signUp({ name: name.trim(), phone, adult });
    close();
  };

  const inputStyle = [
    styles.input,
    typeScale.bodyStrong,
    { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border },
  ];

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <Header
        title={step === 'details' ? t('signup.title') : t('signup.codeTitle')}
        onBack={step === 'code' ? () => setStep('details') : close}
      />

      {step === 'details' ? (
        <>
          <Txt tone="muted">{t('signup.body')}</Txt>
          <View style={{ gap: space.sm }}>
            <Txt variant="small" style={{ fontWeight: '700' }}>
              {t('signup.name')}
            </Txt>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t('signup.namePlaceholder')}
              placeholderTextColor={colors.textMuted}
              style={inputStyle}
              autoCapitalize="words"
              maxLength={24}
            />
          </View>
          <View style={{ gap: space.sm }}>
            <Txt variant="small" style={{ fontWeight: '700' }}>
              {t('signup.phone')}
            </Txt>
            <View style={{ flexDirection: 'row', gap: space.sm }}>
              <View style={[styles.prefix, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                <Txt variant="bodyStrong">🇪🇹 +251</Txt>
              </View>
              <TextInput
                value={phone}
                onChangeText={(v) => setPhone(v.replace(/\D/g, '').slice(0, 9))}
                placeholder="9XXXXXXXX"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                style={[inputStyle, { flex: 1 }]}
              />
            </View>
            <Txt variant="small" tone="muted">
              {t('signup.phoneHint')}
            </Txt>
          </View>
          <Pressable
            onPress={() => setAdult((v) => !v)}
            style={styles.check}
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
          </Pressable>
          {error && <Txt tone="danger">{error}</Txt>}
          <Button label={t('signup.sendCode')} onPress={sendCode} loading={sending} />
        </>
      ) : (
        <>
          <Txt tone="muted">{t('signup.codeBody', { phone: `+251 ${phone}` })}</Txt>
          <TextInput
            value={code}
            onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 4))}
            keyboardType="number-pad"
            placeholder="••••"
            placeholderTextColor={colors.textMuted}
            style={[inputStyle, styles.code]}
            autoFocus
          />
          <View style={[styles.demoNote, { backgroundColor: colors.sponsorSoft }]}>
            <Icon name="information-circle" color={colors.sponsor} />
            <Txt variant="small" tone="sponsor" style={{ fontWeight: '700' }}>
              {t('signup.demoCode')}
            </Txt>
          </View>
          {error && <Txt tone="danger">{error}</Txt>}
          <Button label={t('signup.verify')} onPress={verify} disabled={code.length < 4} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: { minHeight: 54, borderRadius: radius.md, borderWidth: 1, paddingHorizontal: space.lg },
  prefix: { borderRadius: radius.md, borderWidth: 1, paddingHorizontal: space.md, justifyContent: 'center' },
  check: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  box: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  code: { fontSize: 28, letterSpacing: 12, textAlign: 'center' },
  demoNote: { flexDirection: 'row', gap: space.sm, alignItems: 'center', padding: space.md, borderRadius: radius.md },
});
