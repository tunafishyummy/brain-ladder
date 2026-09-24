import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  Animated,
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

export default function MainMenuScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0.1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const rotate = Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 0.2, //Strongness of the rotation to the right
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: -0.2, //Strongness of the rotation to the left
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0, //Reset rotation to the center
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    rotate.start();

    return () => {
      rotate.stop();
    };
  }, [fadeAnim, rotateAnim]);

  const logoRotation = rotateAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-10deg', '0deg', '10deg'],
  });

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
    <ImageBackground
      source={require('@/assets/images/bookcase.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <View pointerEvents="none" style={styles.overlay} />
      <SafeAreaView style={styles.container}>
        <View style={styles.logoContainer}>
          <Animated.Image
            source={require('@/assets/images/MainLogo.png')}
            style={[
              styles.logo,
              {
                transform: [{ rotate: logoRotation }],
              }
            ]}
            resizeMode="contain"
          />
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
    </ImageBackground>
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
    width: '50%',
  },
  logo: {
    width: '50%',
    height: undefined,
    aspectRatio: 2,
    resizeMode: 'contain',
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