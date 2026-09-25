import { Stack } from 'expo-router';
import { Image } from 'react-native';
import { AudioProvider } from '../AudioContext';
import { TransitionProvider } from '../TransitionContext';

if (!(Image as any).resolveAssetSource) {
  (Image as any).resolveAssetSource = (source: any) => source;
}

export default function RootLayout() {
  return (
    <AudioProvider>
      <TransitionProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </TransitionProvider>
    </AudioProvider>
  );
}
