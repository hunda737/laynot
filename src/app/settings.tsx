import { router } from 'expo-router';

import { Card, Header, Icon, Segmented, Screen, Txt } from '@/components/ui';
import { useT, type Language } from '@/i18n';
import { goBack } from '@/services/nav';
import { useGame, type ThemePref } from '@/store/useGameStore';
import { space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

export default function Settings() {
  const { colors } = useTheme();
  const { t, lang } = useT();
  const themePref = useGame((s) => s.themePref);
  const setLanguage = useGame((s) => s.setLanguage);
  const setThemePref = useGame((s) => s.setThemePref);

  return (
    <Screen>
      <Header title={t('settings.title')} onBack={goBack} />

      <Card>
        <Txt variant="bodyStrong">{t('settings.language')}</Txt>
        <Segmented<Language>
          value={lang}
          onChange={setLanguage}
          options={[
            { value: 'en', label: 'English' },
            { value: 'am', label: 'አማርኛ' },
          ]}
        />
      </Card>

      <Card>
        <Txt variant="bodyStrong">{t('settings.theme')}</Txt>
        <Segmented<ThemePref>
          value={themePref}
          onChange={setThemePref}
          options={[
            { value: 'system', label: t('settings.themeSystem') },
            { value: 'light', label: t('settings.themeLight') },
            { value: 'dark', label: t('settings.themeDark') },
          ]}
        />
      </Card>

      <Card
        onPress={() => router.push('/demo')}
        style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, borderColor: colors.sponsor }}
      >
        <Icon name="construct" color={colors.sponsor} />
        <Txt variant="bodyStrong" style={{ flex: 1 }}>
          {t('demo.open')}
        </Txt>
        <Icon name="chevron-forward" color={colors.textMuted} />
      </Card>
    </Screen>
  );
}
