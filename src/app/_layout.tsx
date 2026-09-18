import { Stack } from 'expo-router';
import { AudioProvider } from '../AudioContext';
export default function RootLayout() {
  return (
    <AudioProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AudioProvider>
  );
}
