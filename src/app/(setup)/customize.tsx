import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWoodKnock } from '../../audio/useWoodKnock';
import { TutorialTarget, useTutorial, useTutorialScene } from '../../components/TutorialOverlay';
import { getWoodframeSource } from '../../components/woodframes';

const PADDING = 16;
const CARD_RADIUS = 16;

const COLOR_OPTIONS = [
  { id: 'blue', hex: '#4b7bec', label: 'Blue' },
  { id: 'red', hex: '#ff5252', label: 'Red' },
  { id: 'green', hex: '#26de81', label: 'Green' },
  { id: 'yellow', hex: '#fed330', label: 'Yellow' },
];

const DEFAULT_PLAYER_PREVIEW = require('../../../assets/images/Playergrey.png');
const PLAYER_PREVIEWS_BY_COLOR: Record<string, number> = {
  '#4b7bec': require('../../../assets/images/Playerblue.png'),
  '#ff5252': require('../../../assets/images/Playerred.png'),
  '#26de81': require('../../../assets/images/Playergreen.png'),
  '#fed330': require('../../../assets/images/Playeryellow.png'),
};

export default function CustomizeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    level?: string;
    difficulty?: string;
    timer?: string;
    players?: string;
  }>();
  const tutorial = useTutorial();
  useTutorialScene('customize');
  const playKnock = useWoodKnock();

  const totalPlayers = Math.min(3, Math.max(1, Number(params.players || 3)));

  const [players, setPlayers] = useState(
    [
      { id: 1, name: 'Player 1', color: '#16a34a' },
      { id: 2, name: 'Player 2', color: '#dc2626' },
      { id: 3, name: 'Player 3', color: '#2563eb' },
    ].slice(0, totalPlayers),
  );

  const handleSelectColor = (playerId: number, colorHex: string) => {
    playKnock();
    setPlayers((prev) =>
      prev.map((p) => (p.id === playerId ? { ...p, color: colorHex } : p))
    );
    tutorial.notify('color-changed', colorHex);
  };

  const handleStartGame = () => {
    tutorial.notify('screen-next');
    router.push({
      pathname: '/game',
      params: {
        ...params,
        players: String(players.length),
        playerColors: JSON.stringify(players.map((p) => p.color)),
      },
    });
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
            <Image
              source={require('../../../assets/images/Backbutton.png')}
              style={styles.backArrowImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <ImageBackground
            source={getWoodframeSource(params.level, '6to1')}
            resizeMode="stretch"
            style={styles.headerBanner}
          >
            <Text style={styles.headerTitle}>CUSTOMIZE PLAYERS</Text>
          </ImageBackground>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {players.map((player) => {
            const previewSource = PLAYER_PREVIEWS_BY_COLOR[player.color] ?? DEFAULT_PLAYER_PREVIEW;

            return (
              <ImageBackground
                key={player.id}
                source={getWoodframeSource(params.level, '4to1')}
                resizeMode="stretch"
                style={styles.playerCard}
              >
                <View style={styles.playerCardContent}>
                  <View style={styles.previewContainer}>
                    <Image source={previewSource} style={styles.playerPreviewImage} resizeMode="contain" />
                  </View>

                  <View style={styles.controlsSection}>
                    <Text style={styles.playerName}>{player.name}</Text>
                    <TutorialTarget id="color-picker">
                      <View style={styles.colorPalette}>
                        {COLOR_OPTIONS.map((c) => {
                          const isSelected = player.color === c.hex;
                          return (
                            <TouchableOpacity
                              key={c.id}
                              style={[
                                styles.colorSwatch,
                                { backgroundColor: c.hex },
                                isSelected && styles.colorSwatchSelected,
                              ]}
                              onPress={() => handleSelectColor(player.id, c.hex)}
                              activeOpacity={0.8}
                            />
                          );
                        })}
                      </View>
                    </TutorialTarget>
                  </View>
                </View>
              </ImageBackground>
            );
          })}
        </ScrollView>

        <TutorialTarget id="screen-next">
          <TouchableOpacity onPress={handleStartGame} activeOpacity={0.9}>
            <ImageBackground
              source={getWoodframeSource(params.level, '6to1')}
              resizeMode="stretch"
              style={styles.startButton}
            >
              <Text style={styles.startText}>START GAME</Text>
            </ImageBackground>
          </TouchableOpacity>
        </TutorialTarget>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%' },
  content: { flex: 1, width: '100%', maxWidth: 420, alignSelf: 'center', padding: PADDING, justifyContent: 'space-between' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backButton: { width: 48, height: 48, borderRadius: CARD_RADIUS, justifyContent: 'center', alignItems: 'center' },
  backArrowImage: { width: 44, height: 30, transform: [{ scale: 1.2 }] },
  headerBanner: { flex: 1, minHeight: 48, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#ffffff', fontSize: 18, fontWeight: '800', letterSpacing: 1.5, textAlign: 'center' },
  scroll: { flex: 1, marginVertical: PADDING },
  scrollContent: { flexGrow: 1, justifyContent: 'center', gap: PADDING },
  playerCard: { padding: PADDING, minHeight: 110 },
  playerCardContent: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  previewContainer: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  playerPreviewImage: { width: '100%', height: '100%' },
  controlsSection: { flex: 1, gap: 8 },
  playerName: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  colorPalette: { flexDirection: 'row', gap: 10 },
  colorSwatch: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: 'transparent' },
  colorSwatchSelected: { borderColor: '#ffffff', transform: [{ scale: 1.15 }] },
  startButton: { paddingVertical: 16, alignItems: 'center' },
  startText: { color: '#ffffff', fontSize: 18, fontWeight: '800', letterSpacing: 1 },
});