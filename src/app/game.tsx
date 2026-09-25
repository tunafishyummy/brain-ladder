import { useRouter } from 'expo-router';
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
import BookcaseBackground from '../components/BookcaseBackground';

const SCREEN_WIDTH = Dimensions.get('window').width;
const BOARD_SIZE = Math.min(SCREEN_WIDTH * 0.90, 360);
const CELL_SIZE = BOARD_SIZE / 10;

// Ladders (Going Up): landing tile -> top tile
const LADDERS: { [key: number]: number } = {
  2: 23,
  8: 31,
  14: 34,
  27: 84,
  33: 53,
  62: 81,
  85: 95,
};

// Snakes (Going Down): landing tile (head) -> tail tile
const SNAKES: { [key: number]: number } = {
  12: 9,
  58: 38,
  75: 55,
  89: 70,
  93: 74,
  97: 36,
};

const DICE_IMAGES: { [key: number]: any } = {
  1: require('../../assets/images/dice1.png'),
  2: require('../../assets/images/dice2.png'),
  3: require('../../assets/images/dice3.png'),
  4: require('../../assets/images/dice4.png'),
  5: require('../../assets/images/dice5.png'),
  6: require('../../assets/images/dice6.png'),
};

const getCharacterAssetForColor = (color: string) => {
  switch (color) {
    case '#dc2626': // Red
      return require('../../assets/images/Playerred.png');
    case '#16a34a': // Green
      return require('../../assets/images/Playergreen.png');
    case '#2563eb': // Blue
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
  landedPos: number; // tile the player is currently sitting on (bottom of ladder / head of snake)
  target: number;    // tile they move to on a correct (ladder) or wrong (snake) answer
};

// TODO: replace with real question bank later. One generic placeholder per event type for now.
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
      correctIndex: 0, // TODO: wire up real answer
    };
  }
  return {
    prompt: 'Placeholder question — answer correctly to dodge the snake!',
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    correctIndex: 0, // TODO: wire up real answer
  };
};

export default function GameScreen() {
  const router = useRouter();

  const [players, setPlayers] = useState<Player[]>([
    { id: '1', name: "Green", color: '#16a34a', position: 1 },
    { id: '2', name: "Red", color: '#dc2626', position: 1 },
    { id: '3', name: "Blue", color: '#2563eb', position: 1 },
  ]);
  const [turnIndex, setTurnIndex] = useState(0);
  const [diceValue, setDiceValue] = useState<number>(1);
  const [isRolling, setIsRolling] = useState(false);
  const [winner, setWinner] = useState<Player | null>(null);

  // Modal / quiz state
  const [pendingEvent, setPendingEvent] = useState<PendingEvent | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answerResult, setAnswerResult] = useState<'correct' | 'wrong' | null>(null);

  const activePlayer = players[turnIndex];
  const isModalVisible = pendingEvent !== null;

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

  // Advance to the next player's turn.
  const passTurn = () => {
    setTurnIndex((prev) => (prev + 1) % players.length);
  };

  const movePlayer = (roll: number) => {
    // Read the mover directly off current state (safe here since this only ever
    // runs once per dice roll, triggered synchronously by the active player).
    const mover = players[turnIndex];
    let newPos = mover.position + roll;

    if (newPos >= 100) {
      newPos = 100;
      const updated = [...players];
      updated[turnIndex] = { ...mover, position: newPos };
      setPlayers(updated);
      setWinner(updated[turnIndex]);
      return; // game over, no turn to pass
    }

    if (LADDERS[newPos]) {
      // Land at the bottom of the ladder and hold the turn open for the quiz.
      const updated = [...players];
      updated[turnIndex] = { ...mover, position: newPos };
      setPlayers(updated);
      openQuiz({ type: 'ladder', landedPos: newPos, target: LADDERS[newPos] });
      return; // turn passes once the quiz is resolved
    }

    if (SNAKES[newPos]) {
      // Land on the snake's head and hold the turn open for the quiz.
      const updated = [...players];
      updated[turnIndex] = { ...mover, position: newPos };
      setPlayers(updated);
      openQuiz({ type: 'snake', landedPos: newPos, target: SNAKES[newPos] });
      return; // turn passes once the quiz is resolved
    }

    // Plain move, no ladder/snake involved — advance the turn right away.
    const updated = [...players];
    updated[turnIndex] = { ...mover, position: newPos };
    setPlayers(updated);
    passTurn();
  };

  const openQuiz = (event: PendingEvent) => {
    setPendingEvent(event);
    setCurrentQuestion(getPlaceholderQuestion(event.type));
    setSelectedIndex(null);
    setAnswerResult(null);
  };

  const handleAnswerSelect = (index: number) => {
    if (!currentQuestion || answerResult) return; // lock in after first pick
    setSelectedIndex(index);
    const isCorrect = index === currentQuestion.correctIndex;
    setAnswerResult(isCorrect ? 'correct' : 'wrong');
  };

  const resolveQuiz = () => {
    if (!pendingEvent || !answerResult) return;

    setPlayers((prevPlayers) => {
      const updated = [...prevPlayers];
      const player = { ...updated[turnIndex] };

      if (pendingEvent.type === 'ladder') {
        // Correct -> climb to the top. Wrong -> stay at the bottom, no climb.
        if (answerResult === 'correct') {
          player.position = pendingEvent.target;
        }
        // wrong: position already sits at landedPos, leave as is.
      } else {
        // Snake: correct -> immune, stay put. Wrong -> slide down to the tail.
        if (answerResult === 'wrong') {
          player.position = pendingEvent.target;
        }
        // correct: position already sits at landedPos (the head), leave as is.
      }

      updated[turnIndex] = player;
      return updated;
    });

    setPendingEvent(null);
    setCurrentQuestion(null);
    setSelectedIndex(null);
    setAnswerResult(null);
    passTurn();
  };

  const handleVictoryTap = () => {
    router.push('/stats');
  };

  return (
    <BookcaseBackground>
      <View style={styles.overlay} />

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

      {/* BOTTOM TABS: Player color status bars reaching up to the red line */}
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
        onRequestClose={() => {}} // block back-button dismissal; must answer to proceed
      >
        <View style={styles.modalOverlay}>
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

                let optionStyle = styles.optionButton;
                if (answerResult && isSelected) {
                  optionStyle = answerResult === 'correct' ? styles.optionCorrect : styles.optionWrong;
                } else if (answerResult && isCorrectOption) {
                  // Reveal the correct answer once locked in.
                  optionStyle = styles.optionCorrect;
                }

                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.optionButton, optionStyle]}
                    onPress={() => handleAnswerSelect(index)}
                    disabled={!!answerResult}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.optionText}>{option}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {answerResult && (
              <View style={styles.resultBlock}>
                <Text
                  style={[
                    styles.resultText,
                    answerResult === 'correct' ? styles.resultCorrectText : styles.resultWrongText,
                  ]}
                >
                  {answerResult === 'correct'
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
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={handleVictoryTap}>
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
    </BookcaseBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, width: '100%', height: '100%' },
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.65)' },

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
  tapToContinueText: {
    color: '#facc15',
    fontWeight: 'bold',
    fontSize: 14,
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // Quiz modal styles — sized in relative units so it scales on both phone and desktop web.
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
