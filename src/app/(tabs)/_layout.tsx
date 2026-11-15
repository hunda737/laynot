import { Tabs } from 'expo-router/js-tabs';
import type { ColorValue } from 'react-native';

import { FloatingTabBar } from '@/components/TabBar';
import { Icon, type IconName } from '@/components/ui';
import { useT } from '@/i18n';

function tabIcon(name: IconName) {
  return function TabIcon({ color, focused, size }: { color: ColorValue; focused: boolean; size: number }) {
    return <Icon name={focused ? name : (`${name}-outline` as IconName)} size={size} color={color} />;
  };
}

export default function TabsLayout() {
  const { t } = useT();
  return (
    <Tabs tabBar={(props) => <FloatingTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="home" options={{ title: t('tabs.home'), tabBarIcon: tabIcon('home') }} />
      <Tabs.Screen name="ranks" options={{ title: t('tabs.leaderboard'), tabBarIcon: tabIcon('trophy') }} />
      <Tabs.Screen name="profile" options={{ title: t('tabs.profile'), tabBarIcon: tabIcon('person') }} />
    </Tabs>
  );
}
