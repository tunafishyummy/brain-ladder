import { useRouter } from 'expo-router';
import {
  BackHandler,
  Image,
  ImageBackground,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function MainMenuScreen() {
  const router = useRouter();

  const handlePlay = () => {
    // Navigates to a game screen (e.g., src/app/game.tsx)
    router.push('/game');
  };

  const handleSettings = () => {
    // Navigates to a settings screen (e.g., src/app/settings.tsx)
    router.push('/settings');
  };

  const handleExit = () => {
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

{/* Styles for the main menu screen */}
const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 40,
  },
  logoContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  logo: {
    width: 260,
    height: 100,
  },
  playContainer: {
    alignItems: 'center',
    justifyContent: 'center',
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
    justifyContent: 'space-around',
    width: '60%',
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