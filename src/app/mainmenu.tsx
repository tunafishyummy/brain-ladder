import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  Easing,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import MainMenuArtwork from '../components/MainMenuArtwork';
import { useScreenTransition } from '../TransitionContext';
// @ts-ignore SettingsScreen is maintained as JSX.
import SettingsScreen from '../components/SettingsScreen';

export default function MainMenuScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const artworkWidth = Math.min(width, height * (9 / 20));
  const controlSize = Math.min(52, artworkWidth * 0.14);
  const playFontSize = Math.min(50, artworkWidth * 0.14);
  const { fadeThroughBlack } = useScreenTransition();
  const zoomProgress = useRef(new Animated.Value(0)).current;
  const transitionStarted = useRef(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [exitPromptVisible, setExitPromptVisible] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [zoomAnchor, setZoomAnchor] = useState<{ x: number; y: number }>();

  useFocusEffect(
    useCallback(() => {
      if (transitionStarted.current) {
        zoomProgress.setValue(0);
        transitionStarted.current = false;
        setIsTransitioning(false);
      }
    }, [zoomProgress]),
  );

  const handlePlay = () => {
    if (transitionStarted.current) return;

    transitionStarted.current = true;
    setIsTransitioning(true);

    Animated.timing(zoomProgress, {
      toValue: 1,
      duration: 780,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        fadeThroughBlack(() => router.push('/level-select'));
      } else {
        transitionStarted.current = false;
        zoomProgress.setValue(0);
        setIsTransitioning(false);
      }
    });
  };

  const handleSettings = () => {
    setSettingsVisible(true);
  };

  const handleReturnToSplash = () => {
    router.replace('/');
  };

  const handleExit = () => {
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
          style={[styles.debugButton, { top: insets.top + 12 }]}
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
            <Text style={[styles.playText, { fontSize: playFontSize }]}>PLAY</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.bottomRow, { right: '7%', bottom: '2%', gap: artworkWidth * 0.045 }]}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleSettings}
            activeOpacity={0.6}
          >
            <Image
              source={require('@/assets/images/settings.png')}
              style={[styles.icon, { width: controlSize, height: controlSize }]}
            />
          </TouchableOpacity>

          <View pointerEvents="none" style={[styles.iconDivider, { height: controlSize + 20 }]} />

          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleExit}
            activeOpacity={0.6}
          >
            <Image
              source={require('@/assets/images/door.png')}
              style={[styles.icon, { width: controlSize, height: controlSize }]}
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
  container: {
    flex: 1,
    zIndex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  debugButton: {
    position: 'absolute',
    top: 12,
    left: 12,
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
    fontSize: 11,
  },
  playContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  playText: {
    fontWeight: 'bold',
    color: '#FFD700',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
  },
  bottomRow: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconDivider: {
    width: 2,
    height: 70,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  iconButton: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    resizeMode: 'contain',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  settingsModal: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    overflow: 'hidden',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3b4b73',
    backgroundColor: 'rgba(17,22,37,0.98)',
  },
  exitModal: {
    width: '100%',
    maxWidth: 360,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#252f47',
    backgroundColor: 'rgba(24,31,48,0.98)',
    gap: 16,
  },
  exitTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  exitActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  exitButton: {
    minWidth: 90,
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b4b73',
    backgroundColor: '#252d42',
  },
  exitButtonText: { color: '#fff', fontWeight: 'bold' },
});
