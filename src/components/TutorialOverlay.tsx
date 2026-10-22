import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    Animated,
    Easing,
    Pressable,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const LAD_IMG = require('../../assets/images/LadDialogue.png');
const SNAKE_IMG = require('../../assets/images/AdderDialogue.png');

export const TUTORIAL_ROLLS = [1, 3, 3];
export const TUTORIAL_POWER_TILE = 26;
export const TUTORIAL_QUESTION = {
  id: 'tutorial-titanic',
  prompt: 'What was the name of the tragic ship that struck an iceberg and sank on its maiden voyage in 1912?',
  options: ['Britannic', 'Titanic', 'Olympic', 'Lusitania'],
  correctIndex: 1,
};

/* -------------------------------------------------------------------------- */
/*  SCRIPT                                                                    */
/* -------------------------------------------------------------------------- */

export interface TutorialStep {
  id: string;
  /** Which screen this step is shown on: 'level-select' | 'player-select' | 'customize' | 'game' */
  scene: string;
  speaker?: 'LAD' | 'SNAKE';
  text?: string;
  /** big = large bottom dialogue box, mini = small box (this is the one that can have a NEXT button) */
  isMini?: boolean;
  /** Ids of <TutorialTarget>s that stay bright and get a glowing border. Everything else is dimmed AND blocked. */
  focus?: string[];
  /** true = the focused targets can really be pressed (selecting a map, a timer, ...). */
  interactive?: boolean;
  /**
   * tap   -> tap the dialogue box to go to the next dialogue
   * next  -> mini box with a NEXT button. NEXT only appears once `requires` is satisfied.
   * event -> moves on when the app calls tutorial.notify(event[, value]) (used for "press the real button" steps)
   */
  advance: 'tap' | 'next' | 'event';
  event?: string;
  eventValue?: string;
  /** NEXT stays hidden until tutorial.notify(requires.event[, requires.value]) happened during this step. */
  requires?: { event: string; value?: string };
  /** Mini boxes: 'top' (default) or 'above' the anchor target. */
  place?: 'top' | 'above';
  /** Target id used to position the dialogue (defaults to all focused targets). */
  anchor?: string;
  /** Fixed vertical position as a fraction of the screen height (used by the game steps). */
  y?: number;
  /** 0 - 1, how dark the dim is. Default 0.55 */
  dim?: number;
  /** Dialogue only, the rest of the screen stays touchable. */
  passive?: boolean;
  /** Nothing is drawn, but touches stay blocked (used while dice / animations are running). */
  hidden?: boolean;
}

const STEPS: TutorialStep[] = [
  /* ------------------------------ LEVEL SELECT ------------------------------ */
  { id: 'lad-hello', scene: 'level-select', speaker: 'LAD', advance: 'tap', text: "Yo, I'm Lad! Anybody home?" },
  { id: 'snake-library', scene: 'level-select', speaker: 'SNAKE', advance: 'tap', text: "What are ya'll doing in my library?!~" },
  { id: 'lad-knowledge', scene: 'level-select', speaker: 'LAD', advance: 'tap', text: "We're here looking for knowledge!" },
  { id: 'lad-teach', scene: 'level-select', speaker: 'LAD', advance: 'tap', text: 'Will you teach us Mr. Snake?' },
  { id: 'snake-well', scene: 'level-select', speaker: 'SNAKE', advance: 'tap', text: "Very well. You've come to the right place." },
  { id: 'snake-ready', scene: 'level-select', speaker: 'SNAKE', advance: 'tap', text: 'GET READY FOR BRAIN LADDER!' },

  { id: 'map-choose', scene: 'level-select', speaker: 'SNAKE', advance: 'tap', focus: ['map-card'], text: 'First off, choose the map you want to learn.' },
  { id: 'map-warn', scene: 'level-select', speaker: 'SNAKE', advance: 'tap', focus: ['map-card'], text: 'Be warned each map has different topics you must face!' },
  {
    id: 'map-prompt', scene: 'level-select', speaker: 'SNAKE', isMini: true, place: 'top', advance: 'next',
    focus: ['map-card'], interactive: true, requires: { event: 'map-selected' },
    text: "Where do ya'll want to go? Press next after you're done selecting!",
  },

  { id: 'diff-choose', scene: 'level-select', speaker: 'SNAKE', advance: 'tap', focus: ['difficulty'], text: 'Choose how difficult you want it to be.' },
  {
    id: 'diff-hard', scene: 'level-select', speaker: 'SNAKE', isMini: true, place: 'above', advance: 'next',
    focus: ['difficulty'], interactive: true, requires: { event: 'difficulty-changed', value: 'Hard' },
    text: 'Are you looking for a challenge? Choose hard',
  },

  { id: 'timer-choose', scene: 'level-select', speaker: 'SNAKE', advance: 'tap', focus: ['timer'], text: 'Good now choose how long you have for each question.' },
  {
    id: 'timer-tick', scene: 'level-select', speaker: 'SNAKE', isMini: true, place: 'above', advance: 'next',
    focus: ['timer'], interactive: true, requires: { event: 'timer-selected' },
    text: 'tick-tock. Choose your time wisely.',
  },

  {
    id: 'players-head', scene: 'level-select', speaker: 'SNAKE', isMini: true, place: 'above', advance: 'event', event: 'screen-next',
    focus: ['screen-next'], interactive: true, text: "Let's head to player selection!",
  },

  /* ----------------------------- PLAYER SELECTION ---------------------------- */
  { id: 'players-intro', scene: 'player-select', speaker: 'SNAKE', advance: 'tap', focus: ['player-card'], text: 'Choose how many players are going to play.' },
  {
    id: 'players-howmany', scene: 'player-select', speaker: 'SNAKE', isMini: true, place: 'top', advance: 'next',
    focus: ['player-card'], interactive: true, requires: { event: 'player-count-selected' },
    text: 'How many of you are there?',
  },
  {
    id: 'dress-up', scene: 'player-select', speaker: 'SNAKE', isMini: true, place: 'above', advance: 'event', event: 'screen-next',
    focus: ['screen-next'], interactive: true, text: "Great! Now let's dress you up!",
  },

  /* --------------------------- CUSTOMIZE CHARACTER --------------------------- */
  { id: 'colors-choose', scene: 'customize', speaker: 'SNAKE', advance: 'tap', focus: ['color-picker'], text: 'Choose a color for each player.' },
  {
    id: 'colors-want', scene: 'customize', speaker: 'SNAKE', isMini: true, place: 'top', advance: 'next',
    focus: ['color-picker'], interactive: true, requires: { event: 'color-changed' },
    text: "Choose the colors ya'll want",
  },
  {
    id: 'start-game', scene: 'customize', speaker: 'SNAKE', isMini: true, place: 'above', anchor: 'screen-next', advance: 'event', event: 'screen-next',
    focus: ['color-picker', 'screen-next'], interactive: true, text: "Let's get started!",
  },

  /* ---------------------------------- GAME ---------------------------------- */
  { id: 'board-welcome', scene: 'game', speaker: 'SNAKE', advance: 'tap', text: 'Welcome to Brain Ladder!' },
  { id: 'board-twist', scene: 'game', speaker: 'SNAKE', advance: 'tap', text: 'A game of snakes and ladders but with a twist!' },
  {
    id: 'roll-1', scene: 'game', speaker: 'SNAKE', isMini: true, y: 0.1, advance: 'event', event: 'dice-rolled',
    focus: ['dice'], interactive: true, text: "Let's start with rolling the dice! Just tap the dice on the bottom.",
  },
  { id: 'wait-1', scene: 'game', hidden: true, advance: 'event', event: 'landed-ladder' },
  { id: 'land-ladder', scene: 'game', speaker: 'SNAKE', advance: 'tap', text: 'OH! You landed on a ladder tile get ready for a question!' },
  { id: 'ladder-q1', scene: 'game', speaker: 'SNAKE', y: 0.2, dim: 0, advance: 'tap', text: 'Whenever you land on a ladder tile, you will be faced with a question.' },
  { id: 'ladder-q2', scene: 'game', speaker: 'SNAKE', y: 0.2, dim: 0, advance: 'tap', text: 'If you answer correctly, you will be able to go up the ladder and answering wrong means staying at the same spot' },
  { id: 'ladder-help', scene: 'game', speaker: 'SNAKE', y: 0.2, dim: 0, advance: 'event', event: 'quiz-moved', text: "For now, I'll help you answer this question but next one's on you." },

  {
    id: 'roll-2', scene: 'game', speaker: 'SNAKE', isMini: true, y: 0.1, advance: 'event', event: 'dice-rolled',
    focus: ['dice'], interactive: true, text: 'Lets roll the dice again!',
  },
  { id: 'wait-2', scene: 'game', hidden: true, advance: 'event', event: 'landed-power' },
  { id: 'power-land', scene: 'game', speaker: 'SNAKE', advance: 'tap', text: 'Oh wow! You rolled a power up these give advantages when answering.' },
  { id: 'wait-roulette', scene: 'game', hidden: true, advance: 'event', event: 'roulette-done' },

  {
    id: 'roll-3', scene: 'game', speaker: 'SNAKE', isMini: true, y: 0.1, advance: 'event', event: 'dice-rolled',
    focus: ['dice'], interactive: true, text: 'Lets roll the dice again!',
  },
  { id: 'wait-3', scene: 'game', hidden: true, advance: 'event', event: 'landed-snake' },
  { id: 'land-snake', scene: 'game', speaker: 'SNAKE', advance: 'tap', text: 'Unlucky. You landed on a snake tile. Prepare to answer another question.' },
  {
    id: 'snake-q', scene: 'game', speaker: 'SNAKE', y: 0.2, dim: 0, passive: true, advance: 'event', event: 'quiz-resolved',
    text: "On snake tiles, if you answer correctly you'll move forward 1 tile. However, answering wrong leads you to the tail of the snake.",
  },
];

/* -------------------------------------------------------------------------- */
/*  CONTEXT                                                                   */
/* -------------------------------------------------------------------------- */

type Rect = { x: number; y: number; w: number; h: number };
type Hole = Rect & { id: string };
type TargetRef = { current: View | null };

interface TutorialContextType {
  isActive: () => boolean;
  start: () => void;
  end: () => void;
  setInModal: (val: boolean) => void;
  setScene: (scene: string) => void;
  leaveScene: (scene: string) => void;
  notify: (event: string, payload?: string) => void;
  stepId: string;
  active: boolean;
  scene: string;
  inModal: boolean;
  seen: Record<string, string | true>;
  layoutVersion: number;
  advance: () => void;
  registerTarget: (id: string, ref: TargetRef) => () => void;
  measureTarget: (id: string) => Promise<Rect[]>;
  bumpLayout: () => void;
}

const noop = () => {};
const TutorialContext = createContext<TutorialContextType>({
  isActive: () => false,
  start: noop,
  end: noop,
  setInModal: noop,
  setScene: noop,
  leaveScene: noop,
  notify: noop,
  stepId: '',
  active: false,
  scene: 'setup',
  inModal: false,
  seen: {},
  layoutVersion: 0,
  advance: noop,
  registerTarget: () => noop,
  measureTarget: async () => [],
  bumpLayout: noop,
});

export const useTutorial = () => useContext(TutorialContext);

/** Call at the top of a setup screen: useTutorialScene('level-select') */
export const useTutorialScene = (name: string) => {
  const { setScene, leaveScene } = useTutorial();
  useFocusEffect(
    useCallback(() => {
      setScene(name);
      return () => leaveScene(name);
    }, [name, setScene, leaveScene]),
  );
};

export const TutorialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [scene, setSceneState] = useState('setup');
  const [inModal, setInModalState] = useState(false);
  const [seen, setSeen] = useState<Record<string, string | true>>({});
  const [layoutVersion, setLayoutVersion] = useState(0);

  const activeRef = useRef(false);
  const indexRef = useRef(0);
  const sceneRef = useRef('setup');
  const targets = useRef(new Map<string, Set<TargetRef>>());
  const layoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finish = useCallback(() => {
    activeRef.current = false;
    setActive(false);
    setSeen({});
    AsyncStorage.setItem('@has_seen_game_tutorial', 'true');
  }, []);

  const go = useCallback((index: number) => {
    if (index >= STEPS.length) {
      finish();
      return;
    }
    indexRef.current = index;
    setStepIndex(index);
    setSeen({});
  }, [finish]);

  const start = useCallback(() => {
    activeRef.current = true;
    indexRef.current = 0;
    setStepIndex(0);
    setSeen({});
    setActive(true);
  }, []);

  const end = useCallback(() => {
    activeRef.current = false;
    setActive(false);
    setSeen({});
  }, []);

  const advance = useCallback(() => {
    if (activeRef.current) go(indexRef.current + 1);
  }, [go]);

  const notify = useCallback((event: string, payload?: string) => {
    if (!activeRef.current) return;
    const step = STEPS[indexRef.current];
    if (!step) return;
    setSeen((prev) => ({ ...prev, [event]: payload ?? true }));
    if (
      step.advance === 'event' &&
      step.event === event &&
      (step.eventValue === undefined || step.eventValue === payload)
    ) {
      go(indexRef.current + 1);
    }
  }, [go]);

  const setScene = useCallback((next: string) => {
    sceneRef.current = next;
    setSceneState(next);
  }, []);

  const leaveScene = useCallback((name: string) => {
    if (sceneRef.current === name) {
      sceneRef.current = 'setup';
      setSceneState('setup');
    }
  }, []);

  const registerTarget = useCallback((id: string, ref: TargetRef) => {
    if (!targets.current.has(id)) targets.current.set(id, new Set());
    targets.current.get(id)!.add(ref);
    return () => {
      targets.current.get(id)?.delete(ref);
    };
  }, []);

  const measureTarget = useCallback((id: string) => {
    const refs = Array.from(targets.current.get(id) ?? []);
    return Promise.all(
      refs.map(
        (ref) =>
          new Promise<Rect | null>((resolve) => {
            const node = ref.current;
            if (!node) {
              resolve(null);
              return;
            }
            node.measureInWindow((x, y, w, h) => resolve(w > 0 && h > 0 ? { x, y, w, h } : null));
          }),
      ),
    ).then((rects) => rects.filter((r): r is Rect => r !== null));
  }, []);

  const bumpLayout = useCallback(() => {
    if (!activeRef.current) return;
    if (layoutTimer.current) clearTimeout(layoutTimer.current);
    layoutTimer.current = setTimeout(() => setLayoutVersion((v) => v + 1), 60);
  }, []);

  const currentStep = STEPS[stepIndex] || STEPS[0];

  const value = useMemo<TutorialContextType>(
    () => ({
      isActive: () => activeRef.current,
      start,
      end,
      setInModal: setInModalState,
      setScene,
      leaveScene,
      notify,
      stepId: active ? currentStep.id : '',
      active,
      scene,
      inModal,
      seen,
      layoutVersion,
      advance,
      registerTarget,
      measureTarget,
      bumpLayout,
    }),
    [active, currentStep.id, scene, inModal, seen, layoutVersion, start, end, setScene, leaveScene, notify, advance, registerTarget, measureTarget, bumpLayout],
  );

  return (
    <TutorialContext.Provider value={value}>
      {children}
      <TutorialOverlay />
    </TutorialContext.Provider>
  );
};

/* -------------------------------------------------------------------------- */
/*  TARGET                                                                    */
/* -------------------------------------------------------------------------- */

export const TutorialTarget: React.FC<{ id: string; children: React.ReactNode; style?: any }> = ({
  id,
  children,
  style,
}) => {
  const ref = useRef<View>(null);
  const { registerTarget, bumpLayout } = useTutorial();
  useEffect(() => registerTarget(id, ref), [id, registerTarget]);
  return (
    <View ref={ref} collapsable={false} style={style} onLayout={bumpLayout}>
      {children}
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/*  OVERLAY                                                                   */
/* -------------------------------------------------------------------------- */

const HOLE_PAD = 6;
const TYPE_MS = 18;

const unionOf = (rects: Rect[]): Rect | null => {
  if (!rects.length) return null;
  const x1 = Math.min(...rects.map((r) => r.x));
  const y1 = Math.min(...rects.map((r) => r.y));
  const x2 = Math.max(...rects.map((r) => r.x + r.w));
  const y2 = Math.max(...rects.map((r) => r.y + r.h));
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
};

const sameHoles = (a: Hole[], b: Hole[]) =>
  a.length === b.length &&
  a.every(
    (h, i) =>
      h.id === b[i].id &&
      Math.abs(h.x - b[i].x) < 1 &&
      Math.abs(h.y - b[i].y) < 1 &&
      Math.abs(h.w - b[i].w) < 1 &&
      Math.abs(h.h - b[i].h) < 1,
  );

const buildCells = (holes: Rect[], width: number, height: number) => {
  const cl = (n: number, max: number) => Math.min(Math.max(n, 0), max);
  const xs = Array.from(new Set([0, width, ...holes.flatMap((h) => [cl(h.x, width), cl(h.x + h.w, width)])])).sort((a, b) => a - b);
  const ys = Array.from(new Set([0, height, ...holes.flatMap((h) => [cl(h.y, height), cl(h.y + h.h, height)])])).sort((a, b) => a - b);
  const cells: (Rect & { hole: boolean })[] = [];
  for (let i = 0; i < xs.length - 1; i += 1) {
    for (let j = 0; j < ys.length - 1; j += 1) {
      const w = xs[i + 1] - xs[i];
      const h = ys[j + 1] - ys[j];
      if (w <= 0 || h <= 0) continue;
      const cx = xs[i] + w / 2;
      const cy = ys[j] + h / 2;
      const hole = holes.some((r) => cx >= r.x && cx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h);
      cells.push({ x: xs[i], y: ys[j], w, h, hole });
    }
  }
  return cells;
};

const useTypewriter = (text: string, resetKey: string) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    setCount(0);
    if (!text) return undefined;
    let n = 0;
    const timer = setInterval(() => {
      n += 1;
      setCount((c) => Math.max(c, n));
      if (n >= text.length) clearInterval(timer);
    }, TYPE_MS);
    return () => clearInterval(timer);
  }, [text, resetKey]);
  return { shown: text.slice(0, count), done: count >= text.length, finish: () => setCount(text.length) };
};

const PulseBorder: React.FC<{ rect: Rect }> = ({ rect }) => {
  const pulse = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(pop, { toValue: 1, duration: 320, easing: Easing.out(Easing.back(1.6)), useNativeDriver: true }).start();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 650, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 650, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, pop]);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: rect.x,
        top: rect.y,
        width: rect.w,
        height: rect.h,
        borderRadius: 16,
        borderWidth: 3,
        borderColor: '#fbbf24',
        opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }),
        transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [1.12, 1] }) }],
      }}
    />
  );
};

const DialogueBox: React.FC<{
  step: TutorialStep;
  canNext: boolean;
  anchorRect: Rect | null;
  onTap: () => void;
  onNext: () => void;
}> = ({ step, canNext, anchorRect, onTap, onNext }) => {
  const { height: H } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [boxH, setBoxH] = useState(0);
  const { shown, done, finish } = useTypewriter(step.text ?? '', step.id);
  const pop = useRef(new Animated.Value(1)).current;
  const isLad = step.speaker === 'LAD';
  const isMini = step.isMini ?? false;

  useEffect(() => {
    pop.setValue(0.4);
    Animated.spring(pop, { toValue: 1, friction: 4, tension: 150, useNativeDriver: true }).start();
  }, [step.speaker, pop]);

  let position: { top?: number; bottom?: number };
  let waitingForSize = false;
  if (step.y !== undefined) {
    position = { top: Math.max(insets.top + 8, step.y * H) };
  } else if (isMini) {
    if (step.place === 'above' && anchorRect) {
      position = { top: Math.max(insets.top + 8, anchorRect.y - boxH - 12) };
      waitingForSize = boxH === 0;
    } else {
      position = { top: insets.top + 44 };
    }
  } else {
    const lower = anchorRect ? anchorRect.y + anchorRect.h / 2 > H * 0.55 : false;
    position = lower ? { top: insets.top + 64 } : { bottom: insets.bottom + 28 };
  }

  const showNext = step.advance === 'next' && canNext;

  return (
    <View
      pointerEvents="box-none"
      onLayout={(e) => setBoxH(e.nativeEvent.layout.height)}
      style={[styles.dialogueWrap, position, waitingForSize && { opacity: 0 }]}
    >
      <View style={[styles.badge]}>
        <Text style={styles.badgeText}>{isLad ? 'LAD' : 'SNAKE'}</Text>
      </View>

      <Pressable
        style={[styles.card, isMini ? styles.cardMini : null]}
        onPress={() => {
          if (!done) finish();
          else if (step.advance === 'tap') onTap();
        }}
      >
        <Text style={[styles.text, isMini ? styles.textMini : null]}>{shown}</Text>
        {step.advance === 'tap' && done ? <Text style={styles.tapArrow}>▼</Text> : null}
      </Pressable>

      <View pointerEvents="none" style={[styles.avatar, isMini ? styles.avatarMini : null]}>
        <Animated.Image
          source={isLad ? LAD_IMG : SNAKE_IMG}
          resizeMode="contain"
          style={{ width: '100%', height: '100%', transform: [{ scale: pop }] }}
        />
      </View>

      {showNext && (
        <Pressable style={styles.nextBtn} onPress={onNext}>
          <Text style={styles.btnText}>next</Text>
        </Pressable>
      )}
    </View>
  );
};

export const TutorialOverlay: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
  const t = useTutorial();
  const { width: W, height: H } = useWindowDimensions();
  const rootRef = useRef<View>(null);
  const [holes, setHoles] = useState<Hole[]>([]);
  const [emptyRuns, setEmptyRuns] = useState(0);

  const step = t.active ? STEPS.find((s) => s.id === t.stepId) : undefined;
  const visible = !!step && step.scene === t.scene && embedded === t.inModal;
  const stepId = step?.id;

  useEffect(() => {
    setHoles([]);
    setEmptyRuns(0);
  }, [stepId]);

  useEffect(() => {
    if (!visible || !step?.focus?.length) return undefined;
    let cancelled = false;
    const focus = step.focus;
    const run = async () => {
      const found: Hole[] = [];
      for (const id of focus) {
        const rects = await t.measureTarget(id);
        rects.forEach((r) => found.push({ ...r, id }));
      }
      const origin = await new Promise<{ x: number; y: number }>((resolve) => {
        if (!rootRef.current) {
          resolve({ x: 0, y: 0 });
          return;
        }
        rootRef.current.measureInWindow((x, y) => resolve({ x, y }));
      });
      if (cancelled) return;
      const next = found
        .map((r) => ({
          id: r.id,
          x: r.x - origin.x - HOLE_PAD,
          y: r.y - origin.y - HOLE_PAD,
          w: r.w + HOLE_PAD * 2,
          h: r.h + HOLE_PAD * 2,
        }))
        .filter((r) => r.x + r.w > 0 && r.y + r.h > 0 && r.x < W && r.y < H);
      setHoles((prev) => (sameHoles(prev, next) ? prev : next));
      setEmptyRuns((n) => (next.length ? 0 : n + 1));
    };
    run();
    const timer = setInterval(run, 350);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [visible, stepId, t.layoutVersion, W, H]);

  const cells = useMemo(() => buildCells(holes, W, H), [holes, W, H]);

  if (!visible || !step) return null;

  const targetMissing = Boolean(step.interactive && step.focus?.length && emptyRuns >= 4);
  const passive = Boolean(step.passive) || targetMissing;
  const dim = step.dim ?? 0.55;

  const requirementMet =
    !step.requires ||
    (t.seen[step.requires.event] !== undefined &&
      (step.requires.value === undefined || t.seen[step.requires.event] === step.requires.value));

  const anchorRect = unionOf(holes.filter((h) => (step.anchor ? h.id === step.anchor : true)));

  return (
    <View ref={rootRef} collapsable={false} pointerEvents="box-none" style={styles.overlayContainer}>
      {!passive &&
        cells.map((c, i) => {
          const open = c.hole && !!step.interactive;
          return (
            <View
              key={`${stepId}-cell-${i}`}
              pointerEvents={open ? 'none' : 'auto'}
              onStartShouldSetResponder={() => !open}
              style={{
                position: 'absolute',
                left: c.x,
                top: c.y,
                width: c.w,
                height: c.h,
                backgroundColor: c.hole ? 'transparent' : `rgba(0,0,0,${dim})`,
              }}
            />
          );
        })}

      {!passive && holes.map((h, i) => <PulseBorder key={`${stepId}-hole-${i}`} rect={h} />)}

      {!step.hidden && (
        <DialogueBox
          step={step}
          canNext={requirementMet}
          anchorRect={anchorRect}
          onTap={t.advance}
          onNext={t.advance}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFill,
    zIndex: 9999,
    elevation: 9999,
  },
  dialogueWrap: {
    position: 'absolute',
    left: 14,
    right: 14,
  },
  badge: {
    position: 'absolute',
    top: -14,
    right: 18,
    zIndex: 5,
    backgroundColor: '#EAA842',
    borderColor: '#7a4b00',
    borderWidth: 2,
    paddingHorizontal: 16,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: { color: '#3b2600', fontWeight: '900', fontSize: 13, letterSpacing: 1 },
  card: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 24,
    paddingVertical: 20,
    paddingRight: 20,
    paddingLeft: 128,
    minHeight: 120,
    borderWidth: 3,
    borderColor: '#1f2937',
    justifyContent: 'center',
  },
  cardMini: {
    borderRadius: 18,
    paddingVertical: 12,
    paddingRight: 14,
    paddingLeft: 82,
    minHeight: 60,
    marginBottom: 14,
  },
  avatar: { position: 'absolute', left: -8, bottom: -6, width: 120, height: 130, zIndex: 6 },
  avatarMini: { left: -6, bottom: 4, width: 78, height: 86 },
  text: { fontSize: 19, fontWeight: '800', color: '#111827', lineHeight: 25 },
  textMini: { fontSize: 14, lineHeight: 19 },
  tapArrow: { position: 'absolute', right: 14, bottom: 8, color: '#92400e', fontSize: 12 },
  nextBtn: {
    position: 'absolute',
    right: 12,
    bottom: -4,
    zIndex: 7,
    backgroundColor: '#EAA842',
    borderColor: '#7a4b00',
    borderWidth: 2,
    paddingHorizontal: 26,
    paddingVertical: 3,
    borderRadius: 12,
    elevation: 4,
  },
  btnText: { color: '#3b2600', fontWeight: '900', fontSize: 16 },
});
