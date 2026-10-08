import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router/stack';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth/login/index" />
        <Stack.Screen name="auth/signup/index" />
        <Stack.Screen name="inspection/new" />
        <Stack.Screen name="inspection/[id]/capture" />
        <Stack.Screen name="inspection/[id]/review" />
        <Stack.Screen name="inspection/[id]/processing" />
        <Stack.Screen name="inspection/[id]/result" />
        <Stack.Screen name="inspection/[id]/media/[mediaId]" />
      </Stack>
    </ThemeProvider>
  );
}
