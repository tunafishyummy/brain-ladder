import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useAudio } from '../AudioContext';

const BOOKCASE = require('../../assets/images/bookcase.png');

/** Shared, gently scrolling bookcase backdrop for every app route. */
export default function BookcaseBackground({ children }: { children: React.ReactNode }) {
  const { width, height } = useWindowDimensions();
  const { backgroundSpeed } = useAudio();
  const offset = useRef(new Animated.Value(0)).current;

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

  const translateX = offset.interpolate({ inputRange: [0, 1], outputRange: [0, -width] });
  const translateY = offset.interpolate({ inputRange: [0, 1], outputRange: [0, -height] });

  return (
    <View style={styles.root}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Animated.View style={{ width: width * 2, height: height * 2, transform: [{ translateX }, { translateY }] }}>
          {[0, 1, 2, 3].map((tile) => (
            <Image
              key={tile}
              source={BOOKCASE}
              resizeMode="cover"
              style={{ position: 'absolute', left: (tile % 2) * width, top: Math.floor(tile / 2) * height, width, height }}
            />
          ))}
        </Animated.View>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, overflow: 'hidden', backgroundColor: '#111' } });
