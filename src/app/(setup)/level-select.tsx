import { useRouter } from 'expo-router';
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
import { useScreenTransition } from '../../TransitionContext';
import { useWoodKnock } from '../../audio/useWoodKnock';
import { getWoodframeSource } from '../../components/woodframes';

// Constants
const PADDING = 16;
const CARD_RADIUS = 16;

const LEVELS = [
  { id: 'reading' },
  { id: 'research' },
  { id: 'collections' },
];
const SELECTED_LEVEL_FRAMES: Record<string, number> = {
  reading: require('../../../assets/images/Languagewoodframe4to1selected.png'),
  research: require('../../../assets/images/Sciencewoodframe4to1selected.png'),
  collections: require('../../../assets/images/Historywoodframe4to1selected.png'),
};

const DIFFICULTIES = ['Easy', 'Normal', 'Hard'];
const TIMERS = [
  { label: 'Off', value: 0 },
  { label: '10s', value: 10 },
  { label: '15s', value: 15 },
  { label: '20s', value: 20 },
];

export default function LevelSelectScreen() {
  const router = useRouter();
  const { setBookcaseLevel } = useScreenTransition();
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [difficultyIndex, setDifficultyIndex] = useState(1);
  const [questionTimer, setQuestionTimer] = useState(15);
  const playKnock = useWoodKnock();

  const handlePrevDifficulty = () => {
    playKnock();
    setDifficultyIndex((prev) => (prev > 0 ? prev - 1 : DIFFICULTIES.length - 1));
  };

  const handleNextDifficulty = () => {
    playKnock();
    setDifficultyIndex((prev) => (prev < DIFFICULTIES.length - 1 ? prev + 1 : 0));
  };

  const handleContinue = () => {
    if (!selectedLevel) return;
    playKnock();

    router.push({
      pathname: '/playerselection',
      params: {
        level: selectedLevel,
        difficulty: DIFFICULTIES[difficultyIndex],
        timer: questionTimer,
      },
    });
  };

  const handleBack = () => {
    router.back();
  };

  return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
              <Image
                source={require('../../../assets/images/Backbutton.png')}
                style={styles.backArrowImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <ImageBackground
              source={getWoodframeSource(selectedLevel ?? undefined, '6to1')}
              resizeMode="stretch"
              style={styles.headerBanner}
            >
              <Text style={styles.headerTitle}>SELECT LEVEL</Text>
            </ImageBackground>
          </View>

          <ScrollView
            style={styles.optionsScroll}
            contentContainerStyle={styles.optionsContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Level Cards */}
            <View style={styles.levelsContainer}>
              {LEVELS.map((level) => {
                const isSelected = selectedLevel === level.id;
                const levelFrame = SELECTED_LEVEL_FRAMES[level.id];
                return (
                  <TouchableOpacity
                    key={level.id}
                    activeOpacity={0.85}
                    onPress={() => {
                      playKnock();
                      setSelectedLevel(level.id);
                      setBookcaseLevel(level.id);
                    }}
                    style={[
                      styles.levelCardWrapper,
                      !isSelected && styles.unselectedLevelCard,
                      isSelected && styles.selectedCardBorder,
                    ]}
                  >
                    <ImageBackground
                      source={levelFrame}
                      resizeMode="stretch"
                      style={styles.background}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Difficulty Controls */}
            <ImageBackground
              source={getWoodframeSource(selectedLevel ?? undefined, '4to1')}
              resizeMode="stretch"
              style={styles.difficultyBanner}
            >
              <Text style={styles.difficultyLabel}>DIFFICULTY</Text>
              <View style={styles.difficultyControls}>
                <TouchableOpacity onPress={handlePrevDifficulty} style={styles.arrowButton}>
                  <Text style={styles.arrowText}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.difficultyText}>{DIFFICULTIES[difficultyIndex]}</Text>
                <TouchableOpacity onPress={handleNextDifficulty} style={styles.arrowButton}>
                  <Text style={styles.arrowText}>›</Text>
                </TouchableOpacity>
              </View>
            </ImageBackground>

            {/* Question Timer Controls */}
            <ImageBackground
              source={getWoodframeSource(selectedLevel ?? undefined, '4to1')}
              resizeMode="stretch"
              style={styles.timerBanner}
            >
              <Text style={styles.timerLabel}>QUESTION TIMER</Text>
              <View style={styles.timerGrid}>
                {TIMERS.map((timer) => {
                  const isSelected = questionTimer === timer.value;
                  return (
                    <TouchableOpacity
                      key={timer.value}
                      activeOpacity={0.8}
                      onPress={() => {
                        playKnock();
                        setQuestionTimer(timer.value);
                      }}
                      style={[
                        styles.timerChip,
                        isSelected && styles.selectedTimerChip,
                      ]}
                    >
                      <Text
                        style={[
                          styles.timerChipText,
                          isSelected && styles.selectedTimerText,
                        ]}
                      >
                        {timer.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ImageBackground>

          </ScrollView>

          <TouchableOpacity onPress={handleContinue} activeOpacity={0.9} disabled={!selectedLevel}>
            <ImageBackground
              source={getWoodframeSource(selectedLevel ?? undefined, '6to1')}
              resizeMode="stretch"
              style={styles.continueButton}
            >
              <Text style={styles.continueText}>NEXT</Text>
            </ImageBackground>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
    width: '100%',
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    padding: PADDING,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: CARD_RADIUS,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrowImage: {
    width: 44,
    height: 30,
    transform: [{ scale: 1.2 }],
  },
  optionsScroll: {
    flex: 1,
    marginVertical: PADDING,
  },
  optionsContent: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: PADDING,
  },
  headerBanner: {
    flex: 1,
    minHeight: 48,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  levelsContainer: {
    gap: PADDING,
  },
  levelCardWrapper: {
    height: 96,
  },
  unselectedLevelCard: {
    opacity: 0.55,
  },
  selectedCardBorder: {
    borderColor: '#ffffff',
    borderWidth: 2,
  },
  cardOverlay: {
    flex: 1,
    paddingHorizontal: PADDING,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  levelTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
  },
  levelSubtitle: {
    color: '#a0a5b5',
    fontSize: 13,
  },
  selectDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  difficultyBanner: {
    padding: PADDING,
    gap: 8,
  },
  difficultyLabel: {
    color: '#FBF7F5',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  difficultyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  arrowButton: {
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    color: '#ffffff',
    fontSize: 22,
  },
  difficultyText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  timerBanner: {
    padding: PADDING,
    gap: 12,
  },
  timerLabel: {
    color: '#FBF7F5',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  timerGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 8,
  },
  timerChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(55, 58, 66, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
  },
  selectedTimerChip: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  timerChipText: {
    color: '#FBF7F5',
    fontSize: 14,
    fontWeight: '700',
  },
  selectedTimerText: {
    color: '#0f121c',
  },
  continueButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
