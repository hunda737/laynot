import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { DifficultyPicker } from '@/components/difficulty';
import { Button, Card, Header, Icon, Screen, Txt } from '@/components/ui';
import { CATEGORIES } from '@/data/questions';
import { useT, type StringKey } from '@/i18n';
import { LEVEL_CHOICES, type LevelChoice } from '@/lib/difficulty';
import { FRIEND_BOTS, type DuelCategory, type Opponent } from '@/lib/duel';
import { haptic } from '@/services/haptics';
import { goBack } from '@/services/nav';
import { useGame } from '@/store/useGameStore';
import { radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

const TOPICS: DuelCategory[] = ['mixed', ...CATEGORIES.map((c) => c.id)];
const ANYONE = 'anyone';

/** Pick a topic, a level and an opponent. `?bot=&category=&level=` pre-fills a rematch. */
export default function NewDuel() {
  const { colors } = useTheme();
  const { t } = useT();
  const params = useLocalSearchParams<{ bot?: string; category?: string; level?: string }>();
  const startDuel = useGame((s) => s.startDuel);

  const [category, setCategory] = useState<DuelCategory>(() =>
    TOPICS.includes(params.category as DuelCategory) ? (params.category as DuelCategory) : 'mixed',
  );
  const [level, setLevel] = useState<LevelChoice>(() =>
    LEVEL_CHOICES.includes(params.level as LevelChoice) ? (params.level as LevelChoice) : 'mixed',
  );
  const [who, setWho] = useState<string>(() =>
    FRIEND_BOTS.some((b) => b.id === params.bot) || params.bot === ANYONE ? (params.bot as string) : (FRIEND_BOTS[0]?.id ?? ANYONE),
  );

  const start = () => {
    const opponent: Opponent = who === ANYONE ? { kind: 'open' } : { kind: 'bot', botId: who };
    const duel = startDuel({ category, level, opponent });
    haptic.tap();
    router.replace({ pathname: '/duel/[id]', params: { id: duel.id } });
  };

  return (
    <Screen>
      <Header title={t('duel.new')} onBack={goBack} />

      <View style={{ gap: 6 }}>
        <Txt variant="tiny" tone="muted">
          {t('duel.topic').toUpperCase()}
        </Txt>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
          {TOPICS.map((c) => {
            const active = c === category;
            return (
              <Pressable
                key={c}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setCategory(c)}
                style={[styles.chip, { backgroundColor: active ? colors.primary : colors.surface, borderColor: active ? colors.primary : colors.border }]}
              >
                <Txt variant="small" style={{ fontWeight: '700', color: active ? colors.onPrimary : colors.text }}>
                  {t(c === 'mixed' ? 'level.mixed' : (`cat.${c}` as StringKey))}
                </Txt>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <DifficultyPicker value={level} onChange={setLevel} />

      <Txt variant="heading">{t('duel.opponent')}</Txt>
      <Card style={{ gap: space.xs, padding: space.sm }}>
        {FRIEND_BOTS.map((b) => (
          <Choice key={b.id} selected={who === b.id} onPress={() => setWho(b.id)} title={b.name} body={t('duel.friendBody')}>
            <Avatar name={b.name} />
          </Choice>
        ))}
        <Choice selected={who === ANYONE} onPress={() => setWho(ANYONE)} title={t('duel.anyone')} body={t('duel.anyoneBody')}>
          <View style={[styles.anyone, { backgroundColor: colors.sponsorSoft }]}>
            <Icon name="share-social" size={18} color={colors.sponsor} />
          </View>
        </Choice>
      </Card>

      <Button label={t('duel.start')} icon="play" onPress={start} />
      <Txt variant="small" tone="muted" center>
        {t('lives.noLivesNeeded')}
      </Txt>
    </Screen>
  );
}

function Choice({
  selected,
  onPress,
  title,
  body,
  children,
}: {
  selected: boolean;
  onPress: () => void;
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={title}
      onPress={onPress}
      style={[styles.choice, selected && { backgroundColor: colors.primarySoft }]}
    >
      {children}
      <View style={{ flex: 1 }}>
        <Txt variant="bodyStrong">{title}</Txt>
        <Txt variant="small" tone="muted">
          {body}
        </Txt>
      </View>
      <Icon name={selected ? 'radio-button-on' : 'radio-button-off'} color={selected ? colors.primary : colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { paddingHorizontal: space.md, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1 },
  choice: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.sm, borderRadius: radius.md },
  anyone: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
