import { useRouter } from 'expo-router';
import {
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { useAudio } from '../AudioContext';
import BookcaseBackground from '../components/BookcaseBackground';
import AnimatedLogoStack from '../components/AnimatedLogoStack';

export default function SplashScreen() {
  const router = useRouter();
  const { startAudio } = useAudio();
  const handlePress = () => {
    startAudio();
    router.replace('/mainmenu')
  };

  const handlePlay = () => {
    router.push('/game')
  };

  return (
    <TouchableWithoutFeedback onPress={handlePress}>
      <View style={styles.screenWrapper}>
        <BookcaseBackground>
          <View style={styles.contentContainer}>
            <View style={styles.logoContainer}>
            <AnimatedLogoStack />
            </View>
            <View style={styles.promptContainer}>
              <Text style={styles.promptText}>Press the screen to continue.</Text>
            </View>
          </View>
        </BookcaseBackground>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  background: {
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
  promptContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'rgb(187, 187, 187)',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 6,
  },
});
