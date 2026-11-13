import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Button, Card, Header, Segmented, Screen, Txt } from '@/components/ui';
import { useToday } from '@/hooks/useNow';
import { formatDay, useT, type Language } from '@/i18n';
import { useGame, type ThemePref } from '@/store/useGameStore';
import { space } from '@/theme/tokens';

export default function Settings() {
  const { t, lang } = useT();
  const today = useToday();
  const themePref = useGame((s) => s.themePref);
  const dayOffset = useGame((s) => s.dayOffset);
  const setLanguage = useGame((s) => s.setLanguage);
  const setThemePref = useGame((s) => s.setThemePref);
  const demoShiftDays = useGame((s) => s.demoShiftDays);
  const demoResetClock = useGame((s) => s.demoResetClock);
  const resetAll = useGame((s) => s.resetAll);
  const [confirmReset, setConfirmReset] = useState(false);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/home'));

  return (
    <Screen>
      <Header title={t('settings.title')} onBack={back} />

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

      <Card>
        <Txt variant="bodyStrong">{t('settings.demo')}</Txt>
        <Txt variant="small" tone="muted">
          {t('settings.demoDate', { date: formatDay(lang, today) })}
          {dayOffset !== 0 ? ` (+${dayOffset})` : ''}
        </Txt>
        <View style={{ gap: space.sm }}>
          <Button label={t('settings.nextDay')} kind="secondary" icon="play-forward" onPress={() => demoShiftDays(1)} />
          {dayOffset !== 0 && (
            <Button label={t('settings.realDay')} kind="secondary" icon="refresh" onPress={demoResetClock} />
          )}
          <Button label={t('settings.reset')} kind="ghost" icon="trash-outline" onPress={() => setConfirmReset(true)} />
        </View>
      </Card>

      <ConfirmDialog
        visible={confirmReset}
        title={t('settings.resetTitle')}
        body={t('settings.resetBody')}
        confirmLabel={t('settings.resetConfirm')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={() => {
          setConfirmReset(false);
          resetAll();
          router.replace('/welcome');
        }}
        onCancel={() => setConfirmReset(false)}
      />
    </Screen>
  );
}
