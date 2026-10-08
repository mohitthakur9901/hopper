import { ActivityIndicator, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { ThemedText } from './themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

type PrimaryButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle | ViewStyle[];
};

export function PrimaryButton({ title, onPress, disabled, loading, style }: PrimaryButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: theme.text },
        (pressed || disabled) && styles.pressed,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={theme.background} />
      ) : (
        <ThemedText type="default" style={[styles.text, { color: theme.background }]}>
          {title}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 64,
    borderRadius: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    width: '100%',
  },
  text: {
    fontWeight: '600',
    fontSize: 18,
  },
  pressed: {
    opacity: 0.7,
  },
});
