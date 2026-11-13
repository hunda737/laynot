import { View } from 'react-native';

import { Icon, Screen, Txt } from '@/components/ui';
import { useT } from '@/i18n';
import { space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

export default function Ranks() {
  const { colors } = useTheme();
  const { t } = useT();
  return (
    <Screen scroll={false} contentStyle={{ justifyContent: 'center' }}>
      <View style={{ alignItems: 'center', gap: space.md, padding: space.xl }}>
        <Icon name="trophy" size={48} color={colors.gold} />
        <Txt variant="heading" center>
          {t('tabs.leaderboard')}
        </Txt>
        <Txt tone="muted" center>
          {t('ranks.soon')}
        </Txt>
      </View>
    </Screen>
  );
}
