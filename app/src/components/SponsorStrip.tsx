import { StyleSheet, View } from 'react-native';

import type { Sponsor } from '@/data/sponsors';
import { useT } from '@/i18n';
import { fixed, radius, space } from '@/theme/tokens';
import { Icon, Txt } from './ui';

/**
 * "Presented by Merkato Mart" in the sponsor's colour. Always says "Sponsored",
 * as the product plan requires for every paid placement.
 */
export function SponsorStrip({ sponsor, message, compact }: { sponsor: Sponsor; message?: string; compact?: boolean }) {
  const { t } = useT();
  return (
    <View style={[styles.strip, compact && styles.compact, { backgroundColor: sponsor.color }]}>
      <View style={[styles.logo, compact && { width: 22, height: 22 }]}>
        <Icon name={sponsor.icon} size={compact ? 13 : 18} color={sponsor.color} />
      </View>
      <View style={{ flex: 1 }}>
        <Txt variant={compact ? 'tiny' : 'bodyStrong'} numberOfLines={1} tone="onAccent">
          {t('sponsor.presents', { name: sponsor.name })}
        </Txt>
        {message && !compact && (
          <Txt variant="small" tone="onAccent" style={{ opacity: 0.9 }}>
            {message}
          </Txt>
        )}
      </View>
      {!compact && (
        <Txt variant="tiny" tone="onAccent" style={{ opacity: 0.85 }}>
          {t('common.sponsored').toUpperCase()}
        </Txt>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.md },
  compact: { paddingVertical: 5, paddingHorizontal: 8, gap: 6, borderRadius: radius.sm },
  logo: { width: 32, height: 32, borderRadius: 16, backgroundColor: fixed.white, alignItems: 'center', justifyContent: 'center' },
});
