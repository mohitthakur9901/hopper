import { StyleSheet, View } from 'react-native';
import { ThemedText } from './themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Decision } from '@/lib/types';
import { Spacing } from '@/constants/theme';

type DecisionBadgeProps = {
  decision?: Decision;
};

export function DecisionBadge({ decision }: DecisionBadgeProps) {
  const theme = useTheme();
  
  if (!decision) {
    return (
      <View style={[styles.badge, { backgroundColor: theme.backgroundElement }]}>
        <ThemedText type="smallBold" style={{ color: theme.textSecondary }}>PENDING</ThemedText>
      </View>
    );
  }

  const bgColor = decision === 'PASS' ? theme.pass : decision === 'HOLD' ? theme.hold : theme.reject;
  const textColor = decision === 'PASS' ? theme.onPass : decision === 'HOLD' ? theme.onHold : theme.onReject;

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }]}>
      <ThemedText type="smallBold" style={{ color: textColor }}>
        {decision}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Spacing.one,
    alignSelf: 'flex-start',
  },
});
