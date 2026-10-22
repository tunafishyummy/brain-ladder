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

const PLAYER_OPTIONS = [
  { count: 1, label: '1 Player', subtitle: 'Solo Mode' },
  { count: 2, label: '2 Players', subtitle: 'Head to Head' },
  { count: 3, label: '3 Players', subtitle: 'Triple Threat' },
];

export default function PlayerSelectionScreen() {
  const router = useRouter();
  const tutorial = useTutorial();
  useTutorialScene('player-select');
  const playKnock = useWoodKnock();

  const params = useLocalSearchParams<{
    level?: string;
    difficulty?: string;
    timer?: string;
  }>();

  const [selectedCount, setSelectedCount] = useState<number>(2);

  const handleSelectCount = (count: number) => {
    playKnock();
    setSelectedCount(count);
    tutorial.notify('player-count-selected', String(count));
  };

  const handleNext = () => {
    tutorial.notify('screen-next');
    router.push({
      pathname: '/customize',
      params: {
        ...params,
        players: selectedCount,
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
            <Text style={styles.headerTitle}>NUMBER OF PLAYERS</Text>
          </ImageBackground>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.cardsContainer}>
            {PLAYER_OPTIONS.map((option) => {
              const isSelected = selectedCount === option.count;
              return (
                <TutorialTarget key={option.count} id="player-card">
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => handleSelectCount(option.count)}
                    style={[styles.cardWrapper, !isSelected && styles.unselectedCard]}
                  >
                    <ImageBackground
                      source={getWoodframeSource(params.level, '4to1')}
                      resizeMode="stretch"
                      style={styles.cardBackground}
                    >
                      <View style={styles.cardInner}>
                        <Text style={styles.cardLabel}>{option.label}</Text>
                        <Text style={styles.cardSubtitle}>{option.subtitle}</Text>
                      </View>
                    </ImageBackground>
                  </TouchableOpacity>
                </TutorialTarget>
              );
            })}
          </View>
        </ScrollView>

        <TutorialTarget id="screen-next">
          <TouchableOpacity onPress={handleNext} activeOpacity={0.9}>
            <ImageBackground
              source={getWoodframeSource(params.level, '6to1')}
              resizeMode="stretch"
              style={styles.nextButton}
            >
              <Text style={styles.nextText}>NEXT</Text>
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
  scrollContent: { flexGrow: 1, justifyContent: 'center' },
  cardsContainer: { gap: PADDING },
  cardWrapper: { height: 96 },
  unselectedCard: { opacity: 0.55 },
  cardBackground: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cardInner: { alignItems: 'center', gap: 4 },
  cardLabel: { color: '#ffffff', fontSize: 20, fontWeight: '800', letterSpacing: 1 },
  cardSubtitle: { color: '#FBF7F5', fontSize: 13, fontWeight: '600' },
  nextButton: { paddingVertical: 16, alignItems: 'center' },
  nextText: { color: '#ffffff', fontSize: 18, fontWeight: '800', letterSpacing: 1 },
});