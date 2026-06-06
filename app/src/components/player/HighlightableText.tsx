import { Text, StyleSheet, type StyleProp, type TextStyle } from 'react-native';
import { colors } from '@/theme/colors';

// Texto com destaque (highlight) por palavra — funciona em web e nativo.
// Quando `enabled`, tocar uma palavra alterna o destaque (estilo UWorld).
export function HighlightableText({
  text,
  highlighted,
  onToggle,
  enabled,
  style,
}: {
  text: string;
  highlighted: Set<number>;
  onToggle: (index: number) => void;
  enabled: boolean;
  style?: StyleProp<TextStyle>;
}) {
  const tokens = text.split(/(\s+)/);
  return (
    <Text style={style} selectable>
      {tokens.map((tok, i) => {
        if (/^\s+$/.test(tok)) return <Text key={i}>{tok}</Text>;
        const on = highlighted.has(i);
        return (
          <Text
            key={i}
            onPress={enabled ? () => onToggle(i) : undefined}
            style={on ? styles.hl : undefined}
          >
            {tok}
          </Text>
        );
      })}
    </Text>
  );
}

const styles = StyleSheet.create({
  hl: { backgroundColor: colors.accent, color: colors.bgDark },
});
