import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';

const MENU_ART = require('../../assets/images/mainmenuart.png');
const MENU_LAD = require('../../assets/images/mainmenulad.png');
const MENU_ARM = require('../../assets/images/mainmenuladarm.png');
const ART_SIZE = { width: 1350, height: 3000 };
const ARM_SIZE = { width: 2600, height: 1200 };
const PAGE_ASPECT = 9 / 20;

const ARM_PIVOT = { x: 159, y: 910 };
const ARM_HINGE_ON_CANVAS = { x: -400, y: 1300 };

type MainMenuArtworkProps = {
  children: React.ReactNode;
  zoomProgress: Animated.Value;
  zoomAnchor?: { x: number; y: number };
  isTransitioning: boolean;
};

export default function MainMenuArtwork({
  children,
  zoomProgress,
  zoomAnchor,
  isTransitioning,
}: MainMenuArtworkProps) {
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });
  const angle = useRef(new Animated.Value(0)).current;
  const pageWidth = Math.min(screenSize.width, screenSize.height * PAGE_ASPECT);
  const pageHeight = pageWidth / PAGE_ASPECT;
  const scale = pageWidth / ART_SIZE.width;
  const pageLeft = (screenSize.width - pageWidth) / 2;
  const pageTop = (screenSize.height - pageHeight) / 2;
  const armWidth = ARM_SIZE.width * scale;
  const armLeft = (ARM_HINGE_ON_CANVAS.x - ARM_PIVOT.x) * scale;
  const armTop = (ARM_HINGE_ON_CANVAS.y - ARM_PIVOT.y) * scale;
  const zoomOriginX = (zoomAnchor?.x ?? screenSize.width / 2) - pageLeft;
  const zoomOriginY = (zoomAnchor?.y ?? screenSize.height / 2) - pageTop;
  const artScale = zoomProgress.interpolate({ inputRange: [0, 1], outputRange: [1, 3.6] });
  const contentOpacity = zoomProgress.interpolate({ inputRange: [0, 0.18, 1], outputRange: [1, 0, 0] });

  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(angle, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(angle, { toValue: -1, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(angle, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [angle]);

  const armRotation = angle.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-10deg', '0deg', '10deg'] });

  return (
    <View style={styles.root} onLayout={({ nativeEvent }) => setScreenSize(nativeEvent.layout)}>
      <Animated.View
        style={{
          position: 'absolute',
          left: pageLeft,
          top: pageTop,
          width: pageWidth,
          height: pageHeight,
          transformOrigin: [zoomOriginX, zoomOriginY, 0],
          transform: [{ scale: artScale }],
        }}
      >
        <Image source={MENU_ART} resizeMode="stretch" style={styles.pageImage} />
        <Animated.Image
          source={MENU_ARM}
          resizeMode="contain"
          style={{
            position: 'absolute',
            left: armLeft,
            top: armTop,
            width: armWidth,
            height: armWidth,
            transformOrigin: [ARM_PIVOT.x * scale, ARM_PIVOT.y * scale, 0],
            transform: [{ rotate: armRotation }],
          }}
        />
        <Image source={MENU_LAD} resizeMode="stretch" style={styles.pageImage} />
      </Animated.View>

      <Animated.View
        pointerEvents={isTransitioning ? 'none' : 'box-none'}
        style={[StyleSheet.absoluteFill, { opacity: contentOpacity }]}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden', backgroundColor: '#9A734D' },
  pageImage: { position: 'absolute', width: '100%', height: '100%' },
});
