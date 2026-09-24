import Slider from '@react-native-community/slider';
import { useState } from 'react';
import { Image, ImageBackground, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useAudio } from '../AudioContext';

export default function SettingsScreen({ onReturnToMenu }) {
  const {
    masterVol, setMasterVol,
    masterMute, setMasterMute,
    musicVol, setMusicVol,
    musicMute, setMusicMute,
    sfxVol, setSfxVol,
    sfxMute, setSfxMute,
  } = useAudio();

  const times = ['15s', '30s', '45s', '60s', '90s', '∞'];
  const [timeIdx, setTimeIdx] = useState(3);
  const [showHelp, setShowHelp] = useState(false);

  return (
    <ImageBackground 
      source={require('@/assets/images/bookcase.png')} 
      style={styles.bg} 
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onReturnToMenu} style={styles.backBtn}>
            <Text style={styles.btnText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>SETTINGS</Text>
          <View style={{ width: 30 }} />
        </View>

        {/* Audio Mixer */}
        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>AUDIO MIXER</Text>
          
          {/* Master Volume */}
          <View style={styles.sliderControl}>
            <View style={styles.row}>
              <Text style={styles.label}>MASTER VOL ({masterMute ? 0 : Math.round(masterVol)}%)</Text>
              <View style={styles.muteRow}>
                <Text style={styles.muteText}>MUTE</Text>
                <Switch 
                  value={masterMute} 
                  onValueChange={setMasterMute} 
                  trackColor={{ false: '#252f47', true: '#6366f1' }}
                />
              </View>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              value={masterMute ? 0 : masterVol}
              onValueChange={setMasterVol}
              disabled={masterMute}
              minimumTrackTintColor="#6366f1"
              maximumTrackTintColor="#1f283d"
              thumbTintColor="#818cf8"
            />
          </View>

          {/* Music Volume */}
          <View style={styles.sliderControl}>
            <View style={styles.row}>
              <Text style={styles.label}>MUSIC VOL ({musicMute ? 0 : Math.round(musicVol)}%)</Text>
              <View style={styles.muteRow}>
                <Text style={styles.muteText}>MUTE</Text>
                <Switch 
                  value={musicMute} 
                  onValueChange={setMusicMute} 
                  trackColor={{ false: '#252f47', true: '#6366f1' }}
                />
              </View>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              value={musicMute ? 0 : musicVol}
              onValueChange={setMusicVol}
              disabled={musicMute}
              minimumTrackTintColor="#6366f1"
              maximumTrackTintColor="#1f283d"
              thumbTintColor="#818cf8"
            />
          </View>

          {/* SFX Volume */}
          <View style={styles.sliderControl}>
            <View style={styles.row}>
              <Text style={styles.label}>SFX VOL ({sfxMute ? 0 : Math.round(sfxVol)}%)</Text>
              <View style={styles.muteRow}>
                <Text style={styles.muteText}>MUTE</Text>
                <Switch 
                  value={sfxMute} 
                  onValueChange={setSfxMute} 
                  trackColor={{ false: '#252f47', true: '#6366f1' }}
                />
              </View>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              value={sfxMute ? 0 : sfxVol}
              onValueChange={setSfxVol}
              disabled={sfxMute}
              minimumTrackTintColor="#6366f1"
              maximumTrackTintColor="#1f283d"
              thumbTintColor="#818cf8"
            />
          </View>
        </View>

        {/* Question Time & Rules */}
        <View style={styles.panel}>
          <View style={styles.stepperRow}>
            <TouchableOpacity 
              onPress={() => setTimeIdx((timeIdx - 1 + times.length) % times.length)} 
              style={styles.stepBtn}
            >
              <Text style={styles.btnText}>&lt;</Text>
            </TouchableOpacity>
            <Text style={styles.label}>QUESTION TIME ({times[timeIdx]})</Text>
            <TouchableOpacity 
              onPress={() => setTimeIdx((timeIdx + 1) % times.length)} 
              style={styles.stepBtn}
            >
              <Text style={styles.btnText}>&gt;</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => setShowHelp(!showHelp)} style={styles.helpBtn}>
            <Image 
              source={require('@/assets/images/book.png')} 
              style={styles.bookImg} 
              resizeMode="contain" 
            />
            <Text style={styles.label}>{showHelp ? "HIDE RULES" : "HOW TO PLAY"}</Text>
          </TouchableOpacity>

          {showHelp && (
            <View style={styles.rulesBox}>
              <Text style={styles.rulesText}>• Pass phone on each turn.</Text>
              <Text style={styles.rulesText}>• Land on ladders/snakes to trigger trivia.</Text>
              <Text style={styles.rulesText}>• Correct answers climb up; wrong answers slide down!</Text>
            </View>
          )}
        </View>

        {/* Return Button */}
        <TouchableOpacity onPress={onReturnToMenu} style={styles.returnBtn}>
          <Text style={styles.returnText}>RETURN TO MENU</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  container: {
    width: '90%',
    maxWidth: 360,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#181f30',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#252f47',
  },
  title: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  backBtn: {
    backgroundColor: '#252f47',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  panel: {
    backgroundColor: 'rgba(24, 31, 48, 0.95)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#252f47',
    gap: 8,
  },
  sectionTitle: {
    color: '#cbd5e1',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 'bold',
  },
  sliderControl: {
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  muteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  muteText: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: 'bold',
  },
  slider: {
    width: '100%',
    height: 30,
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#111625',
    padding: 8,
    borderRadius: 6,
  },
  label: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  stepBtn: {
    backgroundColor: '#1f283d',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  helpBtn: {
    backgroundColor: '#121724',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
    gap: 4,
  },
  bookImg: {
    width: 32,
    height: 32,
  },
  rulesBox: {
    backgroundColor: '#111625',
    padding: 8,
    borderRadius: 6,
    gap: 4,
  },
  rulesText: {
    color: '#94a3b8',
    fontSize: 10,
  },
  returnBtn: {
    backgroundColor: '#252d42',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3b4b73',
  },
  returnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 1,
  },
});