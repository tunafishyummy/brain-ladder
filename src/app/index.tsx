import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAudio } from '../AudioContext';
import AnimatedLogoStack from '../components/AnimatedLogoStack';
import BookcaseBackground from '../components/BookcaseBackground';

export default function SplashScreen() {
  const router = useRouter();
  const { startAudio } = useAudio();

  useEffect(() => {
    // Set duration for splash screen in milliseconds (3000ms = 3 seconds)
    const timer = setTimeout(() => {
      startAudio();
      router.replace('/mainmenu');
    }, 3000);

    // Clean up timer if component unmounts
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.screenWrapper}>
      <BookcaseBackground>
        <View style={styles.contentContainer}>
          <View style={styles.logoContainer}>
            <AnimatedLogoStack />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ffffff" style={styles.spinner} />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </View>
      </BookcaseBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 60,
  },
  logoContainer: {
    alignItems: 'center',
    width: '100%',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  spinner: {
    transform: [{ scale: 1.2 }],
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'rgb(220, 220, 220)',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 6,
  },
});