import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  ImageBackground,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BookcaseBackground from '../components/BookcaseBackground';

const MAX_BOARD_SIZE = 380;
const BOARD_FRAME_BORDER_WIDTH = 2;
const BOARD_FRAME_SIDE_INSET = 8;
const BOARD_FRAME_HEIGHT_RATIO = 1.2;
const BOARD_RESTING_WIDTH_RATIO = 0.82;
const BOARD_IMAGE_SCALE = 1.06;
const BOARD_CAMERA_ZOOM = 1.45;
const PLAYER_MOVEMENT_WARMUP_MS = 650;
const PLAYER_MOVEMENT_COOLDOWN_MS = 500;
const PLAYER_TILE_MOVE_MS = 150;
const TILE_NUMBER_FONT_SIZE = 9;
const TILE_NUMBER_FONT_WEIGHT = '900' as const;
const TILE_NUMBER_WIDTH = 24;
const TILE_NUMBER_HEIGHT = 18;
const TILE_NUMBER_INSET = 3;
const TYPEWRITER_CHARACTER_INTERVAL_MS = 18;
const QUIZ_SCENE_FALLBACK_HEIGHT = 260;
const BOARD_FRAME = {
  borderWidth: BOARD_FRAME_BORDER_WIDTH,
  borderRadius: 10,
  borderColor: '#334155',
  backgroundColor: '#0f172a',
};
const DIALOGUE_FILES = {
  Lad: {
    Language: require('../data/dialogue/LadDialogueLanguage.json'),
    Science: require('../data/dialogue/LadDialogueScience.json'),
    History: require('../data/dialogue/LadDialogueHistory.json'),
  },
  Adder: {
    Language: require('../data/dialogue/AdderDialogueLanguage.json'),
    Science: require('../data/dialogue/AdderDialogueScience.json'),
    History: require('../data/dialogue/AdderDialogueHistory.json'),
  },
} as const;

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
      return require('../../assets/images/Playeryellow.png');
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

type BoardMovement = {
  playerId: string;
  path: number[];
  progress: Animated.Value;
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

type DialogueSubject = 'Language' | 'Science' | 'History';
type DialogueSection = 'Encounter' | 'CorrectAnswer' | 'IncorrectAnswer';

const getRandomDialogueLine = (
  eventType: EventType,
  subject: DialogueSubject,
  section: DialogueSection,
) => {
  const character = eventType === 'ladder' ? 'Lad' : 'Adder';
  const lines: string[] = DIALOGUE_FILES[character][subject][section];
  return lines.length ? lines[Math.floor(Math.random() * lines.length)] : '';
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
  const params = useLocalSearchParams<{ players?: string; playerColors?: string; level?: string }>();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const frameWidth = screenWidth - BOARD_FRAME_SIDE_INSET * 2;
  const frameHeight = Math.min(frameWidth * BOARD_FRAME_HEIGHT_RATIO, screenHeight * 0.52);
  const boardSize = Math.min(
    frameWidth * BOARD_RESTING_WIDTH_RATIO,
    frameHeight * BOARD_RESTING_WIDTH_RATIO,
    MAX_BOARD_SIZE,
  );
  const gridSize = boardSize - BOARD_FRAME_BORDER_WIDTH * 2;
  const boardOffsetX = (frameWidth - gridSize) / 2;
  const boardOffsetY = (frameHeight - gridSize) / 2;
  const cellSize = gridSize / 10;
  
  const playerCount = Math.min(3, Math.max(1, Number(params.players) || 3));

  const parsedColors: string[] = (() => {
    try {
      if (typeof params.playerColors === 'string') {
        const parsed = JSON.parse(params.playerColors);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      // fallback
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

  const [showExitModal, setShowExitModal] = useState(false);
  const [movement, setMovement] = useState<BoardMovement | null>(null);
  const [quizCardHeight, setQuizCardHeight] = useState(0);
  const [dialogueText, setDialogueText] = useState('');
  const [typedDialogue, setTypedDialogue] = useState('');
  const movementLocked = useRef(false);
  const cameraScale = useRef(new Animated.Value(1)).current;
  const cameraFollow = useRef(new Animated.Value(0)).current;

  const activePlayer = players[turnIndex] || players[0];
  const isModalVisible = pendingEvent !== null;
  const dialogueSubject = params.level === 'reading'
    ? 'Language'
    : params.level === 'research'
      ? 'Science'
      : 'History';
  const dialogueImage = pendingEvent?.type === 'ladder'
    ? require('../../assets/images/LogoLad.png')
    : require('../../assets/images/LogoKnowItAdder.png');

  useEffect(() => {
    setTypedDialogue('');
    if (!dialogueText) return;

    let visibleCharacters = 0;
    const timer = setInterval(() => {
      visibleCharacters += 1;
      setTypedDialogue(dialogueText.slice(0, visibleCharacters));
      if (visibleCharacters >= dialogueText.length) clearInterval(timer);
    }, TYPEWRITER_CHARACTER_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [dialogueText]);

  const handleConfirmExit = () => {
    setShowExitModal(false);
    router.replace('/');
  };

  const getCoordinatesForPosition = (pos: number) => {
    const zeroBased = pos - 1;
    const row = Math.floor(zeroBased / 10);
    let col = zeroBased % 10;
    if (row % 2 === 1) {
      col = 9 - col;
    }
    const x = col * cellSize;
    const y = (9 - row) * cellSize;
    return { x, y };
  };

  const animatePlayerPath = (playerId: string, path: number[], onComplete: () => void) => {
    if (path.length < 2) {
      onComplete();
      return;
    }

    movementLocked.current = true;
    cameraScale.setValue(1);
    cameraFollow.setValue(0);
    const progress = new Animated.Value(0);
    setMovement({ playerId, path, progress });

    requestAnimationFrame(() => {
      const tileSteps = path.slice(1).map((position, index) => {
        const from = getCoordinatesForPosition(path[index]);
        const to = getCoordinatesForPosition(position);
        const distanceInTiles = Math.hypot(to.x - from.x, to.y - from.y) / cellSize;

        return Animated.timing(progress, {
          toValue: index + 1,
          duration: Math.max(PLAYER_TILE_MOVE_MS, Math.round(distanceInTiles * PLAYER_TILE_MOVE_MS)),
          easing: Easing.linear,
          useNativeDriver: true,
        });
      });

      Animated.parallel([
        Animated.timing(cameraScale, {
          toValue: BOARD_CAMERA_ZOOM,
          duration: PLAYER_MOVEMENT_WARMUP_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(cameraFollow, {
          toValue: 1,
          duration: PLAYER_MOVEMENT_WARMUP_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (!finished) {
          movementLocked.current = false;
          setMovement(null);
          return;
        }

        Animated.sequence(tileSteps).start(({ finished: movementFinished }) => {
          if (!movementFinished) {
            movementLocked.current = false;
            setMovement(null);
            return;
          }

          Animated.parallel([
            Animated.timing(cameraScale, {
              toValue: 1,
              duration: PLAYER_MOVEMENT_COOLDOWN_MS,
              easing: Easing.inOut(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(cameraFollow, {
              toValue: 0,
              duration: PLAYER_MOVEMENT_COOLDOWN_MS,
              easing: Easing.inOut(Easing.cubic),
              useNativeDriver: true,
            }),
          ]).start(({ finished: resetFinished }) => {
            movementLocked.current = false;
            setMovement(null);
            if (resetFinished) onComplete();
          });
        });
      });
    });
  };

  const rollDice = () => {
    if (isRolling || movementLocked.current || winner || isModalVisible || showExitModal) return;
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
    const newPos = Math.min(mover.position + roll, 100);
    const path = Array.from(
      { length: newPos - mover.position + 1 },
      (_, index) => mover.position + index,
    );

    animatePlayerPath(mover.id, path, () => {
      const updatedPlayer = { ...mover, position: newPos };
      setPlayers((currentPlayers) => currentPlayers.map((player) =>
        player.id === mover.id ? updatedPlayer : player,
      ));

      if (newPos === 100) {
        setWinner(updatedPlayer);
      } else if (LADDERS[newPos]) {
        openQuiz({ type: 'ladder', landedPos: newPos, target: LADDERS[newPos] });
      } else if (SNAKES[newPos]) {
        openQuiz({ type: 'snake', landedPos: newPos, target: SNAKES[newPos] });
      } else {
        passTurn();
      }
    });
  };

  const openQuiz = (event: PendingEvent) => {
    setQuizCardHeight(0);
    setDialogueText(getRandomDialogueLine(event.type, dialogueSubject, 'Encounter'));
    setPendingEvent(event);
    setCurrentQuestion(getPlaceholderQuestion(event.type));
    setSelectedIndex(null);
    setIsAnswerCorrect(null);
  };

  const handleAnswerSelect = (index: number) => {
    if (!currentQuestion || !pendingEvent || isAnswerCorrect !== null) return;
    setSelectedIndex(index);
    const isCorrect = index === currentQuestion.correctIndex;
    setDialogueText(getRandomDialogueLine(
      pendingEvent.type,
      dialogueSubject,
      isCorrect ? 'CorrectAnswer' : 'IncorrectAnswer',
    ));
    setIsAnswerCorrect(isCorrect);
  };

  const resolveQuiz = () => {
    if (!pendingEvent || isAnswerCorrect === null) return;
    const mover = players[turnIndex];
    const startPosition = pendingEvent.landedPos;
    const target = (pendingEvent.type === 'ladder' && isAnswerCorrect)
      || (pendingEvent.type === 'snake' && !isAnswerCorrect)
      ? pendingEvent.target
      : startPosition;
    setPendingEvent(null);
    setCurrentQuestion(null);
    setSelectedIndex(null);
    setIsAnswerCorrect(null);

    if (target === startPosition) {
      setPlayers((currentPlayers) => currentPlayers.map((player) =>
        player.id === mover.id ? { ...player, position: startPosition } : player,
      ));
      passTurn();
      return;
    }

    animatePlayerPath(mover.id, [startPosition, target], () => {
      const updatedPlayer = { ...mover, position: target };
      setPlayers((currentPlayers) => currentPlayers.map((player) =>
        player.id === mover.id ? updatedPlayer : player,
      ));
      if (target === 100) setWinner(updatedPlayer);
      else passTurn();
    });
  };

  const handleVictoryTap = () => {
    router.push('/stats');
  };

  const movementPoints = movement?.path.map((position) => {
    const { x, y } = getCoordinatesForPosition(position);
    return { x: x + cellSize / 2, y: y + cellSize / 2 };
  });
  const movementRange = movementPoints?.map((_, index) => index);
  const movementX = movement && movementPoints && movementRange
    ? movement.progress.interpolate({
      inputRange: movementRange,
      outputRange: movementPoints.map(({ x }) => x),
      extrapolate: 'clamp',
    })
    : null;
  const movementY = movement && movementPoints && movementRange
    ? movement.progress.interpolate({
      inputRange: movementRange,
      outputRange: movementPoints.map(({ y }) => y),
      extrapolate: 'clamp',
    })
    : null;
  const cameraTranslateX = movementX
    ? Animated.multiply(
      cameraFollow,
      Animated.subtract(frameWidth / 2 - boardOffsetX, Animated.multiply(cameraScale, movementX)),
    )
    : 0;
  const cameraTranslateY = movementY
    ? Animated.multiply(
      cameraFollow,
      Animated.subtract(frameHeight / 2 - boardOffsetY, Animated.multiply(cameraScale, movementY)),
    )
    : 0;
  const tileNumberScale = cameraScale.interpolate({
    inputRange: [1, BOARD_CAMERA_ZOOM],
    outputRange: [1, 1 / BOARD_CAMERA_ZOOM],
    extrapolate: 'clamp',
  });

  return (
    <BookcaseBackground>
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
        <View style={styles.mainContainer}>
          {/* TOP BANNER & EXIT BUTTON */}
          <View style={[styles.headerRow, { width: frameWidth }]}>
            <TouchableOpacity
              style={styles.exitButton}
              onPress={() => setShowExitModal(true)}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.exitIcon}>✕</Text>
            </TouchableOpacity>

            <View style={[styles.turnBanner, { backgroundColor: activePlayer.color }]}>
              <Text style={styles.turnText}>{activePlayer.name}'s Turn</Text>
            </View>
          </View>

          {/* BOARD */}
          <View style={[styles.boardFrame, { width: frameWidth, height: frameHeight }]}>
            <Animated.View
              style={{
                position: 'absolute',
                left: boardOffsetX,
                top: boardOffsetY,
                width: gridSize,
                height: gridSize,
                transform: [{ translateX: cameraTranslateX }, { translateY: cameraTranslateY }],
              }}
            >
              <Animated.View
                style={{
                  width: gridSize,
                  height: gridSize,
                  transformOrigin: [0, 0, 0],
                  transform: [{ scale: cameraScale }],
                }}
              >
                <Image
                  source={require('../../assets/images/board.png')}
                  style={[styles.boardImage, { transform: [{ scale: BOARD_IMAGE_SCALE }] }]}
                  resizeMode="cover"
                />
                {players.map((player) => {
                  const markerSize = cellSize * 0.9;
                  if (movement?.playerId === player.id && movementX !== null && movementY !== null) {
                    return (
                      <Animated.View
                        key={player.id}
                        style={[
                          styles.playerTokenWrapper,
                          {
                            left: 0,
                            top: 0,
                            width: markerSize,
                            height: markerSize,
                            borderRadius: markerSize / 2,
                            backgroundColor: player.color,
                            transform: [
                              { translateX: Animated.subtract(movementX, markerSize / 2) },
                              { translateY: Animated.subtract(movementY, markerSize / 2) },
                            ],
                          },
                        ]}
                      >
                        <Image source={getCharacterAssetForColor(player.color)} style={styles.playerToken} />
                      </Animated.View>
                    );
                  }

                  const { x, y } = getCoordinatesForPosition(player.position);
                  return (
                    <View
                      key={player.id}
                      style={[
                        styles.playerTokenWrapper,
                        {
                          left: x + cellSize * 0.05,
                          top: y + cellSize * 0.05,
                          width: markerSize,
                          height: markerSize,
                          borderRadius: markerSize / 2,
                          backgroundColor: player.color,
                        },
                      ]}
                    >
                      <Image source={getCharacterAssetForColor(player.color)} style={styles.playerToken} />
                    </View>
                  );
                })}
                {Array.from({ length: 100 }, (_, index) => index + 1).map((number) => {
                  const { x, y } = getCoordinatesForPosition(number);
                  return (
                    <Animated.View
                      key={number}
                      pointerEvents="none"
                      style={{
                        position: 'absolute',
                        left: x + cellSize - TILE_NUMBER_WIDTH - TILE_NUMBER_INSET,
                        top: y + TILE_NUMBER_INSET,
                        width: TILE_NUMBER_WIDTH,
                        height: TILE_NUMBER_HEIGHT,
                        alignItems: 'flex-end',
                        zIndex: 5,
                        transformOrigin: [TILE_NUMBER_WIDTH, 0, 0],
                        transform: [{ scale: tileNumberScale }],
                      }}
                    >
                      <Text style={styles.tileNumber}>{number}</Text>
                    </Animated.View>
                  );
                })}
              </Animated.View>
            </Animated.View>
          </View>

          {/* DICE */}
          <View style={styles.diceSection}>
            <TouchableOpacity
              style={styles.diceButton}
              onPress={rollDice}
              disabled={isRolling || !!winner || isModalVisible || showExitModal}
              activeOpacity={0.7}
            >
              <Image
                source={DICE_IMAGES[diceValue]}
                style={[
                  styles.diceImage,
                  { width: Math.min(52, boardSize * 0.15), height: Math.min(52, boardSize * 0.15) },
                  isRolling && styles.diceRollingAnimation,
                ]}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* BOTTOM INDICATORS */}
        <View style={styles.bottomBarContainer}>
          {players.map((player, index) => {
            const isActive = index === turnIndex;
            return (
              <View
                key={player.id}
                style={[
                  styles.bottomIndicator,
                  { backgroundColor: player.color },
                  isActive
                    ? [styles.indicatorActive, { height: Math.min(95, screenHeight * 0.13) }]
                    : [styles.indicatorInactive, { height: Math.min(25, screenHeight * 0.04) }],
                ]}
              />
            );
          })}
        </View>

        {/* CUSTOM IMAGE-MATCHED EXIT DIALOG */}
        <Modal
          visible={showExitModal}
          transparent
          statusBarTranslucent
          navigationBarTranslucent
          presentationStyle="overFullScreen"
          animationType="fade"
          onRequestClose={() => setShowExitModal(false)}
        >
          <View style={styles.modalOverlayContainer}>
            <View style={styles.exitCard}>
              <Text style={styles.exitTitle}>Are you sure? clicking yes will make you lose your progress.</Text>
              <View style={styles.exitActions}>
                <TouchableOpacity
                  style={styles.exitBtn}
                  onPress={handleConfirmExit}
                  activeOpacity={0.7}
                >
                  <Text style={styles.exitBtnText}>YES</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.exitBtn}
                  onPress={() => setShowExitModal(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.exitBtnText}>NO</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* QUIZ MODAL */}
        <Modal
          visible={isModalVisible}
          transparent
          statusBarTranslucent
          navigationBarTranslucent
          presentationStyle="overFullScreen"
          animationType="fade"
          onRequestClose={() => {}}
        >
          <View style={styles.modalOverlayContainer}>
            <ScrollView
              style={styles.quizPopupScrollView}
              contentContainerStyle={styles.quizPopupScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.quizPopupGroup}>
                <View
                  style={[
                    styles.quizSceneCard,
                    { height: quizCardHeight || QUIZ_SCENE_FALLBACK_HEIGHT },
                  ]}
                >
                  <ImageBackground
                    source={require('../../assets/images/bookcase.png')}
                    style={styles.quizSceneBackground}
                    imageStyle={styles.quizSceneBackgroundImage}
                    resizeMode="cover"
                  />
                  <View pointerEvents="none" style={styles.quizSceneForeground}>
                    <Image
                      source={dialogueImage}
                      style={styles.quizCharacterImage}
                      resizeMode="contain"
                    />
                    <View style={styles.quizDialogueBox}>
                      <Text style={styles.quizDialogueText}>{typedDialogue}</Text>
                    </View>
                  </View>
                </View>
                <View
                  style={styles.quizCard}
                  onLayout={({ nativeEvent }) => {
                    const measuredHeight = nativeEvent.layout.height;
                    setQuizCardHeight((currentHeight) =>
                      Math.abs(currentHeight - measuredHeight) > 1 ? measuredHeight : currentHeight,
                    );
                  }}
                >
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

                  let optionStateStyle: ViewStyle = {};
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
            </ScrollView>
          </View>
        </Modal>

      </SafeAreaView>
      {/* Keep the victory dimmer full-screen instead of clipping it to safe-area content. */}
      {winner && (
        <TouchableOpacity
          style={[StyleSheet.absoluteFill, styles.modalOverlayContainer]}
          activeOpacity={1}
          onPress={handleVictoryTap}
        >
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
  mainContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingVertical: 10,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 20,
  },
  exitButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1.5,
    borderColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 30,
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

  boardFrame: {
    ...BOARD_FRAME,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  boardImage: { position: 'absolute', width: '100%', height: '100%' },
  tileNumber: {
    color: '#fff',
    fontSize: TILE_NUMBER_FONT_SIZE,
    fontWeight: TILE_NUMBER_FONT_WEIGHT,
    textAlign: 'right',
    includeFontPadding: false,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  playerTokenWrapper: {
    position: 'absolute',
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
    height: 56,
  },
  diceButton: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diceImage: { resizeMode: 'contain' },
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* MATCHED DIALOG DESIGN */
  exitCard: {
    width: '88%',
    maxWidth: 380,
    backgroundColor: '#1b2338',
    borderRadius: 8,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 12,
  },
  exitTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
    textAlign: 'center',
  },
  exitActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    width: '100%',
  },
  exitBtn: {
    flex: 1,
    maxWidth: 130,
    backgroundColor: '#27334d',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b4b6c',
    alignItems: 'center',
  },
  exitBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },

  popupImageContainer: {
    width: '88%',
    maxWidth: 340,
    aspectRatio: 340 / 260,
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

  quizPopupScrollView: {
    flex: 1,
    width: '100%',
  },
  quizPopupScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  quizPopupGroup: {
    width: '88%',
    maxWidth: 420,
    alignItems: 'center',
    gap: 12,
  },
  quizSceneCard: {
    width: '100%',
    position: 'relative',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#475569',
    backgroundColor: '#1e293b',
    overflow: 'visible',
  },
  quizSceneBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    overflow: 'hidden',
  },
  quizSceneBackgroundImage: {
    borderRadius: 14,
  },
  quizSceneForeground: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    padding: 16,
    overflow: 'visible',
  },
  quizCharacterImage: {
    position: 'absolute',
    right: 6,
    bottom: 30,
    width: '70%',
    aspectRatio: 1,
    transform: [{ scale: 1.12 }],
    zIndex: 1,
  },
  quizDialogueBox: {
    width: '58%',
    minHeight: 100,
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    backgroundColor: 'rgba(15,23,42,0.86)',
    zIndex: 2,
  },
  quizDialogueText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  quizCard: {
    width: '100%',
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
    minHeight: 44,
    backgroundColor: '#facc15',
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    color: '#1e293b',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
