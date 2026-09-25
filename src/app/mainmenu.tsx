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
import { LOGO_LAYOUT } from '../constants/logoLayout';
import BookcaseBackground from '../components/BookcaseBackground';

export default function MainMenuScreen() {
  const router = useRouter();
  const adderRotateAnim = useRef(new Animated.Value(0)).current;
  const brainLadderRotateAnim = useRef(new Animated.Value(0)).current;
  const ladRotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createRockingAnimation = (
      animation: Animated.Value,
      initialDelay: number,
      duration: number,
    ) => Animated.loop(
      Animated.sequence([
        Animated.delay(initialDelay),
        Animated.timing(animation, {
          toValue: 0.2, //Strongness of the rotation to the right
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(animation, {
          toValue: -0.2, //Strongness of the rotation to the left
          duration: duration + 150,
          useNativeDriver: true,
        }),
        Animated.timing(animation, {
          toValue: 0, //Reset rotation to the center
          duration: duration - 100,
          useNativeDriver: true,
        }),
      ])
    );

    const adderRotate = createRockingAnimation(adderRotateAnim, 0, 900);
    const brainLadderRotate = createRockingAnimation(brainLadderRotateAnim, 150, 1000);
    const ladRotate = createRockingAnimation(ladRotateAnim, 300, 1100);

    adderRotate.start();
    brainLadderRotate.start();
    ladRotate.start();

    return () => {
      adderRotate.stop();
      brainLadderRotate.stop();
      ladRotate.stop();
    };
  }, [adderRotateAnim, brainLadderRotateAnim, ladRotateAnim]);

  const adderRotation = adderRotateAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-10deg', '0deg', '10deg'],
  });
  const brainLadderRotation = brainLadderRotateAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-10deg', '0deg', '10deg'],
  });
  const ladRotation = ladRotateAnim.interpolate({
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
    <BookcaseBackground>
      <View pointerEvents="none" style={styles.overlay} />
      <SafeAreaView style={styles.container}>
        <View style={styles.logoContainer}>
          <View style={styles.logoStack}>
            <Animated.Image
              source={require('@/assets/images/LogoLad.png')}
              style={[styles.logoLayer, {
                left: LOGO_LAYOUT.layers.lad.left,
                top: LOGO_LAYOUT.layers.lad.top,
                transform: [{ scale: LOGO_LAYOUT.layers.lad.scale }, { rotate: ladRotation }],
              }]}
              resizeMode="contain"
            />
            <Animated.Image
              source={require('@/assets/images/LogoBrainLadder.png')}
              style={[styles.logoLayer, {
                left: LOGO_LAYOUT.layers.brainLadder.left,
                top: LOGO_LAYOUT.layers.brainLadder.top,
                transform: [{ scale: LOGO_LAYOUT.layers.brainLadder.scale }, { rotate: brainLadderRotation }],
              }]}
              resizeMode="contain"
            />
            <Animated.Image
              source={require('@/assets/images/LogoKnowItAdder.png')}
              style={[styles.logoLayer, {
                left: LOGO_LAYOUT.layers.adder.left,
                top: LOGO_LAYOUT.layers.adder.top,
                transform: [{ scale: LOGO_LAYOUT.layers.adder.scale }, { rotate: adderRotation }],
              }]}
              resizeMode="contain"
            />
          </View>
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
  logoStack: {
    width: LOGO_LAYOUT.stackWidth,
    alignSelf: 'center',
    aspectRatio: LOGO_LAYOUT.stackAspectRatio,
  },
  logoLayer: {
    position: 'absolute',
    height: '100%',
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
