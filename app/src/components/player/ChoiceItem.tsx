import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '@/theme/colors';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export function ChoiceItem({
  index,
  texto,
  selected,
  struck,
  reveal,
  isCorrect,
  onSelect,
  onToggleStrike,
}: {
  index: number;
  texto: string;
  selected: boolean;
  struck: boolean;
  reveal: boolean;
  isCorrect: boolean;
  onSelect: () => void;
  onToggleStrike: () => void;
}) {
  // cor de fundo após revelar
  let tone: 'idle' | 'selected' | 'correct' | 'wrong' = 'idle';
  if (reveal) {
    if (isCorrect) tone = 'correct';
    else if (selected) tone = 'wrong';
  } else if (selected) {
    tone = 'selected';
  }

  return (
    <Pressable
      onPress={onSelect}
      disabled={reveal}
      style={[
        styles.row,
        tone === 'selected' && styles.selected,
        tone === 'correct' && styles.correct,
        tone === 'wrong' && styles.wrong,
      ]}
    >
      <View
        style={[
          styles.letter,
          tone === 'correct' && styles.letterCorrect,
          tone === 'wrong' && styles.letterWrong,
          tone === 'selected' && styles.letterSelected,
        ]}
      >
        <Text style={styles.letterText}>{LETTERS[index] ?? index + 1}</Text>
      </View>
      <Text style={[styles.text, struck && styles.struck]}>{texto}</Text>
      {reveal ? (
        <Text style={styles.mark}>{isCorrect ? '✓' : selected ? '✗' : ''}</Text>
      ) : (
        <Pressable onPress={onToggleStrike} hitSlop={8} style={styles.strikeBtn}>
          <Text style={[styles.strikeIcon, struck && styles.strikeIconOn]}>⌫</Text>
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  selected: { borderColor: colors.primary, backgroundColor: '#E8F2FD' },
  correct: { borderColor: colors.correct, backgroundColor: '#E6F4EA' },
  wrong: { borderColor: colors.incorrect, backgroundColor: '#FCE8E8' },
  letter: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  letterCorrect: { backgroundColor: colors.correct, borderColor: colors.correct },
  letterWrong: { backgroundColor: colors.incorrect, borderColor: colors.incorrect },
  letterText: { fontWeight: '700', color: colors.textPrimary },
  text: { flex: 1, color: colors.textPrimary, fontSize: 15, lineHeight: 21 },
  struck: { textDecorationLine: 'line-through', color: colors.textLight },
  mark: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  strikeBtn: { padding: spacing.xs },
  strikeIcon: { fontSize: 16, color: colors.textLight },
  strikeIconOn: { color: colors.incorrect },
});
