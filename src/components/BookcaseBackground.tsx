import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useAudio } from '../AudioContext';

const BOOKCASE = require('../../assets/images/bookcase.png');
const BOOKCASE_SIZE = Image.resolveAssetSource(BOOKCASE);
const BACKGROUND_ZOOM = 1.35;

/** Shared, gently scrolling bookcase backdrop for every app route. */
export default function BookcaseBackground({ children }: { children: React.ReactNode }) {
  const { width, height } = useWindowDimensions();
  const { backgroundSpeed } = useAudio();
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
        <Animated.View style={{ width: columns * tileWidth, height: rows * tileHeight, transform: [{ translateX }, { translateY }] }}>
          {Array.from({ length: rows * columns }, (_, tile) => (
            <Image
              key={tile}
              source={BOOKCASE}
              resizeMode="cover"
              style={{ position: 'absolute', left: (tile % columns) * tileWidth, top: Math.floor(tile / columns) * tileHeight, width: tileWidth, height: tileHeight }}
            />
          ))}
        </Animated.View>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, overflow: 'hidden', backgroundColor: '#111' } });
