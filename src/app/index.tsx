import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  Animated,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { useAudio } from '../AudioContext';

export default function SplashScreen() {
  const router = useRouter();
  const { startAudio } = useAudio();
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

  const handlePress = () => {
    startAudio();
    router.replace('/mainmenu');
  };

  return (
<<<<<<< HEAD
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
=======
    <TouchableWithoutFeedback onPress={handlePress}>
      <View style={styles.screenWrapper}>
        <ImageBackground
          source={require('@/assets/images/bookcase.png')}
          style={styles.background}
          resizeMode="cover"
        >
          <View style={styles.overlay} />
>>>>>>> 02569cac2c0e7807c524c171b8136144cc1d261e

          <View style={styles.contentContainer}>
            <View style={styles.logoContainer}>
              <Animated.Image
                source={require('@/assets/images/MainLogo.png')}
                style={[
                  styles.logo,
                  {
                    transform: [{ rotate: logoRotation }],
                  },
                ]}
                resizeMode="contain"
              />
            </View>
            <View style={styles.promptContainer}>
              <Text style={styles.promptText}>Press the screen to continue.</Text>
            </View>
          </View>
        </ImageBackground>
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
    width: '50%',
  },
  logo: {
    width: '50%',
    height: undefined,
    aspectRatio: 2,
    resizeMode: 'contain',
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