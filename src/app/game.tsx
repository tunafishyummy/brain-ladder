import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  ImageBackground,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import BookcaseBackground from '../components/BookcaseBackground';

const SCREEN_WIDTH = Dimensions.get('window').width;
const BOARD_SIZE = Math.min(SCREEN_WIDTH * 0.90, 360);
const CELL_SIZE = BOARD_SIZE / 10;

// Ladders (Going Up): landing tile -> top tile
const LADDERS: { [key: number]: number } = {
  2: 33,
  8: 34,
  20: 77,
  32: 68,
  41: 79,
  74: 88,
  82: 100,
  85: 95,
};

// Snakes (Going Down): landing tile (head) -> tail tile
const SNAKES: { [key: number]: number } = {
  29: 9,
  38: 15,
  47: 5,
  53: 33,
  62: 37,
  86: 54,
  92: 70,
  97: 25,
};

const DICE_IMAGES: { [key: number]: any } = {
  1: require('../../assets/images/dice1.png'),
  2: require('../../assets/images/dice2.png'),
  3: require('../../assets/images/dice3.png'),
  4: require('../../assets/images/dice4.png'),
  5: require('../../assets/images/dice5.png'),
  6: require('../../assets/images/dice6.png'),
};

const COLOR_NAMES: { [key: string]: string } = {
  '#dc2626': 'Red',
  '#16a34a': 'Green',
  '#2563eb': 'Blue',
  '#fed330': 'Yellow',
  '#ff5252': 'Red',
  '#26de81': 'Green',
  '#4b7bec': 'Blue',
};

const getCharacterAssetForColor = (color: string) => {
  switch (color) {
    case '#dc2626':
    case '#ff5252':
      return require('../../assets/images/Playerred.png');
    case '#16a34a':
    case '#26de81':
      return require('../../assets/images/Playergreen.png');
    case '#fed330':
    case '#2563eb':
    case '#4b7bec':
    default:
      return require('../../assets/images/Playerblue.png');
  }
};

type Player = {
  id: string;
  name: string;
  color: string;
  position: number;
};

type EventType = 'ladder' | 'snake';

type PendingEvent = {
  type: EventType;
  landedPos: number;
  target: number;
};

type Question = {
  prompt: string;
  options: string[];
  correctIndex: number;
};

const getPlaceholderQuestion = (type: EventType): Question => {
  if (type === 'ladder') {
    return {
      prompt: 'Placeholder question — answer correctly to climb the ladder!',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctIndex: 0,
    };
  }
  return {
    prompt: 'Placeholder question — answer correctly to dodge the snake!',
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    correctIndex: 0,
  };
};

export default function GameScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ players?: string; playerColors?: string }>();
  
  const playerCount = Math.min(3, Math.max(1, Number(params.players) || 3));

  const parsedColors: string[] = (() => {
    try {
      if (typeof params.playerColors === 'string') {
        const parsed = JSON.parse(params.playerColors);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      // fallback if parsing fails
    }
    return ['#16a34a', '#dc2626', '#2563eb'];
  })();

  const [players, setPlayers] = useState<Player[]>(() => {
    return Array.from({ length: playerCount }, (_, index) => {
      const color = parsedColors[index] || '#2563eb';
      return {
        id: String(index + 1),
        name: COLOR_NAMES[color] || `Player ${index + 1}`,
        color: color,
        position: 1,
      };
    });
  });

  const [turnIndex, setTurnIndex] = useState(0);
  const [diceValue, setDiceValue] = useState<number>(1);
  const [isRolling, setIsRolling] = useState(false);
  const [winner, setWinner] = useState<Player | null>(null);

  const [pendingEvent, setPendingEvent] = useState<PendingEvent | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);

  const activePlayer = players[turnIndex] || players[0];
  const isModalVisible = pendingEvent !== null;

  // Exit game confirmation popup
  const handleExitGame = () => {
    Alert.alert(
      'Exit Game',
      'Are you sure? You will lose your progress if you exit the game.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: () => router.replace('/'),
        },
      ],
      { cancelable: true }
    );
  };

  const getCoordinatesForPosition = (pos: number) => {
    const zeroBased = pos - 1;
    const row = Math.floor(zeroBased / 10);
    let col = zeroBased % 10;
    if (row % 2 === 1) {
      col = 9 - col;
    }
    const x = col * CELL_SIZE;
    const y = (9 - row) * CELL_SIZE;
    return { x, y };
  };

  const rollDice = () => {
    if (isRolling || winner || isModalVisible) return;
    setIsRolling(true);

    const finalRoll = Math.floor(Math.random() * 6) + 1;

    let steps = 0;
    const interval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      steps++;

      if (steps > 10) {
        clearInterval(interval);
        setDiceValue(finalRoll);
        setIsRolling(false);
        movePlayer(finalRoll);
      }
    }, 60);
  };

  const passTurn = () => {
    setTurnIndex((prev) => (prev + 1) % players.length);
  };

  const movePlayer = (roll: number) => {
    const mover = players[turnIndex];
    let newPos = mover.position + roll;

    if (newPos >= 100) {
      newPos = 100;
      const updated = [...players];
      updated[turnIndex] = { ...mover, position: newPos };
      setPlayers(updated);
      setWinner(updated[turnIndex]);
      return;
    }

    if (LADDERS[newPos]) {
      const updated = [...players];
      updated[turnIndex] = { ...mover, position: newPos };
      setPlayers(updated);
      openQuiz({ type: 'ladder', landedPos: newPos, target: LADDERS[newPos] });
      return;
    }

    if (SNAKES[newPos]) {
      const updated = [...players];
      updated[turnIndex] = { ...mover, position: newPos };
      setPlayers(updated);
      openQuiz({ type: 'snake', landedPos: newPos, target: SNAKES[newPos] });
      return;
    }

    const updated = [...players];
    updated[turnIndex] = { ...mover, position: newPos };
    setPlayers(updated);
    passTurn();
  };

  const openQuiz = (event: PendingEvent) => {
    setPendingEvent(event);
    setCurrentQuestion(getPlaceholderQuestion(event.type));
    setSelectedIndex(null);
    setIsAnswerCorrect(null);
  };

  const handleAnswerSelect = (index: number) => {
    if (!currentQuestion || isAnswerCorrect !== null) return;
    setSelectedIndex(index);
    const isCorrect = index === currentQuestion.correctIndex;
    setIsAnswerCorrect(isCorrect);
  };

  const resolveQuiz = () => {
    if (!pendingEvent || isAnswerCorrect === null) return;

    setPlayers((prevPlayers) => {
      const updated = [...prevPlayers];
      const player = { ...updated[turnIndex] };

      if (pendingEvent.type === 'ladder') {
        if (isAnswerCorrect) {
          player.position = pendingEvent.target;
        }
      } else {
        if (!isAnswerCorrect) {
          player.position = pendingEvent.target;
        }
      }

      updated[turnIndex] = player;
      return updated;
    });

    setPendingEvent(null);
    setCurrentQuestion(null);
    setSelectedIndex(null);
    setIsAnswerCorrect(null);
    passTurn();
  };

  const handleVictoryTap = () => {
    router.push('/stats');
  };

  return (
    <BookcaseBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.mainContainer}>
          {/* HEADER SECTION: Exit Button + Turn Banner */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.exitButton}
              onPress={handleExitGame}
              activeOpacity={0.7}
            >
              <Text style={styles.exitIcon}>✕</Text>
            </TouchableOpacity>

            <View style={[styles.turnBanner, { backgroundColor: activePlayer.color }]}>
              <Text style={styles.turnText}>{activePlayer.name}'s Turn</Text>
            </View>
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

        {/* BOTTOM TABS: Player color status bars */}
        <View style={styles.bottomBarContainer}>
          {players.map((player, index) => {
            const isActive = index === turnIndex;
            return (
              <View
                key={player.id}
                style={[
                  styles.bottomIndicator,
                  { backgroundColor: player.color },
                  isActive ? styles.indicatorActive : styles.indicatorInactive,
                ]}
              />
            );
          })}
        </View>

        {/* Ladder / Snake Quiz Modal */}
        <Modal
          visible={isModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => {}}
        >
          <View style={styles.modalOverlayContainer}>
            <View style={styles.quizCard}>
              <Text style={styles.quizHeader}>
                {pendingEvent?.type === 'ladder' ? '🪜 Ladder Challenge!' : '🐍 Snake Challenge!'}
              </Text>
              <Text style={styles.quizSubheader}>
                {pendingEvent?.type === 'ladder'
                  ? `Answer right to climb from ${pendingEvent.landedPos} to ${pendingEvent.target}.`
                  : `Answer right to stay safe from the snake at ${pendingEvent?.landedPos}.`}
              </Text>

              <Text style={styles.quizPrompt}>{currentQuestion?.prompt}</Text>

              <View style={styles.optionsGrid}>
                {currentQuestion?.options.map((option, index) => {
                  const isSelected = selectedIndex === index;
                  const isCorrectOption = currentQuestion.correctIndex === index;

                  let optionStateStyle = styles.optionButton;
                  if (isAnswerCorrect !== null) {
                    if (isSelected) {
                      optionStateStyle = isAnswerCorrect ? styles.optionCorrect : styles.optionWrong;
                    } else if (isCorrectOption) {
                      optionStateStyle = styles.optionCorrect;
                    }
                  }

                  return (
                    <TouchableOpacity
                      key={index}
                      style={[styles.optionButton, optionStateStyle]}
                      onPress={() => handleAnswerSelect(index)}
                      disabled={isAnswerCorrect !== null}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.optionText}>{option}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {isAnswerCorrect !== null && (
                <View style={styles.resultBlock}>
                  <Text
                    style={[
                      styles.resultText,
                      isAnswerCorrect ? styles.resultCorrectText : styles.resultWrongText,
                    ]}
                  >
                    {isAnswerCorrect
                      ? pendingEvent?.type === 'ladder'
                        ? 'Correct! Climbing the ladder.'
                        : 'Correct! You dodged the snake.'
                      : pendingEvent?.type === 'ladder'
                        ? 'Not quite — staying put this turn.'
                        : 'Not quite — sliding down the snake.'}
                  </Text>
                  <TouchableOpacity style={styles.continueButton} onPress={resolveQuiz} activeOpacity={0.8}>
                    <Text style={styles.continueButtonText}>Continue</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Modal>

        {/* Victory Popup Overlay */}
        {winner && (
          <TouchableOpacity style={styles.modalOverlayContainer} activeOpacity={1} onPress={handleVictoryTap}>
            <ImageBackground
              source={require('../../assets/images/victory-popup.png')}
              style={styles.popupImageContainer}
              resizeMode="contain"
            >
              <View style={styles.popupTextWrapper}>
                <Text style={styles.victorySubtitle}>{winner.name} wins the game!</Text>
                <Text style={styles.tapToContinueText}>Tap to Continue</Text>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </BookcaseBackground>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingVertical: 10,
  },

  headerRow: {
    width: '90%',
    maxWidth: BOARD_SIZE,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 10,
  },
  exitButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderWidth: 1.5,
    borderColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exitIcon: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },

  turnBanner: {
    flex: 1,
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

  modalOverlayContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
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
  tapToContinueText: {
    color: '#facc15',
    fontWeight: 'bold',
    fontSize: 14,
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  quizCard: {
    width: '88%',
    maxWidth: 420,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
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