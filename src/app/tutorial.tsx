import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Easing,
    Image,
    ImageBackground,
    Pressable,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWoodKnock } from '../audio/useWoodKnock';
import Text from '../components/AdaptiveText';
import BookcaseBackground from '../components/BookcaseBackground';
import Dice3D, { type Dice3DHandle } from '../components/Dice3D';
import { getWoodframeSource } from '../components/woodframes';

const NO_POINTER_EVENTS = { pointerEvents: 'none' } as any;

const SEEN_KEY = '@has_seen_game_tutorial';
const TYPE_MS = 18;
const PADDING = 16;
const CARD_RADIUS = 16;
const LAD_IMG = require('../../assets/images/LadDialogue.png');
const SNAKE_IMG = require('../../assets/images/AdderDialogue.png');
const BACK_IMG = require('../../assets/images/Backbutton.png');
const BOARD_IMG = require('../../assets/images/board.png');
const BOARD_NUMBERS_IMG = require('../../assets/images/boardnumbers.png');
const HINT_IMG = require('../../assets/images/hint.png');
const SKIP_IMG = require('../../assets/images/skip.png');
const ADD_TIME_IMG = require('../../assets/images/add-time.png');
const REFRESH_IMG = require('../../assets/images/refresh.png');
const LEVELS = ['reading', 'research', 'collections'] as const;
const SELECTED_LEVEL_FRAMES: Record<string, number> = {
  reading: require('../../assets/images/Languagewoodframe4to1selected.png'),
  research: require('../../assets/images/Sciencewoodframe4to1selected.png'),
  collections: require('../../assets/images/Historywoodframe4to1selected.png'),
};
const BOARD_BACKGROUNDS: Record<string, number> = {
  reading: require('../../assets/images/LanguageBoardBG.png'),
  research: require('../../assets/images/ScienceBoardBG.png'),
  collections: require('../../assets/images/HistoryBoardBG.png'),
};
const DIFFICULTIES = ['Easy', 'Normal', 'Hard'];
const TIMERS = [
  { label: 'Off', value: 0 },
  { label: '10s', value: 10 },
  { label: '15s', value: 15 },
  { label: '20s', value: 20 },
];
const PLAYER_OPTIONS = [
  { count: 1, label: '1 Player', subtitle: 'Solo Mode' },
  { count: 2, label: '2 Players', subtitle: 'Head to Head' },
  { count: 3, label: '3 Players', subtitle: 'Triple Threat' },
];
const COLOR_OPTIONS = [
  { id: 'blue', hex: '#4b7bec' },
  { id: 'red', hex: '#ff5252' },
  { id: 'green', hex: '#26de81' },
  { id: 'yellow', hex: '#fed330' },
];
const DEFAULT_COLORS = ['#16a34a', '#dc2626', '#2563eb'];
const DEFAULT_PLAYER_IMG = require('../../assets/images/Playergrey.png');
const PLAYER_IMG_BY_COLOR: Record<string, number> = {
  '#4b7bec': require('../../assets/images/Playerblue.png'),
  '#ff5252': require('../../assets/images/Playerred.png'),
  '#26de81': require('../../assets/images/Playergreen.png'),
  '#fed330': require('../../assets/images/Playeryellow.png'),
};

const getTokenImage = (color: string): number => {
  switch (color) {
    case '#dc2626':
    case '#ff5252':
      return require('../../assets/images/Playerred.png');
    case '#16a34a':
    case '#26de81':
      return require('../../assets/images/Playergreen.png');
    case '#fed330':
      return require('../../assets/images/Playeryellow.png');
    default:
      return require('../../assets/images/Playerblue.png');
  }
};
const POWER_UPS = [
  { id: 'hint', label: 'Hint', img: HINT_IMG },
  { id: 'skip', label: 'Skip', img: SKIP_IMG },
  { id: 'add-time', label: 'Add Time', img: ADD_TIME_IMG },
  { id: 'refresh', label: 'Refresh', img: REFRESH_IMG },
];
type Speaker = 'LAD' | 'SNAKE';
type SlideKind =
  | 'intro'
  | 'map'
  | 'difficulty'
  | 'timer'
  | 'players'
  | 'customize'
  | 'board'
  | 'quiz'
  | 'powerups'
  | 'outro';
interface QuizSpec {
  type: 'ladder' | 'snake';
  subheader: string;
  prompt: string;
  options: string[];
  correctIndex: number;
}
interface BoardSpec {
  from: number;
  to?: number;
  toAlt?: number;
  dice?: number;
  auto?: boolean;
}
interface Slide {
  id: string;
  title: string;
  kind: SlideKind;
  speaker: Speaker;
  text: string;
  prompt?: string;
  afterText?: string;
  afterWrong?: string;
  altText?: string;
  board?: BoardSpec;
  quiz?: QuizSpec;
}
const LADDER_QUIZ: QuizSpec = {
  type: 'ladder',
  subheader: 'Answer right to climb from 2 to 23.',
  prompt: 'What was the name of the tragic ship that struck an iceberg and sank on its maiden voyage in 1912?',
  options: ['Britannic', 'Titanic', 'Olympic', 'Lusitania'],
  correctIndex: 1,
};
const SNAKE_QUIZ: QuizSpec = {
  type: 'snake',
  subheader: 'Answer right to stay safe from the snake at 29.',
  prompt: 'Which planet is known as the Red Planet?',
  options: ['Mercury', 'Venus', 'Jupiter', 'Mars'],
  correctIndex: 3,
};
const SLIDES: Slide[] = [
  { id: 'lad-hello', title: 'WELCOME', kind: 'intro', speaker: 'LAD', text: "Yo, I'm Lad! Anybody home?" },
  { id: 'snake-library', title: 'WELCOME', kind: 'intro', speaker: 'SNAKE', text: "What are ya'll doing in my library?!~" },
  { id: 'lad-knowledge', title: 'WELCOME', kind: 'intro', speaker: 'LAD', text: "We're here looking for knowledge!" },
  { id: 'lad-teach', title: 'WELCOME', kind: 'intro', speaker: 'LAD', text: 'Will you teach us Mr. Snake?' },
  { id: 'snake-well', title: 'WELCOME', kind: 'intro', speaker: 'SNAKE', text: "Very well. You've come to the right place." },
  { id: 'snake-ready', title: 'WELCOME', kind: 'intro', speaker: 'SNAKE', text: 'GET READY FOR BRAIN LADDER!' },
  
  {
    id: 'map', title: 'SELECT LEVEL', kind: 'map', speaker: 'SNAKE',
    text: 'First off, choose the map you want to learn. Be warned, each map has different topics you must face!',
    prompt: 'Tap a map to pick it',
  },
  {
    id: 'difficulty', title: 'SELECT LEVEL', kind: 'difficulty', speaker: 'SNAKE',
    text: 'Now choose how difficult you want it to be. Are you looking for a challenge?',
    prompt: 'Use the arrows to change the difficulty',
  },
  {
    id: 'timer', title: 'SELECT LEVEL', kind: 'timer', speaker: 'SNAKE',
    text: 'Good! Now choose how long you have for each question.',
    prompt: 'Tap a timer',
  },
  {
    id: 'players', title: 'NUMBER OF PLAYERS', kind: 'players', speaker: 'SNAKE',
    text: 'Choose how many players are going to play. How many of you are there?',
    prompt: 'Tap how many are playing',
  },
  {
    id: 'customize', title: 'CUSTOMIZE PLAYERS', kind: 'customize', speaker: 'SNAKE',
    text: "Great! Now let's dress you up. Choose a color for each player.",
    afterText: "Looking sharp! Choose the colors ya'll want, then let's get started!",
    prompt: 'Tap a color for each player',
  },
  
  { id: 'board-welcome', title: 'THE BOARD', kind: 'board', speaker: 'SNAKE', text: 'Welcome to Brain Ladder!', board: { from: 1 } },
  { id: 'board-twist', title: 'THE BOARD', kind: 'board', speaker: 'SNAKE', text: 'A game of snakes and ladders but with a twist!', board: { from: 1 } },
  {
    id: 'roll-1', title: 'ROLL THE DICE', kind: 'board', speaker: 'SNAKE',
    text: "Let's start with rolling the dice! Just tap the dice.",
    afterText: 'OH! You landed on a ladder tile. Get ready for a question!',
    prompt: 'Tap the dice',
    board: { from: 1, to: 2, dice: 1 },
  },
  {
    id: 'ladder-explain', title: 'LADDER TILES', kind: 'board', speaker: 'SNAKE',
    text: 'Whenever you land on a ladder tile, you will be faced with a question.',
    board: { from: 2 },
  },
  {
    id: 'ladder-quiz', title: 'LADDER CHALLENGE', kind: 'quiz', speaker: 'SNAKE',
    text: 'If you answer correctly, you will be able to go up the ladder. Answering wrong means staying at the same spot.',
    afterText: "You got it! It's Titanic. Next one's on you, though!",
    afterWrong: "Not quite, it was Titanic. For now I'll help you, but next one's on you!",
    prompt: 'Tap an answer',
    quiz: LADDER_QUIZ,
  },
  {
    id: 'ladder-up', title: 'LADDER TILES', kind: 'board', speaker: 'SNAKE',
    text: 'Up the ladder you go, from tile 2 all the way to tile 23!',
    board: { from: 2, to: 23, auto: true },
  },
  {
    id: 'roll-2', title: 'ROLL THE DICE', kind: 'board', speaker: 'SNAKE',
    text: "Let's roll the dice again!",
    afterText: 'Oh wow! You landed on a power up tile!',
    prompt: 'Tap the dice',
    board: { from: 23, to: 26, dice: 3 },
  },
  {
    id: 'powerups', title: 'POWER-UPS', kind: 'powerups', speaker: 'SNAKE',
    text: 'Power ups give you advantages when answering. Use them during a question!',
    prompt: 'Tap a power up to see what it does',
  },
  {
    id: 'roll-3', title: 'ROLL THE DICE', kind: 'board', speaker: 'SNAKE',
    text: "Let's roll the dice one more time!",
    afterText: 'Unlucky. You landed on a snake tile. Prepare to answer another question.',
    prompt: 'Tap the dice',
    board: { from: 26, to: 29, dice: 3 },
  },
  {
    id: 'snake-quiz', title: 'SNAKE CHALLENGE', kind: 'quiz', speaker: 'SNAKE',
    text: "On snake tiles, if you answer correctly you'll move forward 1 tile. However, answering wrong leads you to the tail of the snake.",
    afterText: 'Correct! Let\'s see what that does for you.',
    afterWrong: 'Wrong! Uh oh, let\'s see where that takes you.',
    prompt: 'Tap an answer',
    quiz: SNAKE_QUIZ,
  },
  {
    id: 'snake-result', title: 'SNAKE TILES', kind: 'board', speaker: 'SNAKE',
    text: "Ouch! Wrong answers send you to the tail of the snake, all the way down to tile 9.",
    altText: 'Nice! Correct answers move you forward 1 tile, up to tile 30.',
    board: { from: 29, to: 9, toAlt: 30, auto: true },
  },
  {
    id: 'outro', title: "LET'S PLAY!", kind: 'outro', speaker: 'SNAKE',
    text: "That's all there is to it! Be the first to reach tile 100 to win. Good luck!",
    board: { from: 1 },
  },
];

const MAP_REACT: Record<string, string> = {
  reading: 'Language! Words are weapons, kid. Press next whenever you are ready.',
  research: 'Science! Time to get those brain cells fizzing. Press next whenever you are ready.',
  collections: 'History! Hope you remember your dates. Press next whenever you are ready.',
};
const DIFF_REACT = [
  'Easy? Fine, a gentle warm-up for those brain cells.',
  'Normal. A sensible choice, nothing wrong with that.',
  'Hard?! Now THAT is a challenge. I like it!',
];
const TIMER_REACT: Record<string, string> = {
  '0': 'No timer? Take all the time you like.',
  '10': '10 seconds! Think fast!',
  '15': '15 seconds. A fair squeeze.',
  '20': 'Tick-tock. 20 seconds, so choose your answers wisely.',
};
const PLAYER_REACT: Record<string, string> = {
  '1': 'Going solo, eh? Brave.',
  '2': 'Head to head! May the smartest one win.',
  '3': 'Triple threat! Things are about to get lively.',
};
const POWER_REACT: Record<string, string> = {
  hint: 'Hint: reveals a clue for the question you are facing.',
  skip: 'Skip: answers the question correctly for you.',
  'add-time': 'Add Time: gives you 20 extra seconds on the clock.',
  refresh: 'Refresh: swaps your question for a brand new one.',
};
const getSlideText = (slide: Slide, key: string | undefined, snakeCorrect: boolean): string => {
  if (slide.id === 'snake-result') return snakeCorrect ? slide.altText ?? slide.text : slide.text;
  if (key === undefined) return slide.text;
  switch (slide.kind) {
    case 'map':
      return MAP_REACT[key] ?? slide.text;
    case 'difficulty':
      return DIFF_REACT[Number(key)] ?? slide.text;
    case 'timer':
      return TIMER_REACT[key] ?? slide.text;
    case 'players':
      return PLAYER_REACT[key] ?? slide.text;
    case 'powerups':
      return POWER_REACT[key] ?? slide.text;
    case 'quiz': {
      const right = Number(key) === slide.quiz?.correctIndex;
      return (right ? slide.afterText : slide.afterWrong ?? slide.afterText) ?? slide.text;
    }
    default:
      return slide.afterText ?? slide.text;
  }
};
const tileXY = (pos: number, cell: number) => {
  const zeroBased = pos - 1;
  const row = Math.floor(zeroBased / 10);
  let col = zeroBased % 10;
  if (row % 2 === 1) col = 9 - col;
  return { x: col * cell, y: (9 - row) * cell };
};
const Token: React.FC<{
  tile: number;
  cell: number;
  color: string;
  index: number;
  total: number;
}> = ({ tile, cell, color, index, total }) => {
  const marker = cell * 0.9;
  const xy = useRef(new Animated.ValueXY(tileXY(tile, cell))).current;
  useEffect(() => {
    const move = Animated.timing(xy, {
      toValue: tileXY(tile, cell),
      duration: 700,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    });
    move.start();
    return () => move.stop();
  }, [tile, cell, xy]);
  const spread = (index - (total - 1) / 2) * marker * 0.35;
  return (
    <Animated.View
      style={[
        styles.token,
        {
          left: xy.x,
          top: xy.y,
          marginLeft: cell * 0.05 + spread,
          marginTop: cell * 0.05,
          width: marker,
          height: marker,
          borderRadius: marker / 2,
          backgroundColor: color,
          zIndex: index + 1,
        },
      ]}
    >
      <Image source={getTokenImage(color)} style={styles.tokenImage} />
    </Animated.View>
  );
};
const MockBoard: React.FC<{
  pos: number;
  level: string | null;
  colors: string[];
  count: number;
  size: number;
}> = ({ pos, level, colors, count, size }) => {
  const frame = size / 0.82;
  const cell = size / 10;
  const inset = (frame - size) / 2;
  const background = BOARD_BACKGROUNDS[level ?? 'collections'] ?? BOARD_BACKGROUNDS.collections;
  const active = colors.slice(0, count);
  return (
    <View style={[styles.boardFrame, { width: frame, height: frame }]}>
      <Image
        source={background}
        resizeMode="cover"
        style={[styles.boardLayer, { transform: [{ scale: 1.5 }] }]}
      />
      <View style={{ position: 'absolute', left: inset, top: inset, width: size, height: size }}>
        <Image
          source={BOARD_IMG}
          resizeMode="cover"
          style={[styles.boardLayer, { transform: [{ scale: 1.18 }] }]}
        />
        <Image
          source={BOARD_NUMBERS_IMG}
          resizeMode="cover"
          style={[styles.boardLayer, { transform: [{ scale: 1.18 }] }]}
        />
        {active.map((color, index) => (
          <Token
            key={index}
            tile={index === 0 ? pos : 1}
            cell={cell}
            color={color}
            index={index}
            total={active.length}
          />
        ))}
      </View>
    </View>
  );
};
const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};
const Die: React.FC<{
  value: number | null;
  size: number;
  disabled: boolean;
  onRoll: () => void;
}> = ({ value, size, disabled, onRoll }) => {
  const spin = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const rolling = useRef(false);
  const alive = useRef(true);
  useEffect(() => () => {
    alive.current = false;
  }, []);
  useEffect(() => {
    if (disabled) return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [disabled, glow]);
  const press = () => {
    if (disabled || rolling.current) return;
    rolling.current = true;
    spin.setValue(0);
    Animated.timing(spin, {
      toValue: 1,
      duration: 650,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      rolling.current = false;
      if (alive.current) onRoll();
    });
  };
  const pips = value !== null ? PIPS[value] ?? [] : [];
  const pipSize = size * 0.17;
  return (
    <Pressable onPress={press} disabled={disabled} hitSlop={12}>
      <Animated.View
        style={[
          styles.die,
          {
            width: size,
            height: size,
            borderRadius: size * 0.2,
            transform: [
              { rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '720deg'] }) },
              { scale: glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) },
            ],
          },
        ]}
      >
        {value === null ? (
          <Text style={[styles.dieQuestion, { fontSize: size * 0.5 }]}>?</Text>
        ) : (
          <View style={styles.pipGrid}>
            {Array.from({ length: 9 }, (_, cellIndex) => (
              <View key={cellIndex} style={styles.pipCell}>
                {pips.includes(cellIndex) && (
                  <View style={{ width: pipSize, height: pipSize, borderRadius: pipSize / 2, backgroundColor: '#111827' }} />
                )}
              </View>
            ))}
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
};
const QuizCard: React.FC<{
  quiz: QuizSpec;
  pick: number | undefined;
  onPick: (index: number) => void;
}> = ({ quiz, pick, onPick }) => {
  const answered = pick !== undefined;
  return (
    <View style={styles.quizCard}>
      <Text style={styles.quizHeader}>{quiz.type === 'ladder' ? '🪜 Ladder Challenge!' : '🐍 Snake Challenge!'}</Text>
      <Text style={styles.quizSubheader}>{quiz.subheader}</Text>
      <Text style={styles.quizPrompt}>{quiz.prompt}</Text>
      <View style={styles.optionsGrid}>
        {quiz.options.map((option, index) => {
          const isPick = pick === index;
          const isRight = quiz.correctIndex === index;
          let stateStyle = {};
          if (answered) {
            if (isRight) stateStyle = styles.optionCorrect;
            else if (isPick) stateStyle = styles.optionWrong;
          }
          return (
            <TouchableOpacity
              key={option}
              style={[styles.optionButton, stateStyle]}
              onPress={() => onPick(index)}
              disabled={answered}
              activeOpacity={0.8}
            >
              <Text style={styles.optionText}>{option}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};
const DialogueBox: React.FC<{ speaker: Speaker; text: string }> = ({ speaker, text }) => {
  const pop = useRef(new Animated.Value(0.4)).current;
  const [typed, setTyped] = useState({ text: '', count: 0 });
  const count = typed.text === text ? typed.count : 0;
  const isLad = speaker === 'LAD';
  useEffect(() => {
    Animated.spring(pop, { toValue: 1, friction: 4, tension: 150, useNativeDriver: true }).start();
  }, [pop]);
  useEffect(() => {
    if (!text) return undefined;
    let n = 0;
    const timer = setInterval(() => {
      n += 1;
      setTyped((prev) => (prev.text === text && prev.count >= n ? prev : { text, count: n }));
      if (n >= text.length) clearInterval(timer);
    }, TYPE_MS);
    return () => clearInterval(timer);
  }, [text]);
  return (
    <View style={styles.dialogueWrap}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{isLad ? 'LAD' : 'SNAKE'}</Text>
      </View>
      {}
      <Pressable style={styles.card} onPress={() => setTyped({ text, count: text.length })}>
        <Text style={styles.cardText}>
          {text.slice(0, count)}
          <Text style={styles.hiddenText}>{text.slice(count)}</Text>
        </Text>
      </Pressable>
      <View pointerEvents="none" style={styles.avatar}>
        <Animated.Image
          source={isLad ? LAD_IMG : SNAKE_IMG}
          resizeMode="contain"
          style={{ width: '100%', height: '100%', transform: [{ scale: pop }] }}
        />
      </View>
    </View>
  );
};
export default function TutorialScreen() {
  const router = useRouter();
  const playKnock = useWoodKnock();
  const { width, height } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [level, setLevel] = useState<string | null>(null);
  const [difficultyIndex, setDifficultyIndex] = useState(1);
  const [timer, setTimer] = useState(15);
  const [playerCount, setPlayerCount] = useState(2);
  const [colors, setColors] = useState<string[]>(DEFAULT_COLORS);
  const [choice, setChoice] = useState<Record<string, string>>({});
  const [autoDone, setAutoDone] = useState<string | null>(null);
  const finishing = useRef(false);
  
  const diceRef = useRef<Dice3DHandle>(null);
  const [diceReady, setDiceReady] = useState(false);
  const [diceRolling, setDiceRolling] = useState(false);
  const [diceFailed, setDiceFailed] = useState(false); 
  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;
  const key = choice[slide.id];
  const snakeCorrect = choice['snake-quiz'] !== undefined && Number(choice['snake-quiz']) === SNAKE_QUIZ.correctIndex;
  const text = getSlideText(slide, key, snakeCorrect);
  const levelArg = level ?? undefined;
  const frame4 = getWoodframeSource(levelArg, '4to1');
  const frame6 = getWoodframeSource(levelArg, '6to1');
  const remember = (value: string) => setChoice((prev) => ({ ...prev, [slide.id]: value }));
  useEffect(() => {
    setDiceReady(false);
    setDiceRolling(false);
  }, [slide.id]);
  
  useEffect(() => {
    if (slide.kind !== 'board' || !slide.board?.auto) return undefined;
    const timeout = setTimeout(() => setAutoDone(slide.id), 500);
    return () => clearTimeout(timeout);
  }, [slide]);
  const finish = async () => {
    if (finishing.current) return;
    finishing.current = true;
    try {
      await AsyncStorage.setItem(SEEN_KEY, 'true');
    } catch (e) {
    }
    router.replace('/level-select');
  };
  const goNext = () => {
    if (isLast) void finish();
    else setIndex((i) => Math.min(i + 1, SLIDES.length - 1));
  };
  const goBack = () => {
    if (index === 0) router.back();
    else setIndex((i) => Math.max(i - 1, 0));
  };
  
  const stageWidth = Math.min(width, 420) - PADDING * 2;
  const boardSize = Math.min(stageWidth * 0.82, Math.max(200, height * 0.3), 320);
  const diceSize = Math.min(84, boardSize * 0.37);
  const renderStage = () => {
    switch (slide.kind) {
      case 'intro':
        return (
          <View style={styles.introRow}>
            <Image
              source={LAD_IMG}
              resizeMode="contain"
              style={[styles.introChar, slide.speaker !== 'LAD' && styles.introCharDim]}
            />
            <Image
              source={SNAKE_IMG}
              resizeMode="contain"
              style={[styles.introChar, slide.speaker !== 'SNAKE' && styles.introCharDim]}
            />
          </View>
        );
      case 'map':
        return (
          <View style={styles.stack}>
            {LEVELS.map((id) => (
              <TouchableOpacity
                key={id}
                activeOpacity={0.85}
                style={[styles.levelCard, level !== id && styles.unselected]}
                onPress={() => {
                  playKnock();
                  setLevel(id);
                  remember(id);
                }}
              >
                <ImageBackground source={SELECTED_LEVEL_FRAMES[id]} resizeMode="stretch" style={styles.fill} />
              </TouchableOpacity>
            ))}
          </View>
        );
      case 'difficulty':
        return (
          <ImageBackground source={frame4} resizeMode="stretch" style={styles.banner}>
            <Text style={styles.bannerLabel}>DIFFICULTY</Text>
            <View style={styles.difficultyControls}>
              <TouchableOpacity
                style={styles.arrowButton}
                onPress={() => {
                  const next = difficultyIndex > 0 ? difficultyIndex - 1 : DIFFICULTIES.length - 1;
                  setDifficultyIndex(next);
                  remember(String(next));
                }}
              >
                <Text style={styles.arrowText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.difficultyText}>{DIFFICULTIES[difficultyIndex]}</Text>
              <TouchableOpacity
                style={styles.arrowButton}
                onPress={() => {
                  const next = difficultyIndex < DIFFICULTIES.length - 1 ? difficultyIndex + 1 : 0;
                  setDifficultyIndex(next);
                  remember(String(next));
                }}
              >
                <Text style={styles.arrowText}>›</Text>
              </TouchableOpacity>
            </View>
          </ImageBackground>
        );
      case 'timer':
        return (
          <ImageBackground source={frame4} resizeMode="stretch" style={[styles.banner, { gap: 12 }]}>
            <Text style={styles.bannerLabel}>QUESTION TIMER</Text>
            <View style={styles.timerGrid}>
              {TIMERS.map((t) => {
                const selected = timer === t.value;
                return (
                  <TouchableOpacity
                    key={t.value}
                    activeOpacity={0.8}
                    style={[styles.timerChip, selected && styles.timerChipSelected]}
                    onPress={() => {
                      setTimer(t.value);
                      remember(String(t.value));
                    }}
                  >
                    <Text style={[styles.timerChipText, selected && styles.timerChipTextSelected]}>{t.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ImageBackground>
        );
      case 'players':
        return (
          <View style={styles.stack}>
            {PLAYER_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.count}
                activeOpacity={0.85}
                style={[styles.playerOption, playerCount !== option.count && styles.unselected]}
                onPress={() => {
                  playKnock();
                  setPlayerCount(option.count);
                  remember(String(option.count));
                }}
              >
                <ImageBackground source={frame4} resizeMode="stretch" style={styles.playerOptionBg}>
                  <Text style={styles.playerOptionLabel}>{option.label}</Text>
                  <Text style={styles.playerOptionSubtitle}>{option.subtitle}</Text>
                </ImageBackground>
              </TouchableOpacity>
            ))}
          </View>
        );
      case 'customize':
        return (
          <View style={styles.stack}>
            {colors.slice(0, playerCount).map((color, playerIndex) => (
              <ImageBackground key={playerIndex} source={frame4} resizeMode="stretch" style={styles.customizeCard}>
                <View style={styles.customizeRow}>
                  <View style={styles.previewBox}>
                    <Image
                      source={PLAYER_IMG_BY_COLOR[color] ?? DEFAULT_PLAYER_IMG}
                      style={styles.fill}
                      resizeMode="contain"
                    />
                  </View>
                  <View style={styles.customizeControls}>
                    <Text style={styles.playerName}>{`Player ${playerIndex + 1}`}</Text>
                    <View style={styles.swatchRow}>
                      {COLOR_OPTIONS.map((c) => (
                        <TouchableOpacity
                          key={c.id}
                          activeOpacity={0.8}
                          style={[
                            styles.swatch,
                            { backgroundColor: c.hex },
                            color === c.hex && styles.swatchSelected,
                          ]}
                          onPress={() => {
                            playKnock();
                            setColors((prev) => prev.map((p, i) => (i === playerIndex ? c.hex : p)));
                            remember(c.hex);
                          }}
                        />
                      ))}
                    </View>
                  </View>
                </View>
              </ImageBackground>
            ))}
          </View>
        );
      case 'board':
      case 'outro': {
        const spec = slide.board ?? { from: 1 };
        const rolled = key === 'rolled';
        const moved = spec.to !== undefined && (spec.auto ? autoDone === slide.id : rolled);
        const destination = snakeCorrect && spec.toAlt !== undefined ? spec.toAlt : spec.to;
        const pos = moved && destination !== undefined ? destination : spec.from;
        return (
          <View style={styles.boardStage}>
            <MockBoard pos={pos} level={level} colors={colors} count={playerCount} size={boardSize} />
            {spec.dice !== undefined && (
              <View style={[styles.diceDock, { height: diceSize + 12 }]}>
                <ImageBackground
                  source={frame4}
                  resizeMode="stretch"
                  {...NO_POINTER_EVENTS}
                  style={styles.diceWoodframe}
                />
                {diceFailed ? (
                  <Die
                    value={rolled ? spec.dice : null}
                    size={64}
                    disabled={rolled}
                    onRoll={() => {
                      playKnock();
                      remember('rolled');
                    }}
                  />
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    disabled={!diceReady || diceRolling || rolled}
                    onPress={() => {
                      if (diceRef.current?.roll(spec.dice as number)) setDiceRolling(true);
                    }}
                  >
                    <Dice3D
                      key={slide.id}
                      ref={diceRef}
                      size={diceSize}
                      onReady={() => {
                        setDiceReady(true);
                        if (rolled) diceRef.current?.roll(spec.dice as number);
                      }}
                      onRollComplete={() => {
                        setDiceRolling(false);
                        if (!rolled) {
                          playKnock();
                          remember('rolled');
                        }
                      }}
                      onError={() => setDiceFailed(true)}
                    />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        );
      }
      case 'quiz':
        return slide.quiz ? (
          <QuizCard
            quiz={slide.quiz}
            pick={key === undefined ? undefined : Number(key)}
            onPick={(i) => {
              playKnock();
              remember(String(i));
            }}
          />
        ) : null;
      case 'powerups':
        return (
          <View style={styles.powerGrid}>
            {POWER_UPS.map((p) => (
              <TouchableOpacity
                key={p.id}
                activeOpacity={0.8}
                style={[styles.powerTile, key === p.id && styles.powerTileSelected]}
                onPress={() => {
                  playKnock();
                  remember(p.id);
                }}
              >
                <Image source={p.img} style={styles.powerIcon} resizeMode="contain" />
                <Text style={styles.powerLabel}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );
      default:
        return null;
    }
  };
  return (
    <BookcaseBackground level={levelArg}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backButton} onPress={goBack} activeOpacity={0.7}>
              <Image source={BACK_IMG} style={styles.backArrowImage} resizeMode="contain" />
            </TouchableOpacity>
            <ImageBackground source={frame6} resizeMode="stretch" style={styles.headerBanner}>
              <Text style={styles.headerTitle}>{slide.title}</Text>
            </ImageBackground>
          </View>
          <View style={styles.progressRow}>
            <Text style={styles.progressText}>
              {index + 1} / {SLIDES.length}
            </Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${((index + 1) / SLIDES.length) * 100}%` }]} />
            </View>
            {!isLast && (
              <TouchableOpacity onPress={() => void finish()} hitSlop={10}>
                <Text style={styles.skipText}>SKIP</Text>
              </TouchableOpacity>
            )}
          </View>
          <ScrollView
            style={styles.stageScroll}
            contentContainerStyle={styles.stageContent}
            showsVerticalScrollIndicator={false}
          >
            {renderStage()}
            {slide.prompt ? <Text style={styles.promptText}>{slide.prompt}</Text> : null}
          </ScrollView>
          <DialogueBox key={slide.id} speaker={slide.speaker} text={text} />
          <TouchableOpacity onPress={goNext} activeOpacity={0.9}>
            <ImageBackground source={frame6} resizeMode="stretch" style={styles.nextButton}>
              <Text style={styles.nextText}>{isLast ? "LET'S PLAY!" : 'NEXT'}</Text>
            </ImageBackground>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </BookcaseBackground>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, width: '100%' },
  content: { flex: 1, width: '100%', maxWidth: 420, alignSelf: 'center', padding: PADDING, gap: 10 },
  fill: { flex: 1, width: '100%', height: '100%' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backButton: { width: 48, height: 48, borderRadius: CARD_RADIUS, justifyContent: 'center', alignItems: 'center' },
  backArrowImage: { width: 44, height: 30, transform: [{ scale: 1.2 }] },
  headerBanner: { flex: 1, minHeight: 48, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#ffffff', fontSize: 18, fontWeight: '800', letterSpacing: 1.5, textAlign: 'center' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 4 },
  progressText: { color: '#FBF7F5', fontSize: 12, fontWeight: '800', minWidth: 44 },
  progressTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.45)', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#EAA842' },
  skipText: { color: '#FBF7F5', fontSize: 12, fontWeight: '800', letterSpacing: 1, textDecorationLine: 'underline' },
  stageScroll: { flex: 1 },
  stageContent: { flexGrow: 1, justifyContent: 'center', gap: 12, paddingVertical: 4 },
  stack: { gap: PADDING },
  promptText: { color: '#FBF7F5', fontSize: 13, fontWeight: '700', textAlign: 'center', letterSpacing: 0.5, textShadowColor: 'rgba(0,0,0,0.85)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  unselected: { opacity: 0.55 },
  introRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: 8 },
  introChar: { width: '46%', aspectRatio: 0.9 },
  introCharDim: { opacity: 0.4, transform: [{ scale: 0.9 }] },
  levelCard: { height: 96 },
  banner: { padding: PADDING, gap: 8 },
  bannerLabel: { color: '#FBF7F5', fontSize: 12, fontWeight: '600', letterSpacing: 1.5, textAlign: 'center' },
  difficultyControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  arrowButton: { minWidth: 44, minHeight: 44, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  arrowText: { color: '#ffffff', fontSize: 22 },
  difficultyText: { color: '#ffffff', fontSize: 20, fontWeight: '700' },
  timerGrid: { flexDirection: 'row', justifyContent: 'space-around', gap: 8 },
  timerChip: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: 'rgba(55, 58, 66, 0.92)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.12)', alignItems: 'center' },
  timerChipSelected: { backgroundColor: '#ffffff', borderColor: '#ffffff' },
  timerChipText: { color: '#FBF7F5', fontSize: 14, fontWeight: '700' },
  timerChipTextSelected: { color: '#0f121c' },
  playerOption: { minHeight: 96, paddingVertical: 6 },
  playerOptionBg: { flex: 1, minHeight: 84, paddingVertical: 8, justifyContent: 'center', alignItems: 'center', gap: 4 },
  playerOptionLabel: { color: '#ffffff', fontSize: 20, fontWeight: '800', letterSpacing: 1 },
  playerOptionSubtitle: { color: '#FBF7F5', fontSize: 13, fontWeight: '600' },
  customizeCard: { padding: PADDING, minHeight: 110, justifyContent: 'center' },
  customizeRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  previewBox: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  customizeControls: { flex: 1, gap: 8 },
  playerName: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  swatchRow: { flexDirection: 'row', gap: 10 },
  swatch: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: 'transparent' },
  swatchSelected: { borderColor: '#ffffff', transform: [{ scale: 1.15 }] },
  boardStage: { alignItems: 'center', gap: 12 },
  boardFrame: { borderWidth: 2, borderRadius: 10, borderColor: '#0f0f0fb9', backgroundColor: 'rgba(38, 38, 38, 0.69)', overflow: 'hidden' },
  boardLayer: { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' },
  token: { position: 'absolute', borderWidth: 2, borderColor: '#0f172a', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 3, elevation: 5 },
  tokenImage: { width: '82%', height: '82%', resizeMode: 'contain' },
  diceDock: { width: 260, height: 84, alignItems: 'center', justifyContent: 'center' },
  diceWoodframe: { position: 'absolute', width: '100%', height: '100%' },
  die: { backgroundColor: '#ffffff', borderWidth: 3, borderColor: '#1f2937', alignItems: 'center', justifyContent: 'center', elevation: 4 },
  dieQuestion: { color: '#111827', fontWeight: '900' },
  pipGrid: { width: '78%', height: '78%', flexDirection: 'row', flexWrap: 'wrap' },
  pipCell: { width: '33.33%', height: '33.33%', alignItems: 'center', justifyContent: 'center' },
  quizCard: { width: '100%', backgroundColor: '#1e293b', borderRadius: 16, padding: 16, borderWidth: 2, borderColor: '#475569', elevation: 10 },
  quizHeader: { fontSize: 20, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 4 },
  quizSubheader: { fontSize: 13, color: '#cbd5e1', textAlign: 'center', marginBottom: 12 },
  quizPrompt: { fontSize: 15, color: '#f8fafc', textAlign: 'center', marginBottom: 14, fontWeight: '600' },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  optionButton: { width: '48%', backgroundColor: '#334155', paddingVertical: 14, paddingHorizontal: 8, borderRadius: 10, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  optionCorrect: { backgroundColor: '#166534', borderColor: '#22c55e' },
  optionWrong: { backgroundColor: '#7f1d1d', borderColor: '#ef4444' },
  optionText: { color: '#fff', fontSize: 14, fontWeight: '600', textAlign: 'center' },
  powerGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  powerTile: { width: '48%', backgroundColor: '#c2410c', borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 2, borderColor: '#ea580c', gap: 6 },
  powerTileSelected: { borderColor: '#ffffff', backgroundColor: '#ea580c' },
  powerIcon: { width: 40, height: 40 },
  powerLabel: { color: '#fff', fontSize: 13, fontWeight: '900' },
  dialogueWrap: { position: 'relative', marginTop: 14 },
  badge: { position: 'absolute', top: -14, right: 18, zIndex: 5, backgroundColor: '#EAA842', borderColor: '#7a4b00', borderWidth: 2, paddingHorizontal: 16, paddingVertical: 2, borderRadius: 10 },
  badgeText: { color: '#3b2600', fontWeight: '900', fontSize: 13, letterSpacing: 1 },
  card: { width: '100%', backgroundColor: '#FFF', borderRadius: 24, paddingVertical: 16, paddingRight: 16, paddingLeft: 112, minHeight: 112, borderWidth: 3, borderColor: '#1f2937', justifyContent: 'center' },
  cardText: { fontSize: 16, fontWeight: '800', color: '#111827', lineHeight: 22 },
  hiddenText: { opacity: 0 },
  avatar: { position: 'absolute', left: -8, bottom: -6, width: 108, height: 120, zIndex: 6 },
  nextButton: { paddingVertical: 16, alignItems: 'center' },
  nextText: { color: '#ffffff', fontSize: 18, fontWeight: '800', letterSpacing: 1 },
});
