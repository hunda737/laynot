import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { FadeInUp } from '@/components/motion';
import { Card, Icon, Segmented, Screen, TopBar, Txt } from '@/components/ui';
import { useT, type Language } from '@/i18n';
import { useGame, type ThemePref } from '@/store/useGameStore';
import { radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

export default function Settings() {
  const { colors } = useTheme();
  const { t, lang } = useT();
  const themePref = useGame((s) => s.themePref);
  const setLanguage = useGame((s) => s.setLanguage);
  const setThemePref = useGame((s) => s.setThemePref);

  return (
    <Screen>
      <TopBar title={t('settings.title')} />

      <FadeInUp index={0}>
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
      </FadeInUp>

      <FadeInUp index={1}>
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
      </FadeInUp>

      <FadeInUp index={2}>
        <Card onPress={() => router.push('/demo')} style={styles.row}>
          <View style={[styles.chip, { backgroundColor: colors.surfaceAlt }]}>
            <Icon name="construct" size={18} color={colors.text} />
          </View>
          <Txt variant="bodyStrong" style={{ flex: 1 }}>
            {t('demo.open')}
          </Txt>
          <Icon name="chevron-forward" size={18} color={colors.textMuted} />
        </Card>
      </FadeInUp>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  chip: { width: 38, height: 38, borderRadius: radius.sm + 2, alignItems: 'center', justifyContent: 'center' },
});
