import { StyleSheet, View } from 'react-native';
import { ThemedText } from './themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

export function ErrorBanner({ message }: { message: string | null }) {
  const theme = useTheme();
  
  if (!message) return null;

  return (
    <View style={[styles.banner, { backgroundColor: theme.reject }]}>
      <ThemedText type="small" style={{ color: theme.onReject, fontWeight: '500' }}>
        {message}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderLeftWidth: 4,
    borderLeftColor: '#B71C1C', // Strong red accent for error
    marginBottom: Spacing.three,
  },
});
