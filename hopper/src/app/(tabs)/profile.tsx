import { StyleSheet, View, Alert } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PrimaryButton } from '@/components/PrimaryButton';
import { removeAuthToken } from '@/lib/api';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const handleSignOut = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Sign Out", 
          style: "destructive",
          onPress: async () => {
            await removeAuthToken();
            router.replace('/auth/login' as any);
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top + Spacing.four, paddingBottom: insets.bottom + BottomTabInset + Spacing.four }]}>
      <View style={styles.header}>
        <ThemedText type="subtitle">Profile</ThemedText>
      </View>

      <View style={styles.content}>
        <ThemedView type="backgroundElement" style={styles.profileCard}>
          <View style={styles.avatarPlaceholder}>
            <ThemedText type="subtitle" style={{ color: theme.background }}>S</ThemedText>
          </View>
          <View style={styles.userInfo}>
            <ThemedText type="default" style={{ fontWeight: '600' }}>Supervisor</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">supervisor@hopperaudit.com</ThemedText>
          </View>
        </ThemedView>

        <View style={styles.actions}>
          <PrimaryButton 
            title="Sign Out" 
            onPress={handleSignOut} 
            style={{ backgroundColor: theme.reject }} 
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center' },
  header: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.four,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
  profileCard: {
    flexDirection: 'row',
    padding: Spacing.four,
    borderRadius: Spacing.three,
    alignItems: 'center',
    gap: Spacing.four,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  actions: {
    marginTop: Spacing.four,
  },
});
