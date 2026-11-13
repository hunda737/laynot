import { router } from 'expo-router';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

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

  const go = (href: '/daily/play' | '/street' | '/review') => {
    onClose();
    router.push(href);
  };

  return (
    <>
      <Modal visible={visible && !ad.modal} transparent animationType="slide" onRequestClose={onClose}>
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
    </>
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
});
