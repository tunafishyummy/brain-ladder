import { Stack } from 'expo-router';

export default function SetupLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'none',
        contentStyle: { backgroundColor: 'transparent' },
      }}
    />
  );
}
