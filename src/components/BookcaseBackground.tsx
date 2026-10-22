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
  const [displayedSource, setDisplayedSource] = React.useState(bookcaseSource);
  const [transitionSource, setTransitionSource] = React.useState<number | null>(null);
  const displayedSourceRef = useRef(bookcaseSource);
  const requestedSourceRef = useRef(bookcaseSource);
  const transitionStarted = useRef(false);
  const loadedTransitionTiles = useRef(new Set<number>());
  const transitionAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const transitionOpacity = useRef(new Animated.Value(0)).current;
  const offset = useRef(new Animated.Value(0)).current;
  const { width: tileWidth, height: tileHeight } = getBookcaseTileSize(width, height);
  const columns = Math.max(1, Math.ceil(width / tileWidth) + 1);
  const rows = Math.max(1, Math.ceil(height / tileHeight) + 1);

  useEffect(() => {
    if (bookcaseSource === requestedSourceRef.current) return;

    requestedSourceRef.current = bookcaseSource;
    transitionStarted.current = false;
    loadedTransitionTiles.current.clear();
    transitionAnimation.current?.stop();
    transitionAnimation.current = null;
    transitionOpacity.stopAnimation();

    if (bookcaseSource === displayedSourceRef.current) {
      transitionOpacity.setValue(0);
      setTransitionSource(null);
      return;
    }

    transitionOpacity.setValue(0);
    setTransitionSource(bookcaseSource);

    return () => {
      transitionAnimation.current?.stop();
    };
  }, [bookcaseSource, transitionOpacity]);

  const startCrossfade = (source: number, tile: number) => {
    if (
      source !== requestedSourceRef.current
      || source === displayedSourceRef.current
      || transitionStarted.current
    ) return;

    loadedTransitionTiles.current.add(tile);
    if (loadedTransitionTiles.current.size < rows * columns) return;

    transitionStarted.current = true;
    const animation = Animated.timing(transitionOpacity, {
      toValue: 1,
      duration: 900,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    });
    transitionAnimation.current = animation;
    animation.start(({ finished }) => {
      transitionAnimation.current = null;
      if (!finished || requestedSourceRef.current !== source) return;

      displayedSourceRef.current = source;
      setDisplayedSource(source);
      setTransitionSource(null);
      transitionStarted.current = false;
    });
  };

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

  const renderTileLayer = (
    source: number,
    opacity: number | Animated.Value,
    onTileLoad?: (tile: number) => void,
  ) => (
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
            onLoad={onTileLoad ? () => onTileLoad(tile) : undefined}
            style={{ width: tileWidth, height: tileHeight, flexShrink: 0 }}
          />
        ))}
      </Animated.View>
    </Animated.View>
  );

  return (
    <View style={styles.root}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {renderTileLayer(displayedSource, 1)}
        {transitionSource !== null && renderTileLayer(
          transitionSource,
          transitionOpacity,
          (tile) => startCrossfade(transitionSource, tile),
        )}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, overflow: 'hidden', backgroundColor: '#111' } });
