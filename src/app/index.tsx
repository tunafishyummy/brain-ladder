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
    console.log('Navigating to settings...');
    router.replace('/settings');
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
      source={require('@/assets/images/bookcase.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <View pointerEvents="none" style={styles.overlay} />
      <SafeAreaView style={styles.container}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/MainLogo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Play Button */}
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

        {/* Bottom Options */}
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
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: { position: 'absolute', inset: 0, zIndex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  container: {
    flex: 1,
    zIndex: 2,
    justifyContent: 'center',       // ← was 'space-between'
    alignItems: 'center',
    paddingVertical: 20,            // ← was 40
  },
  logoContainer: {
    marginBottom: -120,              // ← was marginTop: 20
    alignItems: 'center',
  },
  logo: {
    width: 600,
  },
  playContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,              // ← added small gap before icons
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
    justifyContent: 'center',      // ← was 'space-around'
    gap: 40,                       // ← fixed gap between icons
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
