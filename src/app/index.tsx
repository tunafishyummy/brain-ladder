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
  View,
} from 'react-native';

export default function MainMenuScreen() {
  const router = useRouter();

  const handlePlay = () => {
    router.push('/game');
  };

  const handleSettings = () => {
    router.push('/settings');
  };

  const handleExit = () => {
    if (Platform.OS === 'web'){
      window.close();
    } else if (Platform.OS === 'android') {
      
    }
    BackHandler.exitApp();
  };

  return (
    <ImageBackground
      source={require('../../assets/images/library.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/snake.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Play Button (Book) */}
        <View style={styles.playContainer}>
          <TouchableOpacity
            style={styles.playButton}
            onPress={handlePlay}
            activeOpacity={0.8}
          >
            <ImageBackground
              source={require('../../assets/images/book.png')}
              style={styles.bookImage}
              resizeMode="contain"
            >
              <Text style={styles.playText}>PLAY</Text>
            </ImageBackground>
          </TouchableOpacity>
        </View>

        {/* Bottom Options (Settings & Exit) */}
        <View style={styles.bottomRow}>
          <TouchableOpacity style={styles.iconButton} onPress={handleSettings}>
            <Image
              source={require('../../assets/images/settings.png')}
              style={styles.icon}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton} onPress={handleExit}>
            <Image
              source={require('../../assets/images/door.png')}
              style={styles.icon}
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    justifyContent: 'center',       // ← was 'space-between'
    alignItems: 'center',
    paddingVertical: 20,            // ← was 40
  },
  logoContainer: {
    marginBottom: 10,              // ← was marginTop: 20
    alignItems: 'center',
  },
  logo: {
    width: 260,
    height: 100,
  },
  playContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,              // ← added small gap before icons
  },
  playButton: {
    width: 250,
    height: 200,
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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFD700',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',      // ← was 'space-around'
    gap: 40,                       // ← fixed gap between icons
    marginBottom: 20,
  },
  iconButton: {
    padding: 10,
  },
  icon: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
  },
});   