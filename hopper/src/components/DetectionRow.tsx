import { StyleSheet, View } from 'react-native';
import { ThemedText } from './themed-text';
import { Detection } from '@/lib/types';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

export function DetectionRow({ detection }: { detection: Detection }) {
  const theme = useTheme();

  return (
    <View style={[styles.row, { borderBottomColor: theme.backgroundSelected }]}>
      <View>
        <ThemedText type="smallBold">{detection.category}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">Confidence: {(detection.confidence * 100).toFixed(0)}%</ThemedText>
      </View>
      <View style={[styles.severityBadge, { 
        backgroundColor: detection.severity === 'CRITICAL' || detection.severity === 'HIGH' ? theme.reject : theme.hold 
      }]}>
        <ThemedText type="smallBold" style={{ 
          color: detection.severity === 'CRITICAL' || detection.severity === 'HIGH' ? theme.onReject : theme.onHold 
        }}>
          {detection.severity}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
  },
  severityBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Spacing.one,
  },
});
