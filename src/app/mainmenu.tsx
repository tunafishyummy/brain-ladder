import { useRouter } from 'expo-router';
import {
  BackHandler,
  Image,
  ImageBackground,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import BookcaseBackground from '../components/BookcaseBackground';
import AnimatedLogoStack from '../components/AnimatedLogoStack';

export default function MainMenuScreen() {
  const router = useRouter();
  const handlePlay = () => {
    router.push('/level-select');
  };

  const handleSettings = () => {
    router.push('/settings');
  };

  const handleExit = () => {
    if (Platform.OS === 'web') {
      window.close();
    } else if (Platform.OS === 'android') {
      BackHandler.exitApp();
    }
  };

  return (
    <BookcaseBackground>
      <View pointerEvents="none" style={styles.overlay} />
      <SafeAreaView style={styles.container}>
        <View style={styles.logoContainer}>
          <AnimatedLogoStack />
        </View>

        <View style={styles.playContainer}>
          <TouchableOpacity
            style={styles.playButton}
            onPress={handlePlay}
            activeOpacity={0.8}
          >
            <ImageBackground
              source={require('@/assets/images/book.png')}
              style={styles.bookImage}
              resizeMode="contain"
            >
              <Text style={styles.playText}>PLAY</Text>
            </ImageBackground>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomRow}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleSettings}
            activeOpacity={0.6}
          >
            <Image
              source={require('@/assets/images/settings.png')}
              style={styles.icon}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleExit}
            activeOpacity={0.6}
          >
            <Image
              source={require('@/assets/images/door.png')}
              style={styles.icon}
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </BookcaseBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    zIndex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  container: {
    flex: 1,
    zIndex: 2,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  logoContainer: {
    marginBottom: -120,
    alignItems: 'center',
    width: '100%',
  },
  playContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  playButton: {
    width: 200,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    marginBottom: 20,
  },
  iconButton: {
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 12,
    minWidth: 60,
    minHeight: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 48,
    height: 48,
    resizeMode: 'contain',
  },
});
