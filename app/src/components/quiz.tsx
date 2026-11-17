import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useT, type StringKey } from '@/i18n';
import type { PlayableQuestion } from '@/lib/daily';
import type { AnswerMark } from '@/lib/scoring';
import type { AnswerLog } from '@/store/useGameStore';
import { radius, space, type as typeScale } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import { DifficultyBadge } from './difficulty';
import { FadeInUp, Pop, PopIn, PressableScale, Pulse, Shake } from './motion';
import { Button, Icon, ProgressBar, Txt } from './ui';

export function TimerBar({ remaining, limit, stopped }: { remaining: number; limit: number; stopped?: boolean }) {
  const { colors } = useTheme();
  const urgent = remaining <= 5000 && !stopped;
  return (
    <View style={styles.timerRow}>
      <ProgressBar
        value={remaining}
        max={limit}
        color={stopped ? colors.textMuted : urgent ? colors.danger : colors.primary}
        durationMs={120}
        linear
        style={{ flex: 1 }}
      />
      <Pulse active={urgent} to={1.18}>
        <Txt variant="small" tone={urgent ? 'danger' : 'muted'} style={styles.timerText}>
          {stopped ? '' : `${Math.ceil(remaining / 1000)}s`}
        </Txt>
      </Pulse>
    </View>
  );
}

/** One short bar per question, showing progress through the round. */
export function ProgressDots({ marks, total, current }: { marks: AnswerMark[]; total: number; current: number }) {
  const { colors } = useTheme();
  const colorFor = (m: AnswerMark) =>
    m === 'correct' ? colors.success : m === 'wrong' ? colors.danger : colors.textMuted;
  return (
    <View style={styles.dots}>
      {Array.from({ length: total }, (_, i) => {
        const isCurrent = i === current && i >= marks.length;
        return (
          <Pop key={i} trigger={i < marks.length ? marks[i] : isCurrent} style={{ flex: 1 }}>
            <View
              style={[
                styles.dot,
                { backgroundColor: i < marks.length ? colorFor(marks[i]) : colors.surfaceAlt },
                isCurrent && { backgroundColor: colors.primary, transform: [{ scaleY: 1.4 }] },
              ]}
            />
          </Pop>
        );
      })}
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
  const { colors, cat } = useTheme();
  const { L, t } = useT();
  const id = pq.question.id;

  return (
    <View style={{ gap: space.lg }}>
      <FadeInUp key={id} style={{ gap: space.sm }}>
        <View style={styles.labelRow}>
          <Txt variant="tiny" style={{ flexShrink: 1, color: label ? colors.sponsor : cat[pq.question.category].fg }}>
            {(label ?? t(`cat.${pq.question.category}` as StringKey)).toUpperCase()}
          </Txt>
          <DifficultyBadge level={pq.question.difficulty} />
        </View>
        <Txt variant="question">{L(pq.question.text)}</Txt>
      </FadeInUp>
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
            badgeBg = colors.successStrong;
            icon = 'checkmark';
          } else if (revealed && isPicked) {
            bg = colors.dangerSoft;
            border = colors.danger;
            badgeBg = colors.dangerStrong;
            icon = 'close';
          } else if (revealed) {
            fg = colors.textMuted;
          }
          return (
            // Keyed by question, so each new question's answers arrive one after another.
            <FadeInUp key={`${id}:${choiceIndex}`} index={pos + 1}>
              <Shake trigger={!!revealed && isPicked && !isCorrect}>
                <Pop trigger={!!revealed && isCorrect}>
                  <PressableScale
                    accessibilityRole="button"
                    disabled={!!revealed || isHidden}
                    onPress={() => onPick(choiceIndex)}
                    scaleTo={0.975}
                    style={[
                      styles.choice,
                      { backgroundColor: bg, borderColor: border, opacity: isHidden ? 0.25 : 1 },
                    ]}
                    pressedStyle={{ backgroundColor: colors.surfaceAlt }}
                  >
                    <View style={[styles.badge, { backgroundColor: badgeBg }]}>
                      {icon ? (
                        <PopIn>
                          <Icon name={icon} size={16} color={colors.onAccent} />
                        </PopIn>
                      ) : (
                        <Txt variant="small" style={{ fontWeight: '800' }}>
                          {LETTERS[pos]}
                        </Txt>
                      )}
                    </View>
                    <Txt style={[typeScale.bodyStrong, { color: fg, flex: 1 }]}>{L(pq.question.choices[choiceIndex])}</Txt>
                  </PressableScale>
                </Pop>
              </Shake>
            </FadeInUp>
          );
        })}
      </View>
    </View>
  );
}

/**
 * What shows after an answer is picked, top to bottom: the ad, the Next button, then the
 * right/wrong panel with the explanation.
 */
export function AnswerReveal({
  ad,
  nextLabel,
  onNext,
  ...panel
}: {
  /** The banner from `useQuizAd`, or null. */
  ad?: ReactNode;
  nextLabel: string;
  onNext: () => void;
} & Parameters<typeof RevealPanel>[0]) {
  return (
    <View style={{ gap: space.lg }}>
      {ad}
      <FadeInUp distance={24}>
        <Button label={nextLabel} onPress={onNext} icon="arrow-forward" kind="ink" />
      </FadeInUp>
      <RevealPanel {...panel} />
    </View>
  );
}

export function RevealPanel({
  pq,
  revealed,
  badge,
  children,
}: {
  pq: PlayableQuestion;
  revealed: AnswerLog;
  /** Short text on the right of the title, e.g. "+142 pts" or "−1 life". */
  badge?: string;
  /** Extra content below the fact (sponsor message, street stats). */
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
    <FadeInUp
      distance={24}
      style={[
        styles.reveal,
        { backgroundColor: good ? colors.successSoft : colors.dangerSoft, borderColor: good ? colors.success : colors.danger },
      ]}
    >
      <View style={styles.revealTop}>
        <View style={styles.revealTitle}>
          <Icon name={good ? 'checkmark-circle' : 'close-circle'} size={22} color={good ? colors.success : colors.danger} />
          <Txt variant="heading" tone={good ? 'success' : 'danger'}>
            {t(titles[revealed.mark])}
          </Txt>
        </View>
        {badge && (
          <PopIn delay={160}>
            <Txt variant="bodyStrong" tone={good ? 'success' : 'danger'}>
              {badge}
            </Txt>
          </PopIn>
        )}
      </View>
      <Txt tone="text">{L(pq.question.fact)}</Txt>
      {children}
    </FadeInUp>
  );
}

const styles = StyleSheet.create({
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  timerText: { width: 30, textAlign: 'right', fontVariant: ['tabular-nums'] },
  dots: { flexDirection: 'row', gap: 4, flex: 1 },
  dot: { height: 6, borderRadius: 3 },
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
  revealTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm },
  revealTitle: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
});
