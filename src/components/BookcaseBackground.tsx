import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useAudio } from '../AudioContext';

const BOOKCASE = require('../../assets/images/bookcase.png');
const EASY_BOOKCASE = require('../../assets/images/easybookcase.png');
const NORMAL_BOOKCASE = require('../../assets/images/normalbookcase.png');
const HARD_BOOKCASE = require('../../assets/images/hardbookcase.png');
const BOOKCASE_SIZE = { width: 1024, height: 1536 };
const BACKGROUND_ZOOM = 2.5;

export const getBookcaseSource = (difficulty?: string | string[]) => {
  const selectedDifficulty = Array.isArray(difficulty) ? difficulty[0] : difficulty;
  if (selectedDifficulty === 'Easy') return EASY_BOOKCASE;
  if (selectedDifficulty === 'Hard') return HARD_BOOKCASE;
  if (selectedDifficulty === 'Normal') return NORMAL_BOOKCASE;
  return BOOKCASE;
};

/** Shared, gently scrolling bookcase backdrop for every app route. */
export default function BookcaseBackground({
  children,
  difficulty,
}: {
  children: React.ReactNode;
  difficulty?: string | string[];
}) {
  const { width, height } = useWindowDimensions();
  const { backgroundSpeed } = useAudio();
  const bookcaseSource = getBookcaseSource(difficulty);
  const offset = useRef(new Animated.Value(0)).current;
  const imageScale = (Math.min(width, height) / Math.max(BOOKCASE_SIZE.width, BOOKCASE_SIZE.height)) * BACKGROUND_ZOOM;
  const tileWidth = BOOKCASE_SIZE.width * imageScale;
  const tileHeight = BOOKCASE_SIZE.height * imageScale;
  const columns = Math.max(1, Math.ceil(width / tileWidth) + 1);
  const rows = Math.max(1, Math.ceil(height / tileHeight) + 1);

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

  return (
    <View style={styles.root}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
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
              source={bookcaseSource}
              resizeMode="cover"
              fadeDuration={0}
              style={{ width: tileWidth, height: tileHeight, flexShrink: 0 }}
            />
          ))}
        </Animated.View>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, overflow: 'hidden', backgroundColor: '#111' } });
