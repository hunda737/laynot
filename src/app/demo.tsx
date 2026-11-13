import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { LivesPill } from '@/components/status';
import { Button, Card, Header, Screen, Segmented, Txt } from '@/components/ui';
import { useAdsLeft } from '@/hooks/useEconomy';
import { useToday } from '@/hooks/useNow';
import { formatDay, useT } from '@/i18n';
import { goBack } from '@/services/nav';
import { useGame } from '@/store/useGameStore';
import { space } from '@/theme/tokens';

/** Shortcuts for showing the flow in one sitting. Not part of the real product. */
export default function Demo() {
  const { t, lang } = useT();
  const today = useToday();
  const adsLeft = useAdsLeft();
  const dayOffset = useGame((s) => s.dayOffset);
  const fastRefill = useGame((s) => s.fastRefill);
  const demoShiftDays = useGame((s) => s.demoShiftDays);
  const demoResetClock = useGame((s) => s.demoResetClock);
  const demoEmptyLives = useGame((s) => s.demoEmptyLives);
  const demoSetFastRefill = useGame((s) => s.demoSetFastRefill);
  const demoResetAds = useGame((s) => s.demoResetAds);
  const addCoins = useGame((s) => s.addCoins);
  const resetAll = useGame((s) => s.resetAll);
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <Screen>
      <Header title={t('demo.title')} onBack={goBack} />

      <Card>
        <Txt variant="bodyStrong">{t('demo.time')}</Txt>
        <Txt variant="small" tone="muted">
          {t('settings.demoDate', { date: formatDay(lang, today) })}
          {dayOffset !== 0 ? ` (+${dayOffset})` : ''}
        </Txt>
        <Button label={t('settings.nextDay')} kind="secondary" icon="play-forward" onPress={() => demoShiftDays(1)} />
        {dayOffset !== 0 && (
          <Button label={t('settings.realDay')} kind="secondary" icon="refresh" onPress={demoResetClock} />
        )}
      </Card>

      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Txt variant="bodyStrong">{t('demo.lives')}</Txt>
          <LivesPill />
        </View>
        <Button label={t('demo.emptyLives')} kind="secondary" icon="heart-dislike" onPress={demoEmptyLives} />
        <Txt variant="small" tone="muted">
          {t('demo.refill')}
        </Txt>
        <Segmented<'normal' | 'fast'>
          value={fastRefill ? 'fast' : 'normal'}
          onChange={(v) => demoSetFastRefill(v === 'fast')}
          options={[
            { value: 'normal', label: t('demo.refillNormal') },
            { value: 'fast', label: t('demo.refillFast') },
          ]}
        />
      </Card>

      <Card>
        <Txt variant="bodyStrong">{t('profile.coins')}</Txt>
        <Button label={t('demo.coins')} kind="secondary" icon="add-circle" onPress={() => addCoins(200)} />
        <Txt variant="small" tone="muted">
          {adsLeft > 0 ? t('ad.left', { n: adsLeft }) : t('ad.capReached')}
        </Txt>
        <Button label={t('demo.resetAds')} kind="secondary" icon="refresh" onPress={demoResetAds} />
      </Card>

      <View style={{ gap: space.sm }}>
        <Button label={t('settings.reset')} kind="ghost" icon="trash-outline" onPress={() => setConfirmReset(true)} />
      </View>

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
          router.dismissAll();
          router.replace('/welcome');
        }}
        onCancel={() => setConfirmReset(false)}
      />
    </Screen>
  );
}
