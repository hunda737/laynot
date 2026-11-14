import type { ReactNode } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { radius, space, type as typeScale } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import { Txt } from './ui';

/** A labelled text box with an optional error line and a button beside it. */
export function Field({
  label,
  error,
  right,
  multiline,
  style,
  ...input
}: TextInputProps & { label: string; error?: string | null; right?: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: space.sm }}>
      <Txt variant="small" style={{ fontWeight: '700' }}>
        {label}
      </Txt>
      <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' }}>
        <TextInput
          placeholderTextColor={colors.textMuted}
          multiline={multiline}
          {...input}
          style={[
            styles.input,
            multiline ? typeScale.small : typeScale.bodyStrong,
            multiline && styles.multi,
            { color: colors.text, backgroundColor: colors.surface, borderColor: error ? colors.danger : colors.border },
            style,
          ]}
        />
        {right}
      </View>
      {error ? (
        <Txt variant="small" tone="danger">
          {error}
        </Txt>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: { flex: 1, minHeight: 54, borderRadius: radius.md, borderWidth: 1, paddingHorizontal: space.lg },
  multi: { minHeight: 110, paddingVertical: space.md, textAlignVertical: 'top' },
});
