import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { LivesPill } from '@/components/status';
import { Button, Card, Header, Screen, Segmented, Txt } from '@/components/ui';
import { useAdsLeft } from '@/hooks/useEconomy';
import { useToday } from '@/hooks/useNow';
import { formatDay, useT } from '@/i18n';
import { haptic } from '@/services/haptics';
import { goBack } from '@/services/nav';
import { useGame } from '@/store/useGameStore';
import { space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

/** Shortcuts for showing the flow in one sitting. Not part of the real product. */
export default function Demo() {
  const { colors } = useTheme();
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
  const demoLoadSample = useGame((s) => s.demoLoadSample);
  const addCoins = useGame((s) => s.addCoins);
  const resetAll = useGame((s) => s.resetAll);
  const [confirm, setConfirm] = useState<'reset' | 'sample' | null>(null);

  const done = () => haptic.success();

  return (
    <Screen>
      <Header title={t('demo.title')} onBack={goBack} />
      <Txt variant="small" tone="muted">
        {t('demo.intro')}
      </Txt>

      <Card style={{ borderColor: colors.sponsor }}>
        <Button label={t('demo.sample')} kind="sponsor" icon="person-add" onPress={() => setConfirm('sample')} />
      </Card>

      <Card>
        <Txt variant="bodyStrong">{t('demo.time')}</Txt>
        <Txt variant="small" tone="muted">
          {t('settings.demoDate', { date: formatDay(lang, today) })}
          {dayOffset !== 0 ? ` (+${dayOffset})` : ''}
        </Txt>
        <Button
          label={t('settings.nextDay')}
          kind="secondary"
          icon="play-forward"
          onPress={() => {
            demoShiftDays(1);
            done();
          }}
        />
        {dayOffset !== 0 && (
          <Button label={t('settings.realDay')} kind="secondary" icon="refresh" onPress={demoResetClock} />
        )}
      </Card>

      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Txt variant="bodyStrong">{t('demo.lives')}</Txt>
          <LivesPill />
        </View>
        <Button
          label={t('demo.emptyLives')}
          kind="secondary"
          icon="heart-dislike"
          onPress={() => {
            demoEmptyLives();
            done();
          }}
        />
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
        <Button
          label={t('demo.coins')}
          kind="secondary"
          icon="add-circle"
          onPress={() => {
            addCoins(200);
            done();
          }}
        />
        <Txt variant="small" tone="muted">
          {adsLeft > 0 ? t('ad.left', { n: adsLeft }) : t('ad.capReached')}
        </Txt>
        <Button label={t('demo.resetAds')} kind="secondary" icon="refresh" onPress={demoResetAds} />
      </Card>

      <View style={{ gap: space.sm }}>
        <Button label={t('settings.reset')} kind="ghost" icon="trash-outline" onPress={() => setConfirm('reset')} />
      </View>

      <ConfirmDialog
        visible={confirm === 'sample'}
        title={t('demo.sampleTitle')}
        body={t('demo.sampleBody')}
        confirmLabel={t('demo.sampleConfirm')}
        cancelLabel={t('common.cancel')}
        onConfirm={() => {
          setConfirm(null);
          demoLoadSample();
          router.dismissTo('/home');
        }}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        visible={confirm === 'reset'}
        title={t('settings.resetTitle')}
        body={t('settings.resetBody')}
        confirmLabel={t('settings.resetConfirm')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={() => {
          setConfirm(null);
          resetAll();
          router.dismissAll();
          router.replace('/welcome');
        }}
        onCancel={() => setConfirm(null)}
      />
    </Screen>
  );
}
