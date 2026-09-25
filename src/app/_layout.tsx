import { Stack } from 'expo-router';
import { Image } from 'react-native';
import { AudioProvider } from '../AudioContext';

if (!(Image as any).resolveAssetSource) {
  (Image as any).resolveAssetSource = (source: any) => source;
}

export default function RootLayout() {
  return (
    <AudioProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AudioProvider>
  );
}