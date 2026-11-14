import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, View } from 'react-native';

import { refillSponsor, type Sponsor } from '@/data/sponsors';
import { useAdsLeft, useLives } from '@/hooks/useEconomy';
import { useT } from '@/i18n';
import { dayKey, formatCountdown } from '@/lib/clock';
import { useGame } from '@/store/useGameStore';
import { radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import { useRewardedAd } from './RewardedAd';
import { Button, Card, Icon, Txt, type IconName } from './ui';

/**
 * Shown when a player has no lives. Every option leads back into play:
 * watch an ad, play a mode that needs no lives, review mistakes, or wait.
 */
export function OutOfLivesSheet({
  visible,
  onClose,
  onLifeGained,
}: {
  visible: boolean;
  onClose: () => void;
  onLifeGained?: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useT();
  const { nextAt, now } = useLives();
  const adsLeft = useAdsLeft();
  const gainLife = useGame((s) => s.gainLife);
  const playedDaily = useGame((s) => !!s.dailyHistory[dayKey(now)]);
  const missedCount = useGame((s) => s.missed.length);
  const ad = useRewardedAd();
  const sponsor = refillSponsor();
  const refillUsed = useGame((s) => s.sponsoredRefillDay === dayKey(now));
  const claimSponsoredRefill = useGame((s) => s.claimSponsoredRefill);
  const [refilling, setRefilling] = useState(false);

  const go = (href: '/daily/play' | '/street' | '/review') => {
    onClose();
    router.push(href);
  };

  return (
    <>
      <Modal visible={visible && !ad.modal && !refilling} transparent animationType="slide" onRequestClose={onClose}>
        <Pressable style={[styles.backdrop, { backgroundColor: colors.overlay }]} onPress={onClose}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.bg }]} onPress={() => {}}>
            <View style={styles.handle} />
            <View style={{ alignItems: 'center', gap: space.sm }}>
              <Icon name="heart-dislike" size={40} color={colors.danger} />
              <Txt variant="title" center>
                {t('lives.outTitle')}
              </Txt>
              {nextAt && (
                <Txt tone="muted" center>
                  {t('lives.nextIn', { time: formatCountdown(nextAt - now) })}
                </Txt>
              )}
            </View>

            {refillUsed ? (
              <Txt variant="small" tone="muted" center>
                {t('sponsor.refillUsed', { name: sponsor.name })}
              </Txt>
            ) : (
              <Pressable
                accessibilityRole="button"
                onPress={() => setRefilling(true)}
                style={({ pressed }) => [styles.refill, { backgroundColor: sponsor.color, opacity: pressed ? 0.9 : 1 }]}
              >
                <View style={styles.refillLogo}>
                  <Icon name={sponsor.icon} size={20} color={sponsor.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Txt variant="bodyStrong" style={{ color: '#FFFFFF' }}>
                    {t('sponsor.refill', { name: sponsor.name })}
                  </Txt>
                  <Txt variant="small" style={{ color: '#FFFFFF', opacity: 0.9 }}>
                    {t('sponsor.refillSub')}
                  </Txt>
                </View>
                <Txt variant="tiny" style={{ color: '#FFFFFF', opacity: 0.8 }}>
                  {t('common.sponsored').toUpperCase()}
                </Txt>
              </Pressable>
            )}
            <Button
              label={adsLeft > 0 ? t('lives.watchAd') : t('ad.capReached')}
              kind="sponsor"
              icon="play-circle"
              disabled={adsLeft <= 0}
              onPress={() =>
                ad.show(t('ad.rewardLife'), () => {
                  gainLife();
                  onLifeGained?.();
                })
              }
            />
            {adsLeft > 0 && (
              <Txt variant="small" tone="muted" center>
                {t('ad.left', { n: adsLeft })}
              </Txt>
            )}

            <Txt variant="small" tone="muted" style={{ fontWeight: '700' }}>
              {t('lives.freeModes').toUpperCase()}
            </Txt>
            {!playedDaily && (
              <Option icon="calendar" title={t('home.dailyTitle')} body={t('lives.noLivesNeeded')} onPress={() => go('/daily/play')} />
            )}
            <Option icon="mic" title={t('home.streetTitle')} body={t('lives.noLivesNeeded')} onPress={() => go('/street')} />
            {missedCount > 0 && (
              <Option
                icon="refresh"
                title={t('review.title')}
                body={t('review.count', { n: missedCount })}
                onPress={() => go('/review')}
              />
            )}
            <Button label={t('common.close')} kind="ghost" onPress={onClose} />
          </Pressable>
        </Pressable>
      </Modal>
      {ad.modal}
      {refilling && (
        <SponsoredRefill
          sponsor={sponsor}
          onDone={() => {
            setRefilling(false);
            if (claimSponsoredRefill()) onLifeGained?.();
          }}
        />
      )}
    </>
  );
}

const REFILL_MS = 2000;

/** A short branded card: "This life refill is brought to you by...", then +1 life. */
function SponsoredRefill({ sponsor, onDone }: { sponsor: Sponsor; onDone: () => void }) {
  const { t, L } = useT();
  const [progress] = useState(() => new Animated.Value(0));
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  });

  useEffect(() => {
    Animated.timing(progress, { toValue: 1, duration: REFILL_MS, useNativeDriver: false }).start();
    const id = setTimeout(() => doneRef.current(), REFILL_MS);
    return () => clearTimeout(id);
  }, [progress]);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => {}}>
      <View style={[styles.refillScreen, { backgroundColor: sponsor.color }]}>
        <Txt variant="tiny" style={{ color: '#FFFFFF', opacity: 0.8 }}>
          {t('common.sponsored').toUpperCase()}
        </Txt>
        <View style={styles.refillBig}>
          <Icon name={sponsor.icon} size={56} color={sponsor.color} />
        </View>
        <Txt center style={{ color: '#FFFFFF', opacity: 0.9 }}>
          {t('sponsor.refillBy')}
        </Txt>
        <Txt variant="title" center style={{ color: '#FFFFFF' }}>
          {sponsor.name}
        </Txt>
        <Txt center style={{ color: '#FFFFFF', opacity: 0.9 }}>
          {L(sponsor.tagline)}
        </Txt>
        <View style={styles.refillLife}>
          <Icon name="heart" size={22} color="#FFFFFF" />
          <Txt variant="heading" style={{ color: '#FFFFFF' }}>
            {t('ad.rewardLife')}
          </Txt>
        </View>
        <View style={styles.refillTrack}>
          <Animated.View
            style={[styles.refillFill, { width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]}
          />
        </View>
      </View>
    </Modal>
  );
}

function Option({ icon, title, body, onPress }: { icon: IconName; title: string; body: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Card onPress={onPress} style={styles.option}>
      <Icon name={icon} color={colors.primary} />
      <View style={{ flex: 1 }}>
        <Txt variant="bodyStrong">{title}</Txt>
        <Txt variant="small" tone="muted">
          {body}
        </Txt>
      </View>
      <Icon name="chevron-forward" color={colors.textMuted} />
    </Card>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: space.xl,
    paddingBottom: space.xxl,
    gap: space.md,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  handle: { width: 40, height: 5, borderRadius: 3, backgroundColor: '#8886', alignSelf: 'center' },
  option: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  refill: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.md },
  refillLogo: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  refillScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md, padding: space.xl },
  refillBig: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  refillLife: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.md },
  refillTrack: { width: '70%', height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)', overflow: 'hidden', marginTop: space.lg },
  refillFill: { height: '100%', backgroundColor: '#FFFFFF' },
});
