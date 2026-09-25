import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  BackHandler,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import MainMenuArtwork from '../components/MainMenuArtwork';
// @ts-ignore SettingsScreen is maintained as JSX.
import SettingsScreen from '../components/SettingsScreen';

export default function MainMenuScreen() {
  const router = useRouter();
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [exitPromptVisible, setExitPromptVisible] = useState(false);

  const handlePlay = () => {
    router.push('/level-select');
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
    <MainMenuArtwork>
      <SafeAreaView style={styles.container}>
        <TouchableOpacity
          style={styles.debugButton}
          onPress={handleReturnToSplash}
          activeOpacity={0.8}
        >
          <Text style={styles.debugButtonText}>(for test) return to splash</Text>
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

      <Modal
        visible={settingsVisible}
        transparent
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
    top: 60,
    left: 20,
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
    marginBottom: 280, // Adjusted from 550 so it stays safely within view on mobile
    marginLeft: 145,
  },
  playButton: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  playText: {
    fontSize: 50,
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
    marginLeft: 200,
    transform: [{ translateY: 60 }], // Reduced from 100 so it doesn't get clipped past the bottom edge
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
    width: 48,
    height: 48,
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