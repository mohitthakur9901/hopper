import { StyleSheet, View } from 'react-native';
import { ThemedText } from './themed-text';
import { useTheme } from '@/hooks/use-theme';

export function ScoreRing({ score }: { score: number }) {
  const theme = useTheme();

  let color: string = theme.pass;
  let textColor: string = theme.onPass;
  if (score < 60) {
    color = theme.reject;
    textColor = theme.onReject;
  } else if (score < 85) {
    color = theme.hold;
    textColor = theme.onHold;
  }

  return (
    <View style={[styles.ring, { borderColor: color, backgroundColor: color }]}>
      <ThemedText type="title" style={{ color: textColor }}>{score}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
