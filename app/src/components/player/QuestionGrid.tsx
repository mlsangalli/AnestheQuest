import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '@/theme/colors';

export type CellStatus = 'unanswered' | 'correct' | 'incorrect' | 'answered';

// Grade numerada de navegação com marcadores de status (estilo prova).
export function QuestionGrid({
  statuses,
  flagged,
  current,
  reveal,
  onSelect,
}: {
  statuses: CellStatus[];
  flagged: boolean[];
  current: number;
  reveal: boolean;
  onSelect: (index: number) => void;
}) {
  return (
    <View style={styles.grid}>
      {statuses.map((st, i) => {
        const isCurrent = i === current;
        return (
          <Pressable
            key={i}
            onPress={() => onSelect(i)}
            style={[
              styles.cell,
              reveal && st === 'correct' && styles.correct,
              reveal && st === 'incorrect' && styles.incorrect,
              !reveal && st !== 'unanswered' && styles.answered,
              isCurrent && styles.current,
            ]}
          >
            <Text style={[styles.num, isCurrent && styles.numCurrent]}>{i + 1}</Text>
            {flagged[i] && <View style={styles.flag} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  cell: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  answered: { backgroundColor: '#E8F2FD', borderColor: colors.primary },
  correct: { backgroundColor: '#E6F4EA', borderColor: colors.correct },
  incorrect: { backgroundColor: '#FCE8E8', borderColor: colors.incorrect },
  current: { borderWidth: 2, borderColor: colors.bgDark },
  num: { fontWeight: '600', color: colors.textPrimary },
  numCurrent: { color: colors.bgDark },
  flag: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
});
