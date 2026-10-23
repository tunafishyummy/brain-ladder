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
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAudio } from '../AudioContext';
import BookcaseBackground, { getBookcaseSource } from '../components/BookcaseBackground';
import Dice3D, { type Dice3DHandle } from '../components/Dice3D';
import { getWoodframeSource } from '../components/woodframes';

const DICE_ROLL_SOUND = require('../../assets/audio/dice-roll.mp3');
const DICE_RESULT_SOUND = require('../../assets/audio/dice-result.mp3');
const VICTORY_SOUND = require('../../assets/audio/victory-trumpet.mp3');
const CORRECT_SOUND = require('../../assets/audio/xylophone-correct.mp3');
const WRONG_SOUND = require('../../assets/audio/book-drop-wrong.mp3');
const TICKING_SOUND = require('../../assets/audio/clock-ticking.mp3');
const POWER_UP_IMG = require('../../assets/images/power-up.png');
const HINT_IMG = require('../../assets/images/hint.png');
const SKIP_IMG = require('../../assets/images/skip.png');
const ADD_TIME_IMG = require('../../assets/images/add-time.png');
const REFRESH_IMG = require('../../assets/images/refresh.png');
const ADDER_DIALOGUE_IMG = require('../../assets/images/AdderDialogue.png');
const LAD_DIALOGUE_IMG = require('../../assets/images/LadDialogue.png');
const LAD_DIALOGUE_CHEER_IMG = require('../../assets/images/LadDialogueCheer.png');
const LAD_DIALOGUE_SHOCK_IMG = require('../../assets/images/LadDialogueShock.png');

const POWER_UP_TYPES = ['hint', 'skip', 'add-time', 'refresh'] as const;
type PowerUpType = typeof POWER_UP_TYPES[number];

const POWER_UP_IMAGES = {
  hint: HINT_IMG,
  skip: SKIP_IMG,
  'add-time': ADD_TIME_IMG,
  refresh: REFRESH_IMG,
};
const POWER_UP_LABELS: Record<PowerUpType, string> = {
  hint: 'Hint',
  skip: 'Skip',
  'add-time': 'Add Time',
  refresh: 'Refresh',
};

const MAX_BOARD_SIZE = 380;
const BOARD_FRAME_BORDER_WIDTH = 2;
const BOARD_FRAME_SIDE_INSET = 8;
const BOARD_FRAME_HEIGHT_RATIO = 1.2;
const BOARD_RESTING_WIDTH_RATIO = 0.82;
const BOARD_IMAGE_SCALE = 1.18;
const BOARD_BACKGROUND_SCALE = 1.5;
const BOARD_CAMERA_ZOOM = 1.45;
const BOARD_BACKGROUNDS: Record<string, number> = {
  reading: require('../../assets/images/LanguageBoardBG.png'),
  research: require('../../assets/images/ScienceBoardBG.png'),
  collections: require('../../assets/images/HistoryBoardBG.png'),
};
const PLAYER_MOVEMENT_WARMUP_MS = 650;
const PLAYER_MOVEMENT_COOLDOWN_MS = 500;
const PLAYER_TILE_MOVE_MS = 150;
const TYPEWRITER_CHARACTER_INTERVAL_MS = 18;
const DIALOGUE_LINE_HEIGHT = 20;
const DIALOGUE_MAX_LINES = 3;
const QUIZ_DIALOGUE_BOX_HEIGHT = DIALOGUE_LINE_HEIGHT * DIALOGUE_MAX_LINES + 26;
const QUIZ_SCENE_HEIGHT = QUIZ_DIALOGUE_BOX_HEIGHT + 36;
const BOARD_FRAME = {
  borderWidth: BOARD_FRAME_BORDER_WIDTH,
  borderRadius: 10,
  borderColor: '#0f0f0fb9',
  backgroundColor: 'rgba(38, 38, 38, 0.69)',
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

const SNAKES: { [key: number]: number } = {
  29: 9,
  38: 15,
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
  powerUps: PowerUpType[];
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

type Difficulty = 'Easy' | 'Normal' | 'Hard';

type Question = {
  prompt: string;
  options: string[];
  correctIndex: number;
  hint?: string;
  difficulty?: Difficulty;
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
  const params = useLocalSearchParams<{
    players?: string;
    playerColors?: string;
    level?: string;
    timer?: string;
    difficulty?: Difficulty;
  }>();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const rollSoundPlayer = useAudioPlayer(DICE_ROLL_SOUND);
  const resultSoundPlayer = useAudioPlayer(DICE_RESULT_SOUND);
  const victorySoundPlayer = useAudioPlayer(VICTORY_SOUND);
  const correctSoundPlayer = useAudioPlayer(CORRECT_SOUND);
  const wrongSoundPlayer = useAudioPlayer(WRONG_SOUND);
  const tickingSoundPlayer = useAudioPlayer(TICKING_SOUND);

  const frameWidth = screenWidth - BOARD_FRAME_SIDE_INSET * 2;
  const frameHeight = Math.min(frameWidth * BOARD_FRAME_HEIGHT_RATIO, screenHeight * 0.52);
  const boardAreaWidth = frameWidth - BOARD_FRAME_BORDER_WIDTH * 2;
  const boardAreaHeight = frameHeight - BOARD_FRAME_BORDER_WIDTH * 2;
  const boardSize = Math.min(
    frameWidth * BOARD_RESTING_WIDTH_RATIO,
    frameHeight * BOARD_RESTING_WIDTH_RATIO,
    MAX_BOARD_SIZE,
  );
  const gridSize = boardSize - BOARD_FRAME_BORDER_WIDTH * 2;
  const boardBackground = BOARD_BACKGROUNDS[params.level ?? 'collections'] ?? BOARD_BACKGROUNDS.collections;
  const cellSize = gridSize / 10;
  const playerCount = Math.min(3, Math.max(1, Number(params.players) || 3));
  const configuredTimer = Number(params.timer);
  const challengeTimeLimit = Number.isFinite(configuredTimer) && params.timer !== ''
    ? Math.max(0, configuredTimer)
    : 15;
  const isInfiniteTimer = params.timer === 'infinite' || challengeTimeLimit === 0;
  const selectedDifficulty: Difficulty = params.difficulty === 'Easy' || params.difficulty === 'Hard'
    ? params.difficulty
    : 'Normal';

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
  const [debugMoveModalVisible, setDebugMoveModalVisible] = useState(false);
  const [debugPlayerId, setDebugPlayerId] = useState('1');
  const [debugTile, setDebugTile] = useState('1');

  const [powerUpTiles, setPowerUpTiles] = useState<number[]>(() => {
    const tiles: number[] = [];
    const restrictedTiles = new Set([
      1,
      100,
      ...Object.keys(LADDERS).map(Number),
      ...Object.values(LADDERS),
      ...Object.keys(SNAKES).map(Number),
      ...Object.values(SNAKES),
    ]);

    while (tiles.length < 10) {
      const rand = Math.floor(Math.random() * 98) + 2;
      if (!restrictedTiles.has(rand) && !tiles.includes(rand)) {
        tiles.push(rand);
      }
    }
    return tiles;
  });

  const [rouletteModalVisible, setRouletteModalVisible] = useState(false);
  const [rouletteDisplayItem, setRouletteDisplayItem] = useState<'hint' | 'skip' | 'add-time' | 'refresh'>('hint');
  const [challengeSeconds, setChallengeSeconds] = useState(challengeTimeLimit);
  const [isChallengeActive, setIsChallengeActive] = useState(false);
  const [hintMessage, setHintMessage] = useState<string | null>(null);

  const [turnIndex, setTurnIndex] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const [isDiceReady, setIsDiceReady] = useState(false);
  const diceRef = useRef<Dice3DHandle>(null);
  const [winner, setWinner] = useState<Player | null>(null);

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
  const questionDeck = useRef<Question[]>([]);

  const [showExitModal, setShowExitModal] = useState(false);
  const [movement, setMovement] = useState<BoardMovement | null>(null);
  const [dialogueText, setDialogueText] = useState('');
  const [typedDialogue, setTypedDialogue] = useState('');
  const movementLocked = useRef(false);
  const cameraScale = useRef(new Animated.Value(1)).current;
  const cameraFollow = useRef(new Animated.Value(0)).current;

  const availablePowerUps = POWER_UP_TYPES.filter(
    (pType) => !(pType === 'add-time' && isInfiniteTimer)
  );
  const dialogueSubject: DialogueSubject = params.level === 'reading'
    ? 'Language'
    : params.level === 'research'
      ? 'Science'
      : 'History';

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isChallengeActive && !isInfiniteTimer) {
      timer = setInterval(() => {
        setChallengeSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            if (pendingEvent) {
              setDialogueText(getRandomDialogueLine(pendingEvent.type, dialogueSubject, 'IncorrectAnswer'));
            }
            setIsAnswerCorrect(false);
            setIsChallengeActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isChallengeActive, isInfiniteTimer, pendingEvent, dialogueSubject]);

  useEffect(() => {
    const sfxVolume = masterMute || sfxMute ? 0 : (masterVol / 100) * (sfxVol / 100);
    rollSoundPlayer.volume = sfxVolume;
    resultSoundPlayer.volume = sfxVolume;
    victorySoundPlayer.volume = sfxVolume;
    correctSoundPlayer.volume = sfxVolume;
    wrongSoundPlayer.volume = sfxVolume;
    tickingSoundPlayer.volume = sfxVolume;
    tickingSoundPlayer.loop = false;
    correctSoundPlayer.loop = false;
    wrongSoundPlayer.loop = false;
    rollSoundPlayer.loop = false;
    resultSoundPlayer.loop = false;
    victorySoundPlayer.loop = false;
  }, [masterVol, masterMute, sfxVol, sfxMute, rollSoundPlayer, resultSoundPlayer, victorySoundPlayer, correctSoundPlayer, wrongSoundPlayer, tickingSoundPlayer]);

  const isTimerLow = !isInfiniteTimer && challengeSeconds <= 5 && isAnswerCorrect !== true;
  const shouldTick = isTimerLow && isChallengeActive && challengeSeconds > 0;
  useEffect(() => {
    let isMounted = true;

    if (shouldTick) {
      void tickingSoundPlayer.seekTo(0).then(() => {
        if (isMounted) tickingSoundPlayer.play();
      }).catch((error: unknown) => {
        console.warn('Unable to play ticking sound', error);
      });
    } else {
      tickingSoundPlayer.pause();
    }

    return () => {
      isMounted = false;
    };
  }, [shouldTick, tickingSoundPlayer]);

  useEffect(() => {
    if (isAnswerCorrect === null) return;
    const player = isAnswerCorrect ? correctSoundPlayer : wrongSoundPlayer;
    void player.seekTo(0).then(() => player.play()).catch((error: unknown) => {
      console.warn('Unable to play answer sound', error);
    });
  }, [isAnswerCorrect, correctSoundPlayer, wrongSoundPlayer]);

  useEffect(() => {
    if (!winner) return;
    void victorySoundPlayer.seekTo(0).then(() => victorySoundPlayer.play()).catch((error: unknown) => {
      console.warn('Unable to play victory sound', error);
    });
  }, [winner, victorySoundPlayer]);

  const activePlayer = players[turnIndex] || players[0];
  const isModalVisible = pendingEvent !== null;
  const parsedDebugTile = Number(debugTile);
  const isDebugMoveValid = /^\d+$/.test(debugTile) && parsedDebugTile >= 1 && parsedDebugTile <= 100;
  const isDebugMoveBlocked = isRolling || movement !== null || Boolean(
    winner || isModalVisible || showExitModal || rouletteModalVisible,
  );
  const dialogueImage = pendingEvent?.type === 'ladder'
    ? isAnswerCorrect === true
      ? LAD_DIALOGUE_CHEER_IMG
      : isAnswerCorrect === false
        ? LAD_DIALOGUE_SHOCK_IMG
        : LAD_DIALOGUE_IMG
    : ADDER_DIALOGUE_IMG;

  const getNextQuestion = (eventType: EventType): Question => {
    const rawQuestions = QUESTION_BANKS[dialogueSubject];
    if (!rawQuestions?.length) return getPlaceholderQuestion(eventType);
    if (questionDeck.current.length === 0) {
      const filtered = rawQuestions.filter((q) => !q.difficulty || q.difficulty === selectedDifficulty);
      const pool = filtered.length > 0 ? filtered : rawQuestions;
      questionDeck.current = shuffleQuestions(pool);
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
    router.dismissAll();
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

  const passTurn = (fromIndex = turnIndex) => {
    setTurnIndex((fromIndex + 1) % players.length);
  };

  const triggerPowerUpRoulette = (mover: Player, newPos: number, moverIndex: number) => {
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
        void resultSoundPlayer.seekTo(0).then(() => resultSoundPlayer.play()).catch((error: unknown) => {
          console.warn('Unable to play power-up sound', error);
        });
        setTimeout(() => {
          setRouletteModalVisible(false);
          setPlayers((curr) =>
            curr.map((p) => (p.id === mover.id ? { ...p, powerUps: [...p.powerUps, finalAward] } : p))
          );
          if (newPos === 100) setWinner(mover);
          else passTurn(moverIndex);
        }, 800);
      }
    }, 100);
  };

  const movePlayer = (roll: number, moverIndex = turnIndex) => {
    const mover = players[moverIndex];
    if (!mover) return;
    let newPos = mover.position;
    let direction = 1;
    const path = [newPos];
    for (let step = 0; step < roll; step += 1) {
      newPos += direction;
      if (newPos >= 100) {
        newPos = 100;
        direction = -1;
      } else if (newPos <= 1) {
        newPos = 1;
        direction = 1;
      }
      path.push(newPos);
    }

    animatePlayerPath(mover.id, path, () => {
      resolvePlayerLanding(mover, moverIndex, newPos);
    });
  };

  const movePlayerToTile = (targetTile: number, moverIndex: number) => {
    const mover = players[moverIndex];
    if (!mover) return;
    const direction = targetTile >= mover.position ? 1 : -1;
    const path = [mover.position];
    for (let tile = mover.position + direction; direction > 0 ? tile <= targetTile : tile >= targetTile; tile += direction) {
      path.push(tile);
    }

    animatePlayerPath(mover.id, path, () => {
      resolvePlayerLanding(mover, moverIndex, targetTile);
    });
  };

  const openDebugMoveModal = () => {
    if (isDebugMoveBlocked) return;
    setDebugPlayerId(activePlayer.id);
    setDebugTile(String(activePlayer.position));
    setDebugMoveModalVisible(true);
  };

  const applyDebugMove = () => {
    const moverIndex = players.findIndex((player) => player.id === debugPlayerId);
    if (isDebugMoveBlocked || moverIndex < 0 || !isDebugMoveValid) return;
    setDebugMoveModalVisible(false);
    if (players[moverIndex].position === parsedDebugTile) return;
    setTurnIndex(moverIndex);
    movePlayerToTile(parsedDebugTile, moverIndex);
  };

  const giveDebugPowerUp = (powerUpType: PowerUpType) => {
    if (isDebugMoveBlocked || !players.some((player) => player.id === debugPlayerId)) return;
    setPlayers((currentPlayers) => currentPlayers.map((player) => (
      player.id === debugPlayerId
        ? { ...player, powerUps: [...player.powerUps, powerUpType] }
        : player
    )));
  };

  const openQuiz = (event: PendingEvent) => {
    setDialogueText(getRandomDialogueLine(event.type, dialogueSubject, 'Encounter'));
    setPendingEvent(event);
    setCurrentQuestion(getNextQuestion(event.type));
    setSelectedIndex(null);
    setIsAnswerCorrect(null);
    setHintMessage(null);
    setChallengeSeconds(challengeTimeLimit);
    setIsChallengeActive(true);
  };

  const resolvePlayerLanding = (mover: Player, moverIndex: number, newPos: number) => {
    const updatedPlayer = { ...mover, position: newPos };
    setPlayers((currentPlayers) => currentPlayers.map((player) =>
      player.id === mover.id ? updatedPlayer : player,
    ));

    if (newPos === 100) {
      setWinner(updatedPlayer);
    } else if (powerUpTiles.includes(newPos)) {
      triggerPowerUpRoulette(updatedPlayer, newPos, moverIndex);
    } else if (LADDERS[newPos]) {
      openQuiz({ type: 'ladder', landedPos: newPos, target: LADDERS[newPos] });
    } else if (SNAKES[newPos]) {
      openQuiz({ type: 'snake', landedPos: newPos, target: SNAKES[newPos] });
    } else {
      passTurn(moverIndex);
    }
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

  const usePowerUp = (powerUpType: PowerUpType) => {
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
    const target = pendingEvent.type === 'ladder'
      ? isAnswerCorrect ? pendingEvent.target : startPosition
      : isAnswerCorrect ? Math.min(startPosition + 1, 100) : pendingEvent.target;
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
      if (pendingEvent.type === 'ladder' && isAnswerCorrect) {ladderClimbsRef.current += 1;}
      else if (pendingEvent.type === 'snake' && !isAnswerCorrect) {snakeBitesRef.current += 1;}
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
      params: {
        gameData: JSON.stringify(gameStats),
        difficulty: selectedDifficulty,
        level: params.level,
      },
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
        Animated.subtract(gridSize / 2, Animated.multiply(cameraScale, movementX)),
      )
    : 0;
  const cameraTranslateY = movementY
    ? Animated.multiply(
        cameraFollow,
        Animated.subtract(gridSize / 2, Animated.multiply(cameraScale, movementY)),
      )
    : 0;
  const boardNumbersOpacity = cameraScale.interpolate({
    inputRange: [1, BOARD_CAMERA_ZOOM],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const diceSize = Math.min(84, boardSize * 0.37);
  const quizPopupWidth = Math.min(screenWidth * 0.94, 480);
  const quizFrameHeight = quizPopupWidth * 4 / 3 * 1.1;

  return (
    <BookcaseBackground level={params.level}>
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
        <View style={styles.mainContainer}>
          <View style={[styles.headerRow, { width: frameWidth }]}>
            <TouchableOpacity
              style={styles.exitButton}
              onPress={() => setShowExitModal(true)}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Image
                source={require('../../assets/images/Backbutton.png')}
                style={styles.exitButtonImage}
                resizeMode="contain"
              />
            </TouchableOpacity>

            <ImageBackground
              source={getWoodframeSource(params.level, '6to1')}
              resizeMode="stretch"
              style={styles.turnBanner}
            >
              <Text style={styles.turnText}>{activePlayer.name}'s Turn</Text>
            </ImageBackground>
          </View>

          <View style={[styles.boardFrame, { width: frameWidth, height: frameHeight }]}>
            <Animated.View
              style={{
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
                  source={boardBackground}
                  style={[
                    styles.boardFrameBackground,
                    {
                      left: (gridSize - boardAreaWidth) / 2,
                      top: (gridSize - boardAreaHeight) / 2,
                      width: boardAreaWidth,
                      height: boardAreaHeight,
                      transform: [{ scale: BOARD_BACKGROUND_SCALE }],
                    },
                  ]}
                  resizeMode="cover"
                />
                <Image
                  source={require('../../assets/images/board.png')}
                  style={[styles.boardImage, { transform: [{ scale: BOARD_IMAGE_SCALE }] }]}
                  resizeMode="cover"
                />
                <Animated.Image
                  source={require('../../assets/images/boardnumbers.png')}
                  style={[
                    styles.boardImage,
                    {
                      transform: [{ scale: BOARD_IMAGE_SCALE }],
                      opacity: boardNumbersOpacity,
                    },
                  ]}
                  resizeMode="cover"
                  {...({ pointerEvents: 'none' } as any)}
                />
                
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
                  const markerSize = cellSize * 1.15;
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
                  const playersOnTile = players.filter((otherPlayer) => otherPlayer.position === player.position);
                  const stackIndex = playersOnTile.findIndex((otherPlayer) => otherPlayer.id === player.id);
                  const stackOffset = (playersOnTile.length - 1) / 2 - stackIndex;
                  return (
                    <View
                      key={player.id}
                      style={[
                        styles.playerTokenWrapper,
                        {
                          left: x + (cellSize - markerSize) / 2 + stackOffset * markerSize * 0.5,
                          top: y + (cellSize - markerSize) / 2,
                          width: markerSize,
                          height: markerSize,
                          zIndex: stackIndex + 1,
                          elevation: 5 + stackIndex,
                        },
                      ]}
                    >
                      <Image source={getCharacterAssetForColor(player.color)} style={styles.playerToken} />
                    </View>
                  );
                })}
              </Animated.View>
            </Animated.View>
          </View>

          <View style={styles.diceSection}>
            <View style={styles.diceSide} />
            <View style={styles.diceCenter}>
              <ImageBackground
                source={getWoodframeSource(params.level, '4to1')}
                resizeMode="stretch"
                {...({ pointerEvents: 'none' } as any)}
                style={[styles.diceWoodframe, { width: diceSize * 5.6, height: diceSize * 1.4 }]}
              />
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
            <View style={[styles.diceSide, styles.diceActionSide]}>
              <TouchableOpacity
                style={[
                  styles.debugMoveButton,
                  isDebugMoveBlocked && styles.debugMoveButtonDisabled,
                  styles.debugMoveButtonHidden,
                ]}
                onPress={openDebugMoveModal}
                disabled={isDebugMoveBlocked}
                activeOpacity={0.75}
              >
                <Text style={styles.debugMoveButtonText}>DEBUG</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={[styles.bottomBarContainer, { height: Math.min(95, screenHeight * 0.13) }]}>
          {players.map((player, index) => {
            const isActive = index === turnIndex;
            return (
              <View
                key={player.id}
                style={[
                  styles.bottomIndicator,
                  { backgroundColor: player.color },
                  isActive
                    ? [styles.indicatorActive, { height: Math.min(95, screenHeight * 0.13) + insets.bottom }]
                    : [styles.indicatorInactive, { height: Math.min(25, screenHeight * 0.04) + insets.bottom }],
                  { transform: [{ translateY: insets.bottom }] },
                ]}
              />
            );
          })}
        </View>

        <Modal
          visible={rouletteModalVisible}
          transparent
          animationType="fade"
          presentationStyle="overFullScreen"
          statusBarTranslucent
          navigationBarTranslucent
        >
          <View style={styles.modalOverlayContainer}>
            <View style={styles.rouletteCard}>
              <Text style={styles.rouletteTitle}>🎁 Power-Up Acquired!</Text>
              <Image source={POWER_UP_IMAGES[rouletteDisplayItem]} style={styles.rouletteImage} resizeMode="contain" />
              <Text style={styles.rouletteSubtitle}>Spinning...</Text>
            </View>
          </View>
        </Modal>

        <Modal
          visible={debugMoveModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setDebugMoveModalVisible(false)}
        >
          <View style={styles.modalOverlayContainer}>
            <View style={styles.debugMoveCard}>
              <Text style={styles.debugMoveTitle}>Debug</Text>
              <View style={styles.debugPlayerChoices}>
                {players.map((player) => {
                  const isSelected = player.id === debugPlayerId;
                  return (
                    <TouchableOpacity
                      key={player.id}
                      style={[
                        styles.debugPlayerChoice,
                        { borderColor: player.color },
                        isSelected && { backgroundColor: player.color },
                      ]}
                      onPress={() => setDebugPlayerId(player.id)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.debugPlayerChoiceText, isSelected && styles.debugPlayerChoiceTextSelected]}>
                        {player.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={styles.debugMoveLabel}>
                Give a Power-up to {players.find((player) => player.id === debugPlayerId)?.name ?? 'selected player'}
              </Text>
              <View style={styles.debugPowerUpChoices}>
                {POWER_UP_TYPES.map((powerUpType) => {
                  const count = players
                    .find((player) => player.id === debugPlayerId)
                    ?.powerUps.filter((item) => item === powerUpType).length ?? 0;
                  return (
                    <TouchableOpacity
                      key={powerUpType}
                      style={styles.debugPowerUpChoice}
                      onPress={() => giveDebugPowerUp(powerUpType)}
                      activeOpacity={0.75}
                    >
                      <Image source={POWER_UP_IMAGES[powerUpType]} style={styles.debugPowerUpIcon} resizeMode="contain" />
                      <Text style={styles.debugPowerUpChoiceText}>
                        Give {POWER_UP_LABELS[powerUpType]} ({count})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={styles.debugMoveLabel}>Destination tile (1–100)</Text>
              <TextInput
                style={styles.debugMoveInput}
                value={debugTile}
                onChangeText={(value) => setDebugTile(value.replace(/\D/g, '').slice(0, 3))}
                keyboardType="number-pad"
                maxLength={3}
                selectTextOnFocus
              />
              <View style={styles.exitActions}>
                <TouchableOpacity
                  style={[styles.exitBtn, styles.debugMoveConfirm, !isDebugMoveValid && styles.debugMoveConfirmDisabled]}
                  onPress={applyDebugMove}
                  disabled={!isDebugMoveValid}
                  activeOpacity={0.75}
                >
                  <Text style={styles.exitBtnText}>MOVE</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.exitBtn}
                  onPress={() => setDebugMoveModalVisible(false)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.exitBtnText}>CANCEL</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

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
              <View style={[styles.quizPopupGroup, { width: quizPopupWidth }]}>
                <View style={styles.quizSceneStage}>
                  <ImageBackground
                    source={getBookcaseSource(params.level)}
                    style={styles.quizSceneCard}
                    imageStyle={styles.quizSceneBackgroundImage}
                    resizeMode="cover"
                  >
                    <View pointerEvents="none" style={styles.quizSceneForeground}>
                      <View style={styles.quizDialogueBox}>
                        <Text style={styles.quizDialogueText} numberOfLines={DIALOGUE_MAX_LINES} ellipsizeMode="tail">
                          {typedDialogue}
                        </Text>
                      </View>
                    </View>
                  </ImageBackground>
                  <View pointerEvents="none" style={styles.quizCharacterWrapper}>
                    <Image
                      source={dialogueImage}
                      style={styles.quizCharacterImage}
                      resizeMode="contain"
                    />
                  </View>
                </View>

                {!isInfiniteTimer && (
                  <Text style={[styles.timerDisplay, isTimerLow && styles.timerDisplayLow]}>
                    Timer: {String(Math.floor(challengeSeconds / 60)).padStart(2, '0')}:
                    {String(challengeSeconds % 60).padStart(2, '0')}
                  </Text>
                )}

                <ImageBackground
                  source={getWoodframeSource(params.level, '3to4')}
                  resizeMode="stretch"
                  style={[styles.quizCard, { width: quizPopupWidth, height: quizFrameHeight }]}
                >
                  <ScrollView
                    style={styles.quizQuestionScroll}
                    contentContainerStyle={styles.quizQuestionContent}
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled
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
                  </ScrollView>

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
                </ImageBackground>

              </View>
            </ScrollView>
          </View>
        </Modal>

      </SafeAreaView>

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
  mainContainer: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'space-evenly', paddingVertical: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, zIndex: 20 },
  exitButton: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center', zIndex: 30 },
  exitButtonImage: { width: 44, height: 30, transform: [{ scale: 1.2 }] },
  turnBanner: { flex: 1, aspectRatio: 6, paddingVertical: 10, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 6 },
  turnText: { color: '#fff', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
  boardFrame: { ...BOARD_FRAME, overflow: 'hidden', alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  boardFrameBackground: { position: 'absolute' },
  boardImage: { position: 'absolute', width: '100%', height: '100%' },
  playerTokenWrapper: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  playerToken: { width: '100%', height: '100%', resizeMode: 'contain' },
  diceSection: { flexDirection: 'row', width: '100%', minHeight: 84, alignItems: 'center' },
  diceSide: { flex: 1 },
  diceCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  diceWoodframe: { position: 'absolute', aspectRatio: 4, alignSelf: 'center', zIndex: 0 },
  diceActionSide: { alignItems: 'flex-end' },
  debugMoveButton: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, backgroundColor: '#facc15', borderWidth: 1, borderColor: '#fff7b2', elevation: 5 },
  debugMoveButtonDisabled: { opacity: 0.45 },
  debugMoveButtonHidden: { opacity: 0 },
  debugMoveButtonText: { color: '#1b2338', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  diceButton: { minWidth: 72, minHeight: 72, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  bottomBarContainer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', width: '100%', paddingHorizontal: 12 },
  bottomIndicator: { flex: 1, marginHorizontal: 6, borderTopLeftRadius: 14, borderTopRightRadius: 14, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.4, shadowRadius: 4, elevation: 6 },
  indicatorActive: { height: 95, borderTopWidth: 4, borderTopColor: '#fff' },
  indicatorInactive: { height: 25, opacity: 0.7 },
  modalOverlayContainer: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.75)', justifyContent: 'center', alignItems: 'center' },
  rouletteCard: { width: 260, backgroundColor: '#1e293b', borderRadius: 20, padding: 20, alignItems: 'center', borderWidth: 3, borderColor: '#facc15' },
  rouletteTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 12 },
  rouletteImage: { width: 80, height: 80, marginBottom: 12 },
  rouletteSubtitle: { fontSize: 14, color: '#facc15', fontWeight: '700' },
  debugMoveCard: { width: '88%', maxWidth: 380, backgroundColor: '#1b2338', borderRadius: 16, padding: 22, alignItems: 'center', borderWidth: 2, borderColor: '#facc15', elevation: 12 },
  debugMoveTitle: { color: '#ffffff', fontSize: 22, fontWeight: '900', marginBottom: 6 },
  debugPlayerChoices: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, width: '100%', marginBottom: 18 },
  debugPlayerChoice: { minWidth: 84, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, borderWidth: 2, alignItems: 'center', backgroundColor: '#27334d' },
  debugPlayerChoiceText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  debugPlayerChoiceTextSelected: { color: '#111827' },
  debugPowerUpChoices: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, width: '100%', marginTop: -10, marginBottom: 14 },
  debugPowerUpChoice: { width: '48%', minHeight: 54, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#64748b', backgroundColor: '#27334d', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  debugPowerUpIcon: { width: 26, height: 26, flexShrink: 0 },
  debugPowerUpChoiceText: { flexShrink: 1, color: '#ffffff', fontSize: 12, fontWeight: '700', textAlign: 'center' },
  debugMoveLabel: { width: '100%', color: '#ffffff', fontSize: 14, fontWeight: '700', marginBottom: 20 },
  debugMoveInput: { width: '100%', height: 48, borderRadius: 8, borderWidth: 1, borderColor: '#64748b', backgroundColor: '#ffffff', color: '#111827', fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  debugMoveConfirm: { backgroundColor: '#facc15', borderColor: '#facc15' },
  debugMoveConfirmDisabled: { opacity: 0.45 },
  exitCard: { width: '88%', maxWidth: 380, backgroundColor: '#1b2338', borderRadius: 8, paddingVertical: 24, paddingHorizontal: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 12 },
  exitTitle: { fontSize: 22, fontWeight: 'bold', color: '#ffffff', marginBottom: 20, textAlign: 'center' },
  exitActions: { flexDirection: 'row', justifyContent: 'center', gap: 16, width: '100%' },
  exitBtn: { flex: 1, maxWidth: 130, backgroundColor: '#27334d', paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#3b4b6c', alignItems: 'center' },
  exitBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16, letterSpacing: 0.5 },
  popupImageContainer: { width: '88%', maxWidth: 340, aspectRatio: 340 / 260, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 28 },
  popupTextWrapper: { alignItems: 'center', gap: 8 },
  victorySubtitle: { fontSize: 18, color: '#fff', fontWeight: 'bold', textShadowColor: 'rgba(0,0,0,0.75)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  tapToContinueText: { color: '#facc15', fontWeight: 'bold', fontSize: 14, textShadowColor: 'rgba(0,0,0,0.75)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  quizPopupScrollView: { flex: 1, width: '100%' },
  quizPopupScrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 20 },
  quizPopupGroup: { width: '94%', maxWidth: 480, alignItems: 'center', gap: 10 },
  quizSceneStage: { position: 'relative', width: '100%', height: QUIZ_SCENE_HEIGHT, zIndex: 2, elevation: 2 },
  quizSceneCard: { width: '100%', height: QUIZ_SCENE_HEIGHT, borderRadius: 16, borderWidth: 2, borderColor: '#475569', overflow: 'hidden', zIndex: 0 },
  quizSceneBackgroundImage: { borderRadius: 16 },
  quizSceneForeground: { ...StyleSheet.absoluteFill, justifyContent: 'center', padding: 16, overflow: 'visible' },
  quizCharacterWrapper: { position: 'absolute', right: '4%', top: '-40%', width: '46%', aspectRatio: 1, zIndex: 3, elevation: 3 },
  quizCharacterImage: { width: '100%', height: '100%', transform: [{ scale: 1.5 }] },
  quizDialogueBox: { width: '45%', height: QUIZ_DIALOGUE_BOX_HEIGHT, justifyContent: 'center', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.24)', backgroundColor: 'rgba(15,23,42,0.86)', zIndex: 2 },
  quizDialogueText: { color: '#fff', fontSize: 14, lineHeight: DIALOGUE_LINE_HEIGHT, fontWeight: '600' },
  timerDisplayLow: { color: '#ef4444' },
  timerDisplay: { alignSelf: 'stretch', paddingHorizontal: 20, fontSize: 18, fontWeight: '900', color: '#facc15', textAlign: 'left', marginVertical: 4, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 },
  quizCard: { zIndex: 5, position: 'relative', overflow: 'visible' },
  quizQuestionScroll: { position: 'absolute', top: 0, right: 0, bottom: 106, left: 0 },
  quizQuestionContent: { paddingHorizontal: 84, paddingTop: 80, paddingBottom: 12 },
  quizHeader: { fontSize: 20, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 4 },
  quizSubheader: { fontSize: 13, color: '#cbd5e1', textAlign: 'center', marginBottom: 14 },
  quizPrompt: { fontSize: 15, color: '#f8fafc', textAlign: 'center', marginBottom: 16, fontWeight: '600' },
  hintBanner: { backgroundColor: '#334155', borderWidth: 1.5, borderColor: '#facc15', borderRadius: 10, padding: 10, marginBottom: 14 },
  hintBannerText: { color: '#fef08a', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  optionsGrid: { flexDirection: 'column', rowGap: 10 },
  optionButton: { width: '100%', backgroundColor: '#334155', paddingVertical: 14, paddingHorizontal: 8, borderRadius: 10, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  optionCorrect: { backgroundColor: '#166534', borderColor: '#22c55e' },
  optionSelected: { backgroundColor: '#475569', borderColor: '#facc15' },
  optionWrong: { backgroundColor: '#7f1d1d', borderColor: '#ef4444' },
  optionText: { color: '#fff', fontSize: 14, fontWeight: '600', textAlign: 'center' },
  resultBlock: { marginTop: 16, alignItems: 'center' },
  continueButton: { minHeight: 44, backgroundColor: '#facc15', paddingVertical: 10, paddingHorizontal: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  continueButtonDisabled: { opacity: 0.45 },
  answerCorrectButton: { backgroundColor: '#16a34a' },
  answerIncorrectButton: { backgroundColor: '#dc2626' },
  continueButtonText: { color: '#1e293b', fontWeight: 'bold', fontSize: 14 },
  answerResultButtonText: { color: '#fff' },
  powerUpsBar: { position: 'absolute', flexDirection: 'row', justifyContent: 'space-between', left: 64, right: 64, bottom: 70, gap: 8 },
  powerUpButton: { flex: 1, backgroundColor: 'transparent', paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  powerUpDisabled: { opacity: 0.4 },
  powerUpIcon: { width: 28, height: 28, marginBottom: 4 },
  powerUpCountText: { color: '#fff', fontSize: 12, fontWeight: '900' },
});
