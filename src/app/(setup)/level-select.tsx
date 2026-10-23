import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native';
import Text from '../../components/AdaptiveText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useScreenTransition } from '../../TransitionContext';
import { useWoodKnock } from '../../audio/useWoodKnock';
import { getWoodframeSource } from '../../components/woodframes';

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

function CrossfadeFrame({
  source,
  style,
  children,
}: {
  source: number;
  style: ViewStyle;
  children: ReactNode;
}) {
  const [displayedSource, setDisplayedSource] = useState(source);
  const [incomingSource, setIncomingSource] = useState<number | null>(null);
  const displayedSourceRef = useRef(source);
  const requestedSourceRef = useRef(source);
  const opacity = useRef(new Animated.Value(0)).current;
  const animation = useRef<Animated.CompositeAnimation | null>(null);
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });
  const imageFrameStyle = {
    position: 'absolute' as const,
    left: 0,
    top: 0,
    width: frameSize.width,
    height: frameSize.height,
  };

  useEffect(() => {
    if (source === requestedSourceRef.current) return;
    requestedSourceRef.current = source;
    animation.current?.stop();
    animation.current = null;
    opacity.stopAnimation();
    opacity.setValue(0);

    if (source === displayedSourceRef.current) {
      setIncomingSource(null);
      return;
    }

    setIncomingSource(source);
    return () => animation.current?.stop();
  }, [opacity, source]);

  const startCrossfade = (loadedSource: number) => {
    if (
      loadedSource !== requestedSourceRef.current
      || loadedSource === displayedSourceRef.current
      || animation.current
    ) return;

    const nextAnimation = Animated.timing(opacity, {
      toValue: 1,
      duration: 900,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    });
    animation.current = nextAnimation;
    nextAnimation.start(({ finished }) => {
      animation.current = null;
      if (!finished || requestedSourceRef.current !== loadedSource) return;
      displayedSourceRef.current = loadedSource;
      setDisplayedSource(loadedSource);
      setIncomingSource(null);
    });
  };

  return (
    <View
      style={[style, { overflow: 'hidden' }]}
      onLayout={({ nativeEvent }) => {
        const { width, height } = nativeEvent.layout;
        setFrameSize((current) => current.width === width && current.height === height
          ? current
          : { width, height });
      }}
    >
      {frameSize.width > 0 && frameSize.height > 0 && (
        <>
          <Image
            source={displayedSource}
            resizeMode="stretch"
            fadeDuration={0}
            style={imageFrameStyle}
          />
          {incomingSource !== null && (
            <Animated.Image
              source={incomingSource}
              resizeMode="stretch"
              fadeDuration={0}
              onLoad={() => startCrossfade(incomingSource)}
              {...({ pointerEvents: 'none' } as any)}
              style={[imageFrameStyle, { opacity }]}
            />
          )}
        </>
      )}
      {children}
    </View>
  );
}

export default function LevelSelectScreen() {
  const router = useRouter();
  const { setBookcaseLevel } = useScreenTransition();
  const playKnock = useWoodKnock();
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const cardOpacities = useRef(
    Object.fromEntries(LEVELS.map(({ id }) => [id, new Animated.Value(0.55)])) as Record<string, Animated.Value>,
  ).current;
  const [difficultyIndex, setDifficultyIndex] = useState(1);
  const [questionTimer, setQuestionTimer] = useState(15);

  useEffect(() => {
    Animated.parallel(LEVELS.map(({ id }) => Animated.timing(cardOpacities[id], {
      toValue: selectedLevel === id ? 1 : 0.55,
      duration: 900,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }))).start();
  }, [cardOpacities, selectedLevel]);

  const handlePrevDifficulty = () => {
    playKnock();
    const next = difficultyIndex > 0 ? difficultyIndex - 1 : DIFFICULTIES.length - 1;
    setDifficultyIndex(next);
  };

  const handleNextDifficulty = () => {
    playKnock();
    const next = difficultyIndex < DIFFICULTIES.length - 1 ? difficultyIndex + 1 : 0;
    setDifficultyIndex(next);
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
          <CrossfadeFrame
            source={getWoodframeSource(selectedLevel ?? undefined, '6to1')}
            style={styles.headerBanner}
          >
            <Text style={styles.headerTitle}>SELECT LEVEL</Text>
          </CrossfadeFrame>
        </View>

        <ScrollView
          style={styles.optionsScroll}
          contentContainerStyle={styles.optionsContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Level Cards */}
          <View style={styles.levelsContainer}>
            {LEVELS.map((level) => {
              const frameSource = SELECTED_LEVEL_FRAMES[level.id];

              return (
                <Animated.View key={level.id} style={{ opacity: cardOpacities[level.id] }}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => {
                      playKnock();
                      setSelectedLevel(level.id);
                      setBookcaseLevel(level.id);
                    }}
                    style={styles.levelCardWrapper}
                  >
                  <ImageBackground
                    source={frameSource}
                    resizeMode="stretch"
                    style={styles.background}
                  />
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>

          {/* Difficulty Controls */}
          <CrossfadeFrame
            source={getWoodframeSource(selectedLevel ?? undefined, '4to1')}
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
          </CrossfadeFrame>

          {/* Question Timer Controls */}
          <CrossfadeFrame
            source={getWoodframeSource(selectedLevel ?? undefined, '4to1')}
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
          </CrossfadeFrame>

        </ScrollView>

        <TouchableOpacity onPress={handleContinue} activeOpacity={0.9} disabled={!selectedLevel}>
          <CrossfadeFrame
            source={getWoodframeSource(selectedLevel ?? undefined, '6to1')}
            style={styles.continueButton}
          >
            <Text style={styles.continueText}>NEXT</Text>
          </CrossfadeFrame>
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
