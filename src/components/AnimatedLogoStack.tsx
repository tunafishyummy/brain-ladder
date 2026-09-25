import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, ImageSourcePropType, StyleSheet, useWindowDimensions, View } from 'react-native';
import { LOGO_LAYOUT } from '../constants/logoLayout';

const layers = [
  { key: 'lad', source: require('../../assets/images/LogoLad.png'), delay: 300 },
  { key: 'brainLadder', source: require('../../assets/images/LogoBrainLadder.png'), delay: 150 },
  { key: 'adder', source: require('../../assets/images/LogoKnowItAdder.png'), delay: 0 },
] as const;

export default function AnimatedLogoStack() {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [pivotOffsetY, setPivotOffsetY] = useState(0);
  const stackRef = useRef<View>(null);
  const { height: screenHeight } = useWindowDimensions();
  const motions = useRef(layers.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const animations = motions.map((motion, index) => Animated.sequence([
      Animated.delay(layers[index].delay),
      Animated.loop(Animated.sequence([
        Animated.timing(motion, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(motion, { toValue: -1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(motion, { toValue: 0, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])),
    ]));
    animations.forEach((animation) => animation.start());
    return () => animations.forEach((animation) => animation.stop());
  }, [motions]);

  // The BrainLadder graphic's center in the existing shared layout.
  return (
    <View
      ref={stackRef}
      style={[styles.stack, { transform: [{ translateY: pivotOffsetY }] }]}
      onLayout={({ nativeEvent }) => {
        const { width, height } = nativeEvent.layout;
        setSize({ width, height });
        // Keep BrainLadder's center pivot just above the screen midpoint,
        // regardless of where this stack sits in the splash/menu layout.
        stackRef.current?.measureInWindow((_x, y) => {
          setPivotOffsetY(screenHeight * 0.45 - (y + height * 1.3));
        });
      }}
    >
      {layers.map((layer, index) => {
        const layout = LOGO_LAYOUT.layers[layer.key];
        const layerLeft = Number.parseFloat(layout.left) / 100;
        const layerTop = Number.parseFloat(layout.top) / 100;
        const pivotX = size.width * (0.48 - layerLeft);
        const pivotY = size.height * (1.3 - layerTop);
        const rotation = motions[index].interpolate({ inputRange: [-1, 0, 1], outputRange: ['-10deg', '0deg', '10deg'] });
        return (
          <Animated.View
            key={layer.key}
            style={[
              styles.layer,
              { left: layout.left, top: layout.top },
              {
                transformOrigin: [pivotX, pivotY, 0],
                transform: [{ rotate: rotation }],
              },
            ]}
          >
            <Image
              source={layer.source as ImageSourcePropType}
              resizeMode="contain"
              style={[styles.image, { transform: [{ scale: layout.scale }] }]}
            />
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    width: LOGO_LAYOUT.stackWidth,
    alignSelf: 'center',
    aspectRatio: LOGO_LAYOUT.stackAspectRatio,
  },
  layer: { position: 'absolute', height: '100%', width: '100%' },
  image: { height: '100%', width: '100%' },
});
