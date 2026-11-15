import { useCallback, useEffect, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SPONSORS, type Sponsor } from '@/data/sponsors';
import { useT } from '@/i18n';
import { haptic } from '@/services/haptics';
import { useGame } from '@/store/useGameStore';
import { fixed, radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import { PopIn } from './motion';
import { Button, Icon, IconButton, ProgressBar, Txt } from './ui';

const AD_SECONDS = 5;

interface Pending {
  reward: string;
  onReward: () => void;
  sponsor: Sponsor;
}

/**
 * Simulated rewarded video. `show` opens a 5-second "ad"; the reward is given only
 * if the player waits it out and taps Claim. Counts against the daily ad cap.
 */
export function useRewardedAd() {
  const [pending, setPending] = useState<Pending | null>(null);

  const show = useCallback((reward: string, onReward: () => void) => {
    const sponsor = SPONSORS[Math.floor(Math.random() * SPONSORS.length)];
    setPending({ reward, onReward, sponsor });
  }, []);

  const modal = pending ? (
    <RewardedAdModal
      key={pending.sponsor.id + pending.reward}
      sponsor={pending.sponsor}
      reward={pending.reward}
      onClose={() => setPending(null)}
      onClaim={() => {
        const ok = useGame.getState().consumeAd();
        setPending(null);
        if (ok) {
          haptic.success();
          pending.onReward();
        }
      }}
    />
  ) : null;

  return { show, modal };
}

function RewardedAdModal({
  sponsor,
  reward,
  onClose,
  onClaim,
}: {
  sponsor: Sponsor;
  reward: string;
  onClose: () => void;
  onClaim: () => void;
}) {
  const { colors } = useTheme();
  const { t, L } = useT();
  const [left, setLeft] = useState(AD_SECONDS);

  useEffect(() => {
    const id = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  const done = left === 0;

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[styles.root, { backgroundColor: sponsor.color }]}>
        <View style={styles.top}>
          <View style={styles.chip}>
            <Txt variant="tiny" tone="onAccent">
              {t('ad.label').toUpperCase()}
            </Txt>
          </View>
          <IconButton icon="close" onPress={onClose} label={t('common.close')} />
        </View>

        <View style={styles.creative}>
          <PopIn>
            <View style={styles.logo}>
              <Icon name={sponsor.icon} size={56} color={sponsor.color} />
            </View>
          </PopIn>
          <Txt variant="hero" center tone="onAccent">
            {sponsor.name}
          </Txt>
          <Txt variant="heading" center tone="onAccent" style={{ opacity: 0.9 }}>
            {L(sponsor.tagline)}
          </Txt>
        </View>

        <View style={{ gap: space.md }}>
          <ProgressBar
            value={AD_SECONDS - left}
            max={AD_SECONDS}
            color={colors.onAccent}
            trackColor="rgba(255,255,255,0.3)"
            height={6}
            durationMs={1000}
            linear
          />
          {done ? (
            <PopIn>
              <Button label={t('ad.claim', { reward })} kind="inverse" icon="gift" onPress={onClaim} />
            </PopIn>
          ) : (
            <Txt variant="bodyStrong" center tone="onAccent">
              {t('ad.wait', { n: left, reward })}
            </Txt>
          )}
          <Txt variant="small" center tone="onAccent" style={{ opacity: 0.8 }}>
            {t('ad.closeEarly')}
          </Txt>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: space.xl, justifyContent: 'space-between' },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chip: { backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  creative: { alignItems: 'center', gap: space.lg },
  logo: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: fixed.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
