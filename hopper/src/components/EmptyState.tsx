import { StyleSheet, View } from 'react-native';
import { ThemedText } from './themed-text';
import { Spacing } from '@/constants/theme';

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <View style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>{title}</ThemedText>
      <ThemedText type="default" themeColor="textSecondary" style={styles.description}>
        {description}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.five,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minHeight: 200,
  },
  title: {
    marginBottom: Spacing.one,
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
  },
});
