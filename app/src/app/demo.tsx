import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { FadeInUp } from '@/components/motion';
import { CoinChip, Hearts } from '@/components/status';
import { Button, Card, Screen, Segmented, TopBar, Txt } from '@/components/ui';
import { useAdsLeft } from '@/hooks/useEconomy';
import { useToday } from '@/hooks/useNow';
import { formatDay, useT } from '@/i18n';
import { haptic } from '@/services/haptics';
import { useGame } from '@/store/useGameStore';
import { space } from '@/theme/tokens';

const HEAD_ROW = { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.md } as const;

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
  const demoLoadSample = useGame((s) => s.demoLoadSample);
  const showBanners = useGame((s) => s.showBanners);
  const demoSetBanners = useGame((s) => s.demoSetBanners);
  const addCoins = useGame((s) => s.addCoins);
  const resetAll = useGame((s) => s.resetAll);
  const leagues = useGame((s) => s.leagues);
  const demoLeagueJoin = useGame((s) => s.demoLeagueJoin);
  const [friendNote, setFriendNote] = useState<string | null>(null);
  const fastFriends = useGame((s) => s.fastFriends);
  const demoSetFastFriends = useGame((s) => s.demoSetFastFriends);
  const demoIncomingDuel = useGame((s) => s.demoIncomingDuel);
  const [duelNote, setDuelNote] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<'reset' | 'sample' | null>(null);

  const done = () => haptic.success();

  return (
    <Screen>
      <TopBar title={t('demo.title')} />
      <Txt variant="small" tone="muted">
        {t('demo.intro')}
      </Txt>

      <FadeInUp index={0}>
        <Button label={t('demo.sample')} kind="ink" icon="person-add" onPress={() => setConfirm('sample')} />
      </FadeInUp>

      <FadeInUp index={1}>
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
      </FadeInUp>

      <FadeInUp index={2}>
        <Card>
          <View style={HEAD_ROW}>
            <Txt variant="bodyStrong">{t('demo.lives')}</Txt>
            <Hearts size="md" />
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
      </FadeInUp>

      <FadeInUp index={3}>
        <Card>
          <View style={HEAD_ROW}>
            <Txt variant="bodyStrong">{t('profile.coins')}</Txt>
            <CoinChip />
          </View>
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
      </FadeInUp>

      <FadeInUp index={4}>
        <Card>
          <Txt variant="bodyStrong">{t('demo.banners')}</Txt>
          <Segmented<'on' | 'off'>
            value={showBanners ? 'on' : 'off'}
            onChange={(v) => demoSetBanners(v === 'on')}
            options={[
              { value: 'on', label: t('demo.bannersOn') },
              { value: 'off', label: t('demo.bannersOff') },
            ]}
          />
        </Card>
      </FadeInUp>

      <FadeInUp index={5}>
        <Card>
          <Txt variant="bodyStrong">{t('duel.title')}</Txt>
          <Txt variant="small" tone="muted">
            {t('demo.fastFriends')}
          </Txt>
          <Segmented<'normal' | 'fast'>
            value={fastFriends ? 'fast' : 'normal'}
            onChange={(v) => demoSetFastFriends(v === 'fast')}
            options={[
              { value: 'normal', label: t('demo.fastFriendsNormal') },
              { value: 'fast', label: t('demo.fastFriendsFast') },
            ]}
          />
          <Button
            label={t('demo.incomingDuel')}
            kind="secondary"
            icon="flash"
            onPress={() => {
              setDuelNote(t('demo.incomingSent', { name: demoIncomingDuel() }));
              done();
            }}
          />
          {duelNote && (
            <Txt variant="small" tone="muted">
              {duelNote}
            </Txt>
          )}
        </Card>
      </FadeInUp>

      <FadeInUp index={6}>
        <Card>
          <Txt variant="bodyStrong">{t('ranks.private')}</Txt>
          <Button
            label={t('demo.leagueJoin')}
            kind="secondary"
            icon="person-add"
            onPress={() => {
              const target = leagues[leagues.length - 1];
              const who = target ? demoLeagueJoin(target.id) : null;
              setFriendNote(target && who ? t('demo.leagueJoined', { name: who, league: target.name }) : t('demo.noLeague'));
              if (who) done();
            }}
          />
          {friendNote && (
            <Txt variant="small" tone="muted">
              {friendNote}
            </Txt>
          )}
        </Card>
      </FadeInUp>

      <FadeInUp index={7}>
        <Button label={t('settings.reset')} kind="ghost" icon="trash-outline" onPress={() => setConfirm('reset')} />
      </FadeInUp>

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
