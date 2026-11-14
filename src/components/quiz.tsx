import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

import { useT, type StringKey } from '@/i18n';
import type { PlayableQuestion } from '@/lib/daily';
import type { AnswerMark } from '@/lib/scoring';
import type { AnswerLog } from '@/store/useGameStore';
import { radius, space, type as typeScale } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import { DifficultyBadge } from './difficulty';
import { Button, Icon, Txt } from './ui';

export function TimerBar({ remaining, limit, stopped }: { remaining: number; limit: number; stopped?: boolean }) {
  const { colors } = useTheme();
  const ratio = Math.max(0, Math.min(1, remaining / limit));
  const urgent = remaining <= 5000 && !stopped;
  return (
    <View style={styles.timerRow}>
      <View style={[styles.timerTrack, { backgroundColor: colors.surfaceAlt }]}>
        <View
          style={[
            styles.timerFill,
            {
              width: `${ratio * 100}%`,
              backgroundColor: stopped ? colors.textMuted : urgent ? colors.danger : colors.primary,
            },
          ]}
        />
      </View>
      <Txt variant="small" tone={urgent ? 'danger' : 'muted'} style={styles.timerText}>
        {stopped ? '' : `${Math.ceil(remaining / 1000)}s`}
      </Txt>
    </View>
  );
}

/** Ten little squares showing progress through the round. */
export function ProgressDots({ marks, total, current }: { marks: AnswerMark[]; total: number; current: number }) {
  const { colors } = useTheme();
  const colorFor = (m: AnswerMark) =>
    m === 'correct' ? colors.success : m === 'wrong' ? colors.danger : colors.textMuted;
  return (
    <View style={styles.dots}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            { backgroundColor: i < marks.length ? colorFor(marks[i]) : colors.surfaceAlt },
            i === current && i >= marks.length && { backgroundColor: colors.primary, transform: [{ scaleY: 1.4 }] },
          ]}
        />
      ))}
    </View>
  );
}

const LETTERS = ['A', 'B', 'C', 'D'];

export function QuestionView({
  pq,
  revealed,
  onPick,
  hidden = [],
  label,
}: {
  pq: PlayableQuestion;
  revealed: AnswerLog | null;
  onPick: (choiceIndex: number) => void;
  /** Choice indexes removed by a 50/50 hint. */
  hidden?: number[];
  label?: string;
}) {
  const { colors } = useTheme();
  const { L, t } = useT();
  const [fade] = useState(() => new Animated.Value(0));

  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 260, useNativeDriver: true }).start();
  }, [pq.question.id, fade]);

  return (
    <Animated.View
      style={{
        gap: space.lg,
        opacity: fade,
        transform: [{ translateY: fade.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
      }}
    >
      <View style={{ gap: space.sm }}>
        <View style={styles.labelRow}>
          <Txt variant="tiny" tone="primary" style={{ flexShrink: 1 }}>
            {(label ?? t(`cat.${pq.question.category}` as StringKey)).toUpperCase()}
          </Txt>
          <DifficultyBadge level={pq.question.difficulty} />
        </View>
        <Txt variant="question">{L(pq.question.text)}</Txt>
      </View>
      <View style={{ gap: space.sm }}>
        {pq.order.map((choiceIndex, pos) => {
          const isCorrect = choiceIndex === 0;
          const isPicked = revealed?.pick === choiceIndex;
          const isHidden = hidden.includes(choiceIndex) && !revealed;
          let bg = colors.surface;
          let border = colors.border;
          let fg = colors.text;
          let badgeBg = colors.surfaceAlt;
          let icon: 'checkmark' | 'close' | null = null;
          if (revealed && isCorrect) {
            bg = colors.successSoft;
            border = colors.success;
            badgeBg = colors.success;
            icon = 'checkmark';
          } else if (revealed && isPicked) {
            bg = colors.dangerSoft;
            border = colors.danger;
            badgeBg = colors.danger;
            icon = 'close';
          } else if (revealed) {
            fg = colors.textMuted;
          }
          return (
            <Pressable
              key={choiceIndex}
              accessibilityRole="button"
              disabled={!!revealed || isHidden}
              onPress={() => onPick(choiceIndex)}
              style={({ pressed }) => [
                styles.choice,
                {
                  backgroundColor: pressed ? colors.surfaceAlt : bg,
                  borderColor: border,
                  opacity: isHidden ? 0.25 : 1,
                  transform: [{ scale: pressed ? 0.985 : 1 }],
                },
              ]}
            >
              <View style={[styles.badge, { backgroundColor: badgeBg }]}>
                {icon ? (
                  <Icon name={icon} size={16} color="#FFFFFF" />
                ) : (
                  <Txt variant="small" style={{ fontWeight: '800' }}>
                    {LETTERS[pos]}
                  </Txt>
                )}
              </View>
              <Txt style={[typeScale.bodyStrong, { color: fg, flex: 1 }]}>{L(pq.question.choices[choiceIndex])}</Txt>
            </Pressable>
          );
        })}
      </View>
    </Animated.View>
  );
}

export function RevealPanel({
  pq,
  revealed,
  nextLabel,
  onNext,
  badge,
  children,
}: {
  pq: PlayableQuestion;
  revealed: AnswerLog;
  nextLabel: string;
  onNext: () => void;
  /** Short text on the right of the title, e.g. "+142 pts" or "−1 life". */
  badge?: string;
  /** Extra content between the fact and the button (sponsor message, street stats). */
  children?: ReactNode;
}) {
  const { colors } = useTheme();
  const { t, L } = useT();
  const titles: Record<AnswerMark, StringKey> = {
    correct: 'quiz.correct',
    wrong: 'quiz.wrong',
    timeout: 'quiz.timeout',
  };
  const good = revealed.mark === 'correct';
  return (
    <View
      style={[
        styles.reveal,
        { backgroundColor: good ? colors.successSoft : colors.dangerSoft, borderColor: good ? colors.success : colors.danger },
      ]}
    >
      <View style={styles.revealTop}>
        <Txt variant="heading" tone={good ? 'success' : 'danger'}>
          {t(titles[revealed.mark])}
        </Txt>
        {badge && (
          <Txt variant="bodyStrong" tone={good ? 'success' : 'danger'}>
            {badge}
          </Txt>
        )}
      </View>
      <Txt tone="text">{L(pq.question.fact)}</Txt>
      {children}
      <Button label={nextLabel} onPress={onNext} icon="arrow-forward" />
    </View>
  );
}

const styles = StyleSheet.create({
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  timerTrack: { flex: 1, height: 8, borderRadius: radius.pill, overflow: 'hidden' },
  timerFill: { height: '100%', borderRadius: radius.pill },
  timerText: { width: 30, textAlign: 'right', fontVariant: ['tabular-nums'] },
  dots: { flexDirection: 'row', gap: 4, flex: 1 },
  dot: { flex: 1, height: 6, borderRadius: 3 },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: 58,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
  badge: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  reveal: { borderRadius: radius.lg, borderWidth: 1.5, padding: space.lg, gap: space.md },
  revealTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
});
