import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { useAudio } from '../AudioContext';
import { LOGO_LAYOUT } from '../constants/logoLayout';
import BookcaseBackground from '../components/BookcaseBackground';

export default function SplashScreen() {
  const router = useRouter();
  const { startAudio } = useAudio();
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
          <View style={styles.overlay} />

          <View style={styles.contentContainer}>
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
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 60,
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
