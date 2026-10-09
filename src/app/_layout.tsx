import { Stack } from 'expo-router';
import { Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
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
          <Stack screenOptions={{ headerShown: false }} />
        </TransitionProvider>
      </AudioProvider>
    </SafeAreaProvider>
  );
}
