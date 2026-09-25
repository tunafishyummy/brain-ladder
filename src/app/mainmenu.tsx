import { useRouter } from 'expo-router';
import {
  BackHandler,
  Image,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import MainMenuArtwork from '../components/MainMenuArtwork';

export default function MainMenuScreen() {
  const router = useRouter();
  const handlePlay = () => {
    router.push('/level-select');
  };

  const handleSettings = () => {
    router.push('/settings');
  };

  const handleReturnToSplash = () => {
    router.replace('/');
  };

  const handleExit = () => {
    if (Platform.OS === 'web') {
      window.close();
    } else if (Platform.OS === 'android') {
      BackHandler.exitApp();
    }
  };

  return (
    <MainMenuArtwork>
      <SafeAreaView style={styles.container}>
        <TouchableOpacity
          style={styles.debugButton}
          onPress={handleReturnToSplash}
          activeOpacity={0.8}
        >
          <Text style={styles.debugButtonText}>(DEBUG) return to splash</Text>
        </TouchableOpacity>

        <View style={styles.playContainer}>
          <TouchableOpacity
            style={styles.playButton}
            onPress={handlePlay}
            activeOpacity={0.8}
          >
            <Text style={styles.playText}>PLAY</Text>
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

          <View pointerEvents="none" style={styles.iconDivider} />

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
    </MainMenuArtwork>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    zIndex: 2,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  debugButton: {
    position: 'absolute',
    top: 150,
    left: 10,
    zIndex: 3,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#facc15',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    elevation: 8,
  },
  debugButtonText: {
    color: '#111827',
    fontWeight: '900',
    fontSize: 13,
  },
  playContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 550,
    marginLeft: 100,
  },
  playButton: {
    paddingHorizontal: 20,
    paddingVertical: 16,
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
    marginBottom: -100,
    marginLeft:200,
    transform: [{ translateY: 100 }],
  },
  iconDivider: {
    width: 2,
    height: 56,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  iconButton: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 48,
    height: 48,
    resizeMode: 'contain',
  },
});
