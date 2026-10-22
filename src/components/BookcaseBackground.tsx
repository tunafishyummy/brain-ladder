import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useAudio } from '../AudioContext';

const DEFAULT_BOOKCASE = require('../../assets/images/bookcase.png');
const BOOKCASES_BY_LEVEL: Record<string, number> = {
  reading: require('../../assets/images/LanguageBookcase.png'),
  research: require('../../assets/images/ScienceBookcase.png'),
  collections: require('../../assets/images/HistoryBookcase.png'),
};
const BOOKCASE_SIZE = { width: 1024, height: 1536 };
const BACKGROUND_ZOOM = 2.5;

export const getBookcaseTileSize = (width: number, height: number) => {
  const imageScale = (Math.min(width, height) / Math.max(BOOKCASE_SIZE.width, BOOKCASE_SIZE.height)) * BACKGROUND_ZOOM;
  return {
    width: BOOKCASE_SIZE.width * imageScale,
    height: BOOKCASE_SIZE.height * imageScale,
  };
};

export const getBookcaseSource = (level?: string | string[]) => {
  const selectedLevel = Array.isArray(level) ? level[0] : level;
  return selectedLevel ? BOOKCASES_BY_LEVEL[selectedLevel] ?? DEFAULT_BOOKCASE : DEFAULT_BOOKCASE;
};

/** Shared, gently scrolling bookcase backdrop. */
export default function BookcaseBackground({
  children,
  level,
}: {
  children?: React.ReactNode;
  level?: string | string[];
}) {
  const { width, height } = useWindowDimensions();
  const { backgroundSpeed } = useAudio();
  const bookcaseSource = getBookcaseSource(level);
  const [activeSource, setActiveSource] = React.useState(bookcaseSource);
  const [previousSource, setPreviousSource] = React.useState<number | null>(null);
  const activeSourceRef = useRef(bookcaseSource);
  const incomingOpacity = useRef(new Animated.Value(1)).current;
  const outgoingOpacity = useRef(new Animated.Value(0)).current;
  const offset = useRef(new Animated.Value(0)).current;
  const { width: tileWidth, height: tileHeight } = getBookcaseTileSize(width, height);
  const columns = Math.max(1, Math.ceil(width / tileWidth) + 1);
  const rows = Math.max(1, Math.ceil(height / tileHeight) + 1);

  useEffect(() => {
    if (bookcaseSource === activeSourceRef.current) return;

    const outgoingSource = activeSourceRef.current;
    activeSourceRef.current = bookcaseSource;
    setPreviousSource(outgoingSource);
    setActiveSource(bookcaseSource);
    incomingOpacity.stopAnimation();
    outgoingOpacity.stopAnimation();
    incomingOpacity.setValue(0);
    outgoingOpacity.setValue(1);

    const animation = Animated.parallel([
      Animated.timing(incomingOpacity, {
        toValue: 1,
        duration: 450,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(outgoingOpacity, {
        toValue: 0,
        duration: 450,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]);
    animation.start(({ finished }) => {
      if (finished && activeSourceRef.current === bookcaseSource) {
        setPreviousSource(null);
      }
    });

    return () => animation.stop();
  }, [bookcaseSource, incomingOpacity, outgoingOpacity]);

  useEffect(() => {
    offset.stopAnimation();
    offset.setValue(0);
    if (backgroundSpeed <= 0) return;

    const animation = Animated.loop(Animated.timing(offset, {
      toValue: 1,
      duration: backgroundSpeed * 1000,
      easing: Easing.linear,
      useNativeDriver: true,
    }));
    animation.start();
    return () => animation.stop();
  }, [backgroundSpeed, height, offset, width]);

  const translateX = offset.interpolate({ inputRange: [0, 1], outputRange: [0, -tileWidth] });
  const translateY = offset.interpolate({ inputRange: [0, 1], outputRange: [0, -tileHeight] });

  const renderTileLayer = (source: number, opacity: Animated.Value) => (
    <Animated.View
      key={source}
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { opacity }]}
    >
      <Animated.View
        style={{
          width: columns * tileWidth,
          height: rows * tileHeight,
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignContent: 'flex-start',
          transform: [{ translateX }, { translateY }],
        }}
      >
        {Array.from({ length: rows * columns }, (_, tile) => (
          <Image
            key={tile}
            source={source}
            resizeMode="cover"
            fadeDuration={0}
            style={{ width: tileWidth, height: tileHeight, flexShrink: 0 }}
          />
        ))}
      </Animated.View>
    </Animated.View>
  );

  return (
    <View style={styles.root}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {previousSource !== null && renderTileLayer(previousSource, outgoingOpacity)}
        {renderTileLayer(activeSource, incomingOpacity)}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, overflow: 'hidden', backgroundColor: '#111' } });
