import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AudioProvider } from '../AudioContext';
import { TransitionProvider } from '../TransitionContext';

if (!(Image as any).resolveAssetSource) {
  (Image as any).resolveAssetSource = (source: any) => source;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AudioProvider>
        <TransitionProvider>
          <StatusBar hidden />
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'fade',
              animationDuration: 650,
              contentStyle: { backgroundColor: '#000' },
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="tutorial" />
            <Stack.Screen name="(setup)" options={{ contentStyle: { backgroundColor: 'transparent' } }} />
          </Stack>
        </TransitionProvider>
      </AudioProvider>
    </SafeAreaProvider>
  );
}