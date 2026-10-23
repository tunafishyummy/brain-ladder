import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAudioPlayer } from 'expo-audio';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  Easing,
  Image,
  Modal,
  Platform,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import Text from '../components/AdaptiveText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAudio } from '../AudioContext';
import MainMenuArtwork from '../components/MainMenuArtwork';
import { useScreenTransition } from '../TransitionContext';
// @ts-ignore SettingsScreen is maintained as JSX.
import SettingsScreen from '../components/SettingsScreen';

const CRUMBLY_WOOD_SOUND = require('../../assets/audio/crumbly-wood.mp3');
const PLAY_IMG = require('../../assets/images/Play.png');
const PLAY_GLOW_IMG = require('../../assets/images/play-glow.png');

export default function MainMenuScreen() {
  const router = useRouter();
  const crumblyPlayer = useAudioPlayer(CRUMBLY_WOOD_SOUND);
  const { masterVol, masterMute, sfxVol, sfxMute } = useAudio();
  const { width, height } = useWindowDimensions();
  const artworkWidth = Math.min(width, height * (9 / 20));
  const controlSize = Math.min(220, artworkWidth * 0.4);
  const playImageWidth = artworkWidth * 0.48;
  const playImageHeight = playImageWidth * (716 / 1549);
  const { fadeThroughBlack, setBookcaseLevel } = useScreenTransition();
  const zoomProgress = useRef(new Animated.Value(0)).current;
  const playRock = useRef(new Animated.Value(0)).current;
  const transitionStarted = useRef(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [exitPromptVisible, setExitPromptVisible] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [zoomAnchor, setZoomAnchor] = useState<{ x: number; y: number }>();

  useEffect(() => {
    const rocking = Animated.loop(
      Animated.sequence([
        Animated.timing(playRock, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(playRock, {
          toValue: -1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(playRock, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    rocking.start();
    return () => rocking.stop();
  }, [playRock]);

  const playRotation = playRock.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-2.5deg', '0deg', '2.5deg'],
  });

  useFocusEffect(
    useCallback(() => {
      // Always reset the zoom whenever the menu gets focus. It used to reset only while
      // transitionStarted was true, so a reset that fired while the screen was hidden
      // (the brief focus when the tutorial screen is replaced) used up the flag without
      // actually moving the native-driven zoom, and the menu came back stuck zoomed in.
      zoomProgress.stopAnimation();
      zoomProgress.setValue(0);
      transitionStarted.current = false;
      setIsTransitioning(false);
      // apply it once more after the screen has settled
      const frame = requestAnimationFrame(() => zoomProgress.setValue(0));
      return () => cancelAnimationFrame(frame);
    }, [zoomProgress]),
  );

  const handlePlay = async () => {
    if (transitionStarted.current) return;

    setBookcaseLevel(null);
    transitionStarted.current = true;
    setIsTransitioning(true);

    // First time playing: show the slideshow tutorial before level select.
    let hasSeenTutorial = false;
    try {
      hasSeenTutorial = (await AsyncStorage.getItem('@has_seen_game_tutorial')) === 'true';
    } catch (e) {
      // If storage can't be read, just go straight to the game.
      hasSeenTutorial = true;
    }

    Animated.timing(zoomProgress, {
      toValue: 1,
      duration: 780,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        fadeThroughBlack(() => router.push(hasSeenTutorial ? '/level-select' : '/tutorial'));
      } else {
        transitionStarted.current = false;
        zoomProgress.setValue(0);
        setIsTransitioning(false);
      }
    });
  };

  const playCrumblySound = () => {
    crumblyPlayer.volume = masterMute || sfxMute ? 0 : (masterVol / 100) * (sfxVol / 100);
    crumblyPlayer.seekTo(0);
    crumblyPlayer.play();
  };

  const handleSettings = () => {
    playCrumblySound();
    setSettingsVisible(true);
  };

  const handleReturnToSplash = () => {
    router.replace('/');
  };

  const handleExit = () => {
    playCrumblySound();
    setExitPromptVisible(true);
  };

  const confirmExit = () => {
    setExitPromptVisible(false);
    if (Platform.OS === 'web') {
      window.close();
    } else if (Platform.OS === 'android') {
      BackHandler.exitApp();
    }
  };

  return (
    <MainMenuArtwork
      zoomProgress={zoomProgress}
      zoomAnchor={zoomAnchor}
      isTransitioning={isTransitioning}
    >
      <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
        <TouchableOpacity
          style={styles.debugButton}
          onPress={handleReturnToSplash}
          activeOpacity={0.8}
        >
          <Text style={styles.debugButtonText}>(for test) return to splash</Text>
        </TouchableOpacity>

        <View
          style={[styles.playContainer, { top: '29%', left: '42.5%', width: '50%' }]}
          onLayout={({ nativeEvent: { layout } }) =>
            setZoomAnchor({ x: layout.x + layout.width / 2, y: layout.y + layout.height / 2 })
          }
        >
          <TouchableOpacity
            style={styles.playButton}
            onPress={handlePlay}
            disabled={isTransitioning}
            activeOpacity={0.8}
          >
            <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0 }}>
              <Image
                source={PLAY_GLOW_IMG}
                resizeMode="contain"
                style={[
                  styles.playGlowImage,
                  { width: playImageWidth, height: playImageHeight },
                ]}
              />
            </View>
            <Animated.Image
              source={PLAY_IMG}
              resizeMode="contain"
              style={[
                styles.playImage,
                {
                  width: playImageWidth,
                  height: playImageHeight,
                  transform: [{ rotate: playRotation }],
                },
              ]}
            />
          </TouchableOpacity>
        </View>

        <View style={[styles.bottomRow, { right: '-5%', bottom: '-3%', gap: 0.2 }]}>
          <TouchableOpacity
            style={[
              styles.iconButton,
              styles.settingsIconButton,
              { transform: [{ translateX: artworkWidth * 0.15 }] },
            ]}
            onPress={handleSettings}
            activeOpacity={0.6}
          >
            <Image
              source={require('@/assets/images/settings.png')}
              style={[styles.icon, { width: controlSize, height: controlSize, transform: [{ rotate: '-10deg' }] }]}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleExit}
            activeOpacity={0.6}
          >
            <Image
              source={require('@/assets/images/door.png')}
              style={[styles.icon, { width: controlSize, height: controlSize, transform: [{ rotate: '10deg' }] }]}
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <Modal
        visible={settingsVisible}
        transparent
        statusBarTranslucent
        navigationBarTranslucent
        presentationStyle="overFullScreen"
        animationType="fade"
        onRequestClose={() => setSettingsVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.settingsModal}>
            <SettingsScreen onReturnToMenu={() => setSettingsVisible(false)} />
          </View>
        </View>
      </Modal>

      <Modal
        visible={exitPromptVisible}
        transparent
        statusBarTranslucent
        navigationBarTranslucent
        presentationStyle="overFullScreen"
        animationType="fade"
        onRequestClose={() => setExitPromptVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.exitModal}>
            <Text style={styles.exitTitle}>Really Exit?</Text>
            <View style={styles.exitActions}>
              <TouchableOpacity style={styles.exitButton} onPress={confirmExit} activeOpacity={0.8}>
                <Text style={styles.exitButtonText}>YES</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.exitButton} onPress={() => setExitPromptVisible(false)} activeOpacity={0.8}>
                <Text style={styles.exitButtonText}>NO</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </MainMenuArtwork>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, zIndex: 2, justifyContent: 'flex-start', alignItems: 'center' },
  debugButton: { alignSelf: 'flex-start', marginTop: 12, marginLeft: 12, zIndex: 3, opacity: 0, backgroundColor: '#fff', borderWidth: 2, borderColor: '#facc15', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 9, elevation: 8 },
  debugButtonText: { color: '#111827', fontWeight: '900', fontSize: 11 },
  playContainer: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  playButton: { alignItems: 'center', justifyContent: 'center' },
  playImage: { alignSelf: 'center' },
  playGlowImage: { position: 'absolute', left: 0, top: 0 },
  bottomRow: { position: 'absolute', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  iconButton: { padding: 10, justifyContent: 'center', alignItems: 'center' },
  settingsIconButton: { paddingRight: -50 },
  icon: { resizeMode: 'contain' },
  modalBackdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: 'rgba(0,0,0,0.72)' },
  settingsModal: { width: '100%', maxWidth: 400, maxHeight: '90%', overflow: 'hidden', borderRadius: 10, borderWidth: 1, borderColor: '#3b4b73', backgroundColor: 'rgba(17,22,37,0.98)' },
  exitModal: { width: '100%', maxWidth: 360, padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#252f47', backgroundColor: 'rgba(24,31,48,0.98)', gap: 16 },
  exitTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  exitActions: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  exitButton: { minWidth: 90, alignItems: 'center', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#3b4b73', backgroundColor: '#252d42' },
  exitButtonText: { color: '#fff', fontWeight: 'bold' },
});
