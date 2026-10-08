import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { loadAuthToken } from '@/lib/api';
import { useTheme } from '@/hooks/use-theme';

export default function IndexScreen() {
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    async function checkAuth() {
      const token = await loadAuthToken();
      setIsAuthenticated(!!token);
      setIsReady(true);
    }
    checkAuth();
  }, []);

  if (!isReady) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.text} />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href={"/(tabs)/home" as any} />;
  } else {
    return <Redirect href="/auth/login" />;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
