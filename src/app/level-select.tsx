import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ImageBackground,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import BookcaseBackground from '../components/BookcaseBackground';

// Constants
const PADDING = 16;
const CARD_RADIUS = 16;

const LEVELS = [
  {
    id: 'reading',
    title: 'The Reading Wing',
    subtitle: 'Language',
    color: '#a3e635',
    image: require('../../assets/images/english.jpg'),
  },
  {
    id: 'research',
    title: 'The Research Corner',
    subtitle: 'Science & Technology',
    color: '#60a5fa',
    image: require('../../assets/images/science.jpg'),
  },
  {
    id: 'collections',
    title: 'The Old Collections',
    subtitle: 'World History',
    color: '#f87171',
    image: require('../../assets/images/history.jpg'),
  },
];

const DIFFICULTIES = ['Easy', 'Normal', 'Hard'];

export default function LevelSelectScreen() {
  const router = useRouter();
  const [selectedLevel, setSelectedLevel] = useState('collections');
  const [difficultyIndex, setDifficultyIndex] = useState(1);

  const handlePrevDifficulty = () => {
    setDifficultyIndex((prev) => (prev > 0 ? prev - 1 : DIFFICULTIES.length - 1));
  };

  const handleNextDifficulty = () => {
    setDifficultyIndex((prev) => (prev < DIFFICULTIES.length - 1 ? prev + 1 : 0));
  };

  const handleContinue = () => {
    router.push({
      pathname: '/game',
      params: { level: selectedLevel, difficulty: DIFFICULTIES[difficultyIndex] },
    });
  };

  return (
    <BookcaseBackground>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerBanner}>
            <Text style={styles.headerTitle}>SELECT LEVEL</Text>
          </View>

          <View style={styles.levelsContainer}>
            {LEVELS.map((level) => {
              const isSelected = selectedLevel === level.id;
              return (
                <TouchableOpacity
                  key={level.id}
                  activeOpacity={0.85}
                  onPress={() => setSelectedLevel(level.id)}
                  style={[styles.levelCardWrapper, isSelected && styles.selectedCardBorder]}
                >
                  <ImageBackground source={level.image} style={styles.background}>
                    <View style={styles.cardOverlay}>
                      <View>
                        <Text style={[styles.levelTitle, { color: level.color }]}>
                          {level.title}
                        </Text>
                        <Text style={styles.levelSubtitle}>{level.subtitle}</Text>
                      </View>
                      {isSelected && <View style={styles.selectDot} />}
                    </View>
                  </ImageBackground>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.difficultyBanner}>
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
          </View>

          <TouchableOpacity style={styles.continueButton} onPress={handleContinue} activeOpacity={0.9}>
            <Text style={styles.continueText}>START GAME</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </BookcaseBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(10, 12, 20, 0.65)',
  },
  scrollContent: {
    padding: PADDING,
    gap: PADDING,
  },
  headerBanner: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 14,
    borderRadius: CARD_RADIUS,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 2,
  },
  levelsContainer: {
    gap: PADDING,
  },
  levelCardWrapper: {
    height: 96,
    borderRadius: CARD_RADIUS,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  selectedCardBorder: {
    borderColor: '#ffffff',
    borderWidth: 2,
  },
  cardOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 18, 28, 0.72)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: CARD_RADIUS,
    padding: PADDING,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    gap: 8,
  },
  difficultyLabel: {
    color: '#8e94a5',
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
    paddingHorizontal: 12,
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
  continueButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: CARD_RADIUS,
    alignItems: 'center',
  },
  continueText: {
    color: '#0f121c',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
