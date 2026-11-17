import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { DifficultyPicker } from '@/components/difficulty';
import { FadeInUp, Pop, PressableScale } from '@/components/motion';
import { Button, Card, Icon, Screen, TopBar, Txt, type IconName } from '@/components/ui';
import { CATEGORIES } from '@/data/questions';
import { useT, type StringKey } from '@/i18n';
import { LEVEL_CHOICES, type LevelChoice } from '@/lib/difficulty';
import { FRIEND_BOTS, type DuelCategory, type Opponent } from '@/lib/duel';
import { haptic } from '@/services/haptics';
import { useGame } from '@/store/useGameStore';
import { modeColors, radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

const TOPICS: DuelCategory[] = ['mixed', ...CATEGORIES.map((c) => c.id)];
const TOPIC_ICONS = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.icon])) as Record<string, string>;
const ANYONE = 'anyone';

/** Pick a topic, a level and an opponent. `?bot=&category=&level=` pre-fills a rematch. */
export default function NewDuel() {
  const { colors, cat } = useTheme();
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
      <TopBar title={t('duel.new')} />

      <FadeInUp index={0} style={{ gap: 6 }}>
        <Txt variant="tiny" tone="muted">
          {t('duel.topic').toUpperCase()}
        </Txt>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.chips}>
          {TOPICS.map((c) => {
            const active = c === category;
            // Each topic lights up in its own colour; "Mixed" takes the duel colour.
            const solid = c === 'mixed' ? modeColors.duel : cat[c].solid;
            const fg = c === 'mixed' ? colors.textMuted : cat[c].fg;
            const icon = (c === 'mixed' ? 'shuffle' : TOPIC_ICONS[c]) as IconName;
            return (
              <PressableScale
                key={c}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setCategory(c)}
                scaleTo={0.94}
                tapHaptic
                style={[
                  styles.chip,
                  { backgroundColor: active ? solid : colors.surface, borderColor: active ? solid : colors.border },
                ]}
              >
                <Icon name={icon} size={15} color={active ? colors.onAccent : fg} />
                <Txt variant="small" style={{ fontWeight: '700', color: active ? colors.onAccent : colors.text }}>
                  {t(c === 'mixed' ? 'level.mixed' : (`cat.${c}` as StringKey))}
                </Txt>
              </PressableScale>
            );
          })}
        </ScrollView>
      </FadeInUp>

      <FadeInUp index={1}>
        <DifficultyPicker value={level} onChange={setLevel} />
      </FadeInUp>

      <FadeInUp index={2}>
        <Txt variant="heading">{t('duel.opponent')}</Txt>
      </FadeInUp>
      <Card style={{ gap: space.xs, padding: space.sm }}>
        {FRIEND_BOTS.map((b, i) => (
          <FadeInUp key={b.id} index={Math.min(3 + i, 10)}>
            <Choice selected={who === b.id} onPress={() => setWho(b.id)} title={b.name} body={t('duel.friendBody')}>
              <Avatar name={b.name} />
            </Choice>
          </FadeInUp>
        ))}
        <FadeInUp index={Math.min(3 + FRIEND_BOTS.length, 10)}>
          <Choice selected={who === ANYONE} onPress={() => setWho(ANYONE)} title={t('duel.anyone')} body={t('duel.anyoneBody')}>
            <View style={[styles.anyone, { backgroundColor: modeColors.duel }]}>
              <Icon name="share-social" size={18} color={colors.onAccent} />
            </View>
          </Choice>
        </FadeInUp>
      </Card>

      <FadeInUp index={Math.min(4 + FRIEND_BOTS.length, 10)} style={{ gap: space.md }}>
        <Button label={t('duel.start')} icon="play" onPress={start} />
        <Txt variant="small" tone="muted" center>
          {t('lives.noLivesNeeded')}
        </Txt>
      </FadeInUp>
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
    <PressableScale
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={title}
      onPress={onPress}
      scaleTo={0.98}
      tapHaptic
      style={[styles.choice, selected && { backgroundColor: colors.primarySoft }]}
    >
      {children}
      <View style={{ flex: 1 }}>
        <Txt variant="bodyStrong">{title}</Txt>
        <Txt variant="small" tone="muted">
          {body}
        </Txt>
      </View>
      <Pop trigger={selected}>
        <Icon name={selected ? 'radio-button-on' : 'radio-button-off'} color={selected ? colors.primary : colors.textMuted} />
      </Pop>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  bleed: { marginHorizontal: -space.lg },
  chips: { paddingHorizontal: space.lg, gap: space.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: space.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  choice: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.sm, borderRadius: radius.md },
  anyone: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
