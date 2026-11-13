import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import { Button, Txt } from './ui';

/** Cross-platform confirm dialog (React Native's Alert has no buttons on web). */
export function ConfirmDialog({
  visible,
  title,
  body,
  confirmLabel,
  cancelLabel,
  destructive,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={[styles.backdrop, { backgroundColor: colors.overlay }]} onPress={onCancel}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.surface }]} onPress={() => {}}>
          <Txt variant="heading">{title}</Txt>
          <Txt tone="muted">{body}</Txt>
          <View style={styles.actions}>
            <Button label={cancelLabel} kind="secondary" onPress={onCancel} style={{ flex: 1 }} />
            <Button
              label={confirmLabel}
              onPress={onConfirm}
              style={[{ flex: 1 }, destructive && { backgroundColor: colors.danger }]}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', padding: space.xl },
  sheet: { borderRadius: radius.lg, padding: space.xl, gap: space.md, maxWidth: 440, width: '100%', alignSelf: 'center' },
  actions: { flexDirection: 'row', gap: space.md, marginTop: space.sm },
});
