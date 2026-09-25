import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Dimensions,
  Image,
  ImageBackground,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// Constants
const PADDING = 16;
const CARD_RADIUS = 16;


{/*dito yung mga levels */}
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

export default function GameScreen() {
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
      <View style={styles.mainContainer}>
        {/* UPPER BOX: Turn Header Banner */}
        <View style={[styles.turnBanner, { backgroundColor: activePlayer.color }]}>
          <Text style={styles.turnText}>{activePlayer.name}'s Turn</Text>
        </View>

        {/* MIDDLE BOX: Board Display */}
        <View style={styles.boardWrapper}>
          <ImageBackground
            source={require('../../assets/images/board.png')}
            style={styles.boardImage}
            resizeMode="cover"
          >
            {players.map((player) => {
              const { x, y } = getCoordinatesForPosition(player.position);
              return (
                <View
                  key={player.id}
                  style={[
                    styles.playerTokenWrapper,
                    {
                      left: x + CELL_SIZE * 0.05,
                      top: y + CELL_SIZE * 0.05,
                      backgroundColor: player.color,
                    },
                  ]}
                >
                  <Image
                    source={getCharacterAssetForColor(player.color)}
                    style={styles.playerToken}
                  />
                </View>
              );
            })}
          </ImageBackground>
        </View>

        {/* LOWER SMALL BOX: Dice Button */}
        <View style={styles.diceSection}>
          <TouchableOpacity
            onPress={rollDice}
            disabled={isRolling || !!winner || isModalVisible}
            activeOpacity={0.7}
          >
            <Image
              source={DICE_IMAGES[diceValue]}
              style={[styles.diceImage, isRolling && styles.diceRollingAnimation]}
            />
          </TouchableOpacity>
        </View>
      </View>

          <TouchableOpacity style={styles.continueButton} onPress={handleContinue} activeOpacity={0.9}>
            <Text style={styles.continueText}>START GAME</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, width: '100%', height: '100%' },

  mainContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingVertical: 10,
  },

  turnBanner: {
    width: '90%',
    maxWidth: BOARD_SIZE,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  turnText: { color: '#fff', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },

  boardWrapper: {
    width: BOARD_SIZE,
    height: BOARD_SIZE,
    borderWidth: 2,
    borderColor: '#334155',
    borderRadius: 10,
    overflow: 'hidden',
  },
  boardImage: { width: '100%', height: '100%' },

  playerTokenWrapper: {
    position: 'absolute',
    width: CELL_SIZE * 0.9,
    height: CELL_SIZE * 0.9,
    borderRadius: CELL_SIZE * 0.9,
    borderWidth: 2,
    borderColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 5,
  },
  playerToken: {
    width: '82%',
    height: '82%',
    resizeMode: 'contain',
  },

  diceSection: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  diceImage: { width: 50, height: 50, resizeMode: 'contain' },
  diceRollingAnimation: { opacity: 0.6, transform: [{ scale: 0.95 }] },

  bottomBarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    width: '100%',
    paddingHorizontal: 12,
  },
  bottomIndicator: {
    flex: 1,
    marginHorizontal: 6,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
  },
  indicatorActive: {
    height: 95,
    borderTopWidth: 4,
    borderTopColor: '#fff',
  },
  indicatorInactive: {
    height: 25,
    opacity: 0.7,
  },

  modalOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  popupImageContainer: {
    width: 340,
    height: 260,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 28,
  },
  popupTextWrapper: {
    alignItems: 'center',
    gap: 8,
  },
  victorySubtitle: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
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
    borderColor: '#475569',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  quizHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  quizSubheader: {
    fontSize: 13,
    color: '#cbd5e1',
    textAlign: 'center',
    marginBottom: 14,
  },
  quizPrompt: {
    fontSize: 15,
    color: '#f8fafc',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
  },

  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  optionButton: {
    width: '48%',
    backgroundColor: '#334155',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCorrect: {
    backgroundColor: '#166534',
    borderColor: '#22c55e',
  },
  optionWrong: {
    backgroundColor: '#7f1d1d',
    borderColor: '#ef4444',
  },
  optionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },

  resultBlock: {
    marginTop: 16,
    alignItems: 'center',
  },
  resultText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  resultCorrectText: { color: '#4ade80' },
  resultWrongText: { color: '#f87171' },
  continueButton: {
    backgroundColor: '#facc15',
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 10,
  },
  continueButtonText: {
    color: '#1e293b',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
