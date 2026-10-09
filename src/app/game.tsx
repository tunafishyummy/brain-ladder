import { useAudioPlayer } from 'expo-audio';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Image,
  ImageBackground,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAudio } from '../AudioContext';
import BookcaseBackground from '../components/BookcaseBackground';
import Dice3D, { type Dice3DHandle } from '../components/Dice3D';

const DICE_ROLL_SOUND = require('../../assets/audio/dice-roll.mp3');
const DICE_RESULT_SOUND = require('../../assets/audio/dice-result.mp3');
const POWER_UP_IMG = require('../../assets/images/power-up.png');
const HINT_IMG = require('../../assets/images/hint.png');
const SKIP_IMG = require('../../assets/images/skip.png');
const ADD_TIME_IMG = require('../../assets/images/add-time.png');
const REFRESH_IMG = require('../../assets/images/refresh.png');

const POWER_UP_TYPES = ['hint', 'skip', 'add-time', 'refresh'] as const;
const POWER_UP_IMAGES = {
  hint: HINT_IMG,
  skip: SKIP_IMG,
  'add-time': ADD_TIME_IMG,
  refresh: REFRESH_IMG,
};

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
const DIALOGUE_LINE_HEIGHT = 20;
const DIALOGUE_MAX_LINES = 3;
const QUIZ_DIALOGUE_BOX_HEIGHT = DIALOGUE_LINE_HEIGHT * DIALOGUE_MAX_LINES + 26;
const QUIZ_SCENE_HEIGHT = QUIZ_DIALOGUE_BOX_HEIGHT + 36;
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
  2: 23,
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
  powerUps: ('hint' | 'skip' | 'add-time' | 'refresh')[];
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
  hint?: string;
};

type DialogueSubject = 'Language' | 'Science' | 'History';
type DialogueSection = 'Encounter' | 'CorrectAnswer' | 'IncorrectAnswer';

const QUESTION_BANKS: Partial<Record<DialogueSubject, Question[]>> = {
  Language: require('../data/questions/language.json'),
  Science: require('../data/questions/science.json'),
  History: require('../data/questions/history.json'),
};

const shuffleQuestions = (questions: Question[]): Question[] => {
  const shuffled = questions.map((question) => {
    const options = question.options.map((text, index) => ({
      text,
      isCorrect: index === question.correctIndex,
    }));
    for (let index = options.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [options[index], options[randomIndex]] = [options[randomIndex], options[index]];
    }
    return {
      ...question,
      options: options.map(({ text }) => text),
      correctIndex: options.findIndex(({ isCorrect }) => isCorrect),
    };
  });
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }
  return shuffled;
};

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
      hint: 'This is a placeholder hint for testing purposes.',
    };
  }
  return {
    prompt: 'Placeholder question — answer correctly to dodge the snake!',
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    correctIndex: 0,
    hint: 'This is a placeholder hint for testing purposes.',
  };
};

export default function GameScreen() {
  const router = useRouter();
  const { masterVol, masterMute, sfxVol, sfxMute } = useAudio();
  const params = useLocalSearchParams<{ players?: string; playerColors?: string; level?: string; timer?: string }>();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const rollSoundPlayer = useAudioPlayer(DICE_ROLL_SOUND);
  const resultSoundPlayer = useAudioPlayer(DICE_RESULT_SOUND);

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
  const isInfiniteTimer = params.timer === 'infinite';

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
        powerUps: [],
      };
    });
  });

  // --- 10 RANDOM POWER-UP BOXES ON BOARD (Excluding starting/landing snake & ladder tiles) ---
  const [powerUpTiles, setPowerUpTiles] = useState<number[]>(() => {
    const tiles: number[] = [];
    const restrictedTiles = new Set([
      1,
      100,
      ...Object.keys(LADDERS).map(Number),
      ...Object.keys(SNAKES).map(Number),
    ]);

    while (tiles.length < 10) {
      const rand = Math.floor(Math.random() * 98) + 2;
      if (!restrictedTiles.has(rand) && !tiles.includes(rand)) {
        tiles.push(rand);
      }
    }
    return tiles;
  });

  // --- ROULETTE & TIMER STATE ---
  const [rouletteModalVisible, setRouletteModalVisible] = useState(false);
  const [rouletteDisplayItem, setRouletteDisplayItem] = useState<'hint' | 'skip' | 'add-time' | 'refresh'>('hint');
  const [challengeSeconds, setChallengeSeconds] = useState(30);
  const [isChallengeActive, setIsChallengeActive] = useState(false);
  const [hintMessage, setHintMessage] = useState<string | null>(null);

  const [turnIndex, setTurnIndex] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const [isDiceReady, setIsDiceReady] = useState(false);
  const diceRef = useRef<Dice3DHandle>(null);
  const [winner, setWinner] = useState<Player | null>(null);

  // --- STAT TRACKING REFS ---
  const startTimeRef = useRef(Date.now());
  const totalRollsRef = useRef(0);
  const questionsAnsweredRef = useRef(0);
  const snakeBitesRef = useRef(0);
  const ladderClimbsRef = useRef(0);
  const powersUsedRef = useRef(0);

  const [pendingEvent, setPendingEvent] = useState<PendingEvent | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [useQuestionBank, setUseQuestionBank] = useState(true);
  const questionDeck = useRef<Question[]>([]);

  const [showExitModal, setShowExitModal] = useState(false);
  const [movement, setMovement] = useState<BoardMovement | null>(null);
  const [dialogueText, setDialogueText] = useState('');
  const [typedDialogue, setTypedDialogue] = useState('');
  const movementLocked = useRef(false);
  const cameraScale = useRef(new Animated.Value(1)).current;
  const cameraFollow = useRef(new Animated.Value(0)).current;

  // Available power-ups filtered safely outside JSX
  const availablePowerUps = POWER_UP_TYPES.filter(
    (pType) => !(pType === 'add-time' && isInfiniteTimer)
  );

  // Challenge timer countdown effect
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isChallengeActive && !isInfiniteTimer) {
      timer = setInterval(() => {
        setChallengeSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsAnswerCorrect(false);
            setIsChallengeActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isChallengeActive, isInfiniteTimer]);

  useEffect(() => {
    const sfxVolume = masterMute || sfxMute ? 0 : (masterVol / 100) * (sfxVol / 100);
    rollSoundPlayer.volume = sfxVolume;
    resultSoundPlayer.volume = sfxVolume;
    rollSoundPlayer.loop = false;
    resultSoundPlayer.loop = false;
  }, [masterVol, masterMute, sfxVol, sfxMute, rollSoundPlayer, resultSoundPlayer]);

  const activePlayer = players[turnIndex] || players[0];
  const isModalVisible = pendingEvent !== null;
  const dialogueSubject: DialogueSubject = params.level === 'reading'
    ? 'Language'
    : params.level === 'research'
      ? 'Science'
      : 'History';
  const hasQuestionBank = Boolean(QUESTION_BANKS[dialogueSubject]?.length);
  const dialogueImage = pendingEvent?.type === 'ladder'
    ? require('../../assets/images/LogoLad.png')
    : require('../../assets/images/LogoKnowItAdder.png');

  const getNextQuestion = (eventType: EventType): Question => {
    const questions = QUESTION_BANKS[dialogueSubject];
    if (!useQuestionBank || !questions?.length) return getPlaceholderQuestion(eventType);
    if (questionDeck.current.length === 0) {
      questionDeck.current = shuffleQuestions(questions);
    }
    return questionDeck.current.pop() ?? getPlaceholderQuestion(eventType);
  };

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
    const movementDuration = path.slice(1).reduce((duration, position, index) => {
      const from = getCoordinatesForPosition(path[index]);
      const to = getCoordinatesForPosition(position);
      const distanceInTiles = Math.hypot(to.x - from.x, to.y - from.y) / cellSize;
      return duration + Math.max(PLAYER_TILE_MOVE_MS, Math.round(distanceInTiles * PLAYER_TILE_MOVE_MS));
    }, 0);

    requestAnimationFrame(() => {
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

        Animated.timing(progress, {
          toValue: path.length - 1,
          duration: movementDuration,
          easing: Easing.linear,
          useNativeDriver: true,
        }).start(({ finished: movementFinished }) => {
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
            if (resetFinished) onComplete();
            setMovement(null);
          });
        });
      });
    });
  };

  const rollDice = () => {
    if (!isDiceReady || isRolling || movementLocked.current || winner || isModalVisible || showExitModal || rouletteModalVisible) return;
    setIsRolling(true);
    totalRollsRef.current += 1;
    void rollSoundPlayer.seekTo(0).then(() => rollSoundPlayer.play()).catch((error: unknown) => {
      console.error('Failed to play the dice rolling sound.', error);
    });

    const finalRoll = Math.floor(Math.random() * 6) + 1;
    if (!diceRef.current?.roll(finalRoll)) {
      setIsRolling(false);
      return;
    }
  };

  const passTurn = () => {
    setTurnIndex((prev) => (prev + 1) % players.length);
  };

  const triggerPowerUpRoulette = (mover: Player, newPos: number) => {
    setPowerUpTiles((prev) => prev.filter((t) => t !== newPos));
    setRouletteModalVisible(true);

    let counter = 0;
    const maxTicks = 12;
    const interval = setInterval(() => {
      const randPick = availablePowerUps[Math.floor(Math.random() * availablePowerUps.length)];
      setRouletteDisplayItem(randPick);
      counter++;
      if (counter >= maxTicks) {
        clearInterval(interval);
        const finalAward = availablePowerUps[Math.floor(Math.random() * availablePowerUps.length)];
        setRouletteDisplayItem(finalAward);
        setTimeout(() => {
          setRouletteModalVisible(false);
          setPlayers((curr) =>
            curr.map((p) => (p.id === mover.id ? { ...p, powerUps: [...p.powerUps, finalAward] } : p))
          );
          if (newPos === 100) setWinner(mover);
          else passTurn();
        }, 800);
      }
    }, 100);
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
      } else if (powerUpTiles.includes(newPos)) {
        triggerPowerUpRoulette(updatedPlayer, newPos);
      } else if (LADDERS[newPos]) {
        ladderClimbsRef.current += 1;
        openQuiz({ type: 'ladder', landedPos: newPos, target: LADDERS[newPos] });
      } else if (SNAKES[newPos]) {
        snakeBitesRef.current += 1;
        openQuiz({ type: 'snake', landedPos: newPos, target: SNAKES[newPos] });
      } else {
        passTurn();
      }
    });
  };

  const openQuiz = (event: PendingEvent) => {
    setDialogueText(getRandomDialogueLine(event.type, dialogueSubject, 'Encounter'));
    setPendingEvent(event);
    setCurrentQuestion(getNextQuestion(event.type));
    setSelectedIndex(null);
    setIsAnswerCorrect(null);
    setHintMessage(null);
    setChallengeSeconds(30);
    setIsChallengeActive(true);
  };

  const handleAnswerSelect = (index: number) => {
    if (!currentQuestion || !pendingEvent || isAnswerCorrect !== null) return;
    setSelectedIndex(index);
  };

  const confirmAnswer = () => {
    if (!currentQuestion || !pendingEvent || selectedIndex === null || isAnswerCorrect !== null) return;
    setIsChallengeActive(false);
    const isCorrect = selectedIndex === currentQuestion.correctIndex;
    questionsAnsweredRef.current += 1;
    setDialogueText(getRandomDialogueLine(
      pendingEvent.type,
      dialogueSubject,
      isCorrect ? 'CorrectAnswer' : 'IncorrectAnswer',
    ));
    setIsAnswerCorrect(isCorrect);
  };

  const usePowerUp = (powerUpType: 'hint' | 'skip' | 'add-time' | 'refresh') => {
    const mover = players[turnIndex];
    if (!mover.powerUps.includes(powerUpType) || isAnswerCorrect !== null) return;

    powersUsedRef.current += 1;
    const indexToRemove = mover.powerUps.indexOf(powerUpType);
    const updatedPowerUps = [...mover.powerUps];
    updatedPowerUps.splice(indexToRemove, 1);
    setPlayers((curr) => curr.map((p) => (p.id === mover.id ? { ...p, powerUps: updatedPowerUps } : p)));

    if (powerUpType === 'hint' && currentQuestion) {
      const hint = currentQuestion.hint || `Hint: Focus on core concepts related to ${dialogueSubject}. Read the choices carefully!`;
      setHintMessage(hint);
    } else if (powerUpType === 'skip') {
      if (currentQuestion) {
        setSelectedIndex(currentQuestion.correctIndex);
        setIsAnswerCorrect(true);
        setIsChallengeActive(false);
        setDialogueText(getRandomDialogueLine(pendingEvent!.type, dialogueSubject, 'CorrectAnswer'));
      }
    } else if (powerUpType === 'add-time') {
      setChallengeSeconds((prev) => prev + 20);
    } else if (powerUpType === 'refresh') {
      if (pendingEvent) {
        setCurrentQuestion(getNextQuestion(pendingEvent.type));
        setSelectedIndex(null);
        setHintMessage(null);
      }
    }
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
    setHintMessage(null);

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
    const elapsedMs = Date.now() - startTimeRef.current;
    const totalSec = Math.floor(elapsedMs / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    const sortedPlayers = [...players].sort((a, b) => b.position - a.position);
    const leaderboard = sortedPlayers.map((p, index) => ({
      rank: index + 1,
      name: p.name,
      tile: p.position,
      avatar: p.color,
    }));

    const gameStats = {
      time: timeStr,
      totalRolls: totalRollsRef.current,
      questionsAnswered: questionsAnsweredRef.current,
      snakeBites: snakeBitesRef.current,
      ladderClimbs: ladderClimbsRef.current,
      powersUsed: powersUsedRef.current,
      leaderboard,
    };

    router.push({
      pathname: '/stats',
      params: { gameData: JSON.stringify(gameStats) },
    });
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
  const diceSize = Math.min(84, boardSize * 0.37);

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
            <View style={styles.questionModeControl}>
              <Text style={styles.questionModeText}>
                {!hasQuestionBank ? 'NO BANK' : useQuestionBank ? 'QUESTIONS' : 'DEMO'}
              </Text>
              <Switch
                value={hasQuestionBank && useQuestionBank}
                onValueChange={setUseQuestionBank}
                disabled={!hasQuestionBank}
                trackColor={{ false: '#64748b', true: '#15803d' }}
                thumbColor="#ffffff"
              />
            </View>
          </View>

          {/* BOARD FRAME */}
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
                
                {/* POWER-UP BOXES ON BOARD */}
                {powerUpTiles.map((tileNum) => {
                  const { x, y } = getCoordinatesForPosition(tileNum);
                  const pSize = cellSize * 0.65;
                  return (
                    <View
                      key={`powerup-${tileNum}`}
                      style={{
                        position: 'absolute',
                        left: x + (cellSize - pSize) / 2,
                        top: y + (cellSize - pSize) / 2,
                        width: pSize,
                        height: pSize,
                        zIndex: 4,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Image source={POWER_UP_IMG} style={{ width: '100%', height: '100%', resizeMode: 'contain' }} />
                    </View>
                  );
                })}

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

          {/* 3D DICE SECTION */}
          <View style={styles.diceSection}>
            <TouchableOpacity
              style={styles.diceButton}
              onPress={rollDice}
              disabled={!isDiceReady || isRolling || !!winner || isModalVisible || showExitModal || rouletteModalVisible}
              activeOpacity={0.7}
            >
              <Dice3D
                ref={diceRef}
                size={diceSize}
                onReady={() => setIsDiceReady(true)}
                onRollComplete={(value) => {
                  setIsRolling(false);
                  void resultSoundPlayer.seekTo(0).then(() => resultSoundPlayer.play()).catch((error: unknown) => {
                    console.error('Failed to play the dice result sound.', error);
                  });
                  movePlayer(value);
                }}
                onError={() => {
                  setIsDiceReady(false);
                  Alert.alert(
                    '3D die unavailable',
                    'The die renderer could not start. Please restart the game and try again.',
                  );
                }}
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

        {/* POWER-UP ROULETTE MODAL */}
        <Modal visible={rouletteModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlayContainer}>
            <View style={styles.rouletteCard}>
              <Text style={styles.rouletteTitle}>🎁 Power-Up Acquired!</Text>
              <Image source={POWER_UP_IMAGES[rouletteDisplayItem]} style={styles.rouletteImage} resizeMode="contain" />
              <Text style={styles.rouletteSubtitle}>Spinning...</Text>
            </View>
          </View>
        </Modal>

        {/* EXIT DIALOG */}
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
                <TouchableOpacity style={styles.exitBtn} onPress={handleConfirmExit} activeOpacity={0.7}>
                  <Text style={styles.exitBtnText}>YES</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.exitBtn} onPress={() => setShowExitModal(false)} activeOpacity={0.7}>
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
                <ImageBackground
                  source={require('../../assets/images/bookcase.png')}
                  style={styles.quizSceneCard}
                  imageStyle={styles.quizSceneBackgroundImage}
                  resizeMode="cover"
                >
                  <View pointerEvents="none" style={styles.quizSceneForeground}>
                    <Image source={dialogueImage} style={styles.quizCharacterImage} resizeMode="contain" />
                    <View style={styles.quizDialogueBox}>
                      <Text style={styles.quizDialogueText} numberOfLines={DIALOGUE_MAX_LINES} ellipsizeMode="tail">
                        {typedDialogue}
                      </Text>
                    </View>
                  </View>
                </ImageBackground>

                {/* TIMER DISPLAY */}
                {!isInfiniteTimer && (
                  <Text style={styles.timerDisplay}>
                    Timer: {String(Math.floor(challengeSeconds / 60)).padStart(2, '0')}:
                    {String(challengeSeconds % 60).padStart(2, '0')}
                  </Text>
                )}

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

                  {/* HINT BANNER */}
                  {hintMessage && (
                    <View style={styles.hintBanner}>
                      <Text style={styles.hintBannerText}>💡 {hintMessage}</Text>
                    </View>
                  )}

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
                      } else if (isSelected) {
                        optionStateStyle = styles.optionSelected;
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

                  <View style={styles.resultBlock}>
                    <TouchableOpacity
                      style={[
                        styles.continueButton,
                        isAnswerCorrect === null && selectedIndex === null && styles.continueButtonDisabled,
                        isAnswerCorrect === true && styles.answerCorrectButton,
                        isAnswerCorrect === false && styles.answerIncorrectButton,
                      ]}
                      onPress={isAnswerCorrect === null ? confirmAnswer : resolveQuiz}
                      disabled={isAnswerCorrect === null && selectedIndex === null}
                      activeOpacity={0.8}
                    >
                      <Text style={[
                        styles.continueButtonText,
                        isAnswerCorrect !== null && styles.answerResultButtonText,
                      ]}>
                        {isAnswerCorrect === null
                          ? 'Confirm Answer'
                          : isAnswerCorrect
                            ? 'Correct!'
                            : 'Incorrect!'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* POWER-UP INVENTORY BUTTONS */}
                <View style={styles.powerUpsBar}>
                  {availablePowerUps.map((pType) => {
                    const count = activePlayer.powerUps.filter((item) => item === pType).length;
                    const iconSource = POWER_UP_IMAGES[pType];

                    return (
                      <TouchableOpacity
                        key={pType}
                        style={[styles.powerUpButton, count === 0 && styles.powerUpDisabled]}
                        onPress={() => usePowerUp(pType)}
                        disabled={count === 0 || isAnswerCorrect !== null}
                        activeOpacity={0.7}
                      >
                        <Image source={iconSource} style={styles.powerUpIcon} resizeMode="contain" />
                        <Text style={styles.powerUpCountText}>x{count}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

              </View>
            </ScrollView>
          </View>
        </Modal>

      </SafeAreaView>

      {/* VICTORY POPUP */}
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
  questionModeControl: {
    minWidth: 108,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  questionModeText: {
    width: 64,
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'center',
  },
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
    minWidth: 72,
    minHeight: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  rouletteCard: {
    width: 260,
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#facc15',
  },
  rouletteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  rouletteImage: {
    width: 80,
    height: 80,
    marginBottom: 12,
  },
  rouletteSubtitle: {
    fontSize: 14,
    color: '#facc15',
    fontWeight: '700',
  },
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
    gap: 10,
  },
  quizSceneCard: {
    width: '100%',
    height: QUIZ_SCENE_HEIGHT,
    position: 'relative',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#475569',
    overflow: 'visible',
  },
  quizSceneBackgroundImage: {
    borderRadius: 16,
  },
  quizSceneForeground: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    padding: 16,
    overflow: 'visible',
  },
  quizCharacterImage: {
    position: 'absolute',
    right: 30,
    bottom: -140,
    width: 112,
    aspectRatio: 1,
    transform: [{ scale: 2 }],
    zIndex: 1,
  },
  quizDialogueBox: {
    width: '58%',
    height: QUIZ_DIALOGUE_BOX_HEIGHT,
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
    lineHeight: DIALOGUE_LINE_HEIGHT,
    fontWeight: '600',
  },
  timerDisplay: {
    fontSize: 18,
    fontWeight: '900',
    color: '#facc15',
    textAlign: 'center',
    marginVertical: 4,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
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
  hintBanner: {
    backgroundColor: '#334155',
    borderWidth: 1.5,
    borderColor: '#facc15',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  hintBannerText: {
    color: '#fef08a',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
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
  optionSelected: {
    backgroundColor: '#475569',
    borderColor: '#facc15',
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
  continueButton: {
    minHeight: 44,
    backgroundColor: '#facc15',
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonDisabled: {
    opacity: 0.45,
  },
  answerCorrectButton: {
    backgroundColor: '#16a34a',
  },
  answerIncorrectButton: {
    backgroundColor: '#dc2626',
  },
  continueButtonText: {
    color: '#1e293b',
    fontWeight: 'bold',
    fontSize: 14,
  },
  answerResultButtonText: {
    color: '#fff',
  },
  powerUpsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
    gap: 8,
  },
  powerUpButton: {
    flex: 1,
    backgroundColor: '#c2410c',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ea580c',
  },
  powerUpDisabled: {
    opacity: 0.4,
  },
  powerUpIcon: {
    width: 28,
    height: 28,
    marginBottom: 4,
  },
  powerUpCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
  },
});
