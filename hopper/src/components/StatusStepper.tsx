import { StyleSheet, View } from 'react-native';
import { ThemedText } from './themed-text';
import { Status } from '@/lib/types';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { ActivityIndicator } from 'react-native';

const STEPS: { label: string; status: Status | 'DONE' }[] = [
  { label: 'Uploading images', status: 'UPLOADING' },
  { label: 'Queued for analysis', status: 'PROCESSING' },
  { label: 'Analyzing waste load', status: 'PROCESSING' },
  { label: 'Generating score', status: 'COMPLETED' },
];

export function StatusStepper({ currentStatus, error }: { currentStatus: Status; error: boolean }) {
  const theme = useTheme();

  // Map backend status to stepper index
  let activeIndex = 0;
  if (currentStatus === 'UPLOADING') activeIndex = 0;
  else if (currentStatus === 'PROCESSING') activeIndex = 2;
  else if (currentStatus === 'COMPLETED') activeIndex = 4; // all done
  else if (currentStatus === 'FAILED') activeIndex = -1;

  return (
    <View style={styles.container}>
      {STEPS.map((step, index) => {
        const isCompleted = activeIndex > index || currentStatus === 'COMPLETED';
        const isActive = activeIndex === index && !error;
        const isError = activeIndex === index && error;

        return (
          <View key={index} style={styles.stepRow}>
            <View style={styles.iconContainer}>
              {isCompleted ? (
                <View style={[styles.circle, { backgroundColor: theme.pass }]} />
              ) : isActive ? (
                <ActivityIndicator size="small" color={theme.text} />
              ) : isError ? (
                <View style={[styles.circle, { backgroundColor: theme.reject }]} />
              ) : (
                <View style={[styles.circle, { backgroundColor: theme.backgroundElement }]} />
              )}
            </View>
            <ThemedText 
              type={isActive || isError ? 'smallBold' : 'small'}
              style={{ color: isActive ? theme.text : isError ? theme.onReject : theme.textSecondary }}>
              {step.label}
            </ThemedText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.four,
    gap: Spacing.three,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});
