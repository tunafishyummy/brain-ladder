import { useRouter } from 'expo-router';
// @ts-ignore
import SettingsScreen from '../components/SettingsScreen';

export default function SettingsRoute() {
  const router = useRouter();

  return (
    <SettingsScreen 
      onReturnToMenu={() => router.replace('/mainmenu')} 
    />
  );
}