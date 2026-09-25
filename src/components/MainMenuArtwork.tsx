import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';

const MENU_ART = require('../../assets/images/mainmenuart.png');
const MENU_LAD = require('../../assets/images/mainmenulad.png');
const MENU_ARM = require('../../assets/images/mainmenuladarm.png');
const ART_SIZE = Image.resolveAssetSource(MENU_ART);
const ARM_SIZE = Image.resolveAssetSource(MENU_ARM);
const PAGE_ASPECT = 9 / 20;

const ARM_PIVOT = { x: 159, y: 910 };
const ARM_HINGE_ON_CANVAS = { x: 400, y: 2600 };

export default function MainMenuArtwork({ children }: { children: React.ReactNode }) {
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });
  const angle = useRef(new Animated.Value(0)).current;
  const pageWidth = Math.min(screenSize.width, screenSize.height * PAGE_ASPECT);
  const pageHeight = pageWidth / PAGE_ASPECT;
  const scale = pageWidth / ART_SIZE.width;
  const pageLeft = (screenSize.width - pageWidth) / 2;
  const pageTop = (screenSize.height - pageHeight) / 2;
  const armWidth = ARM_SIZE.width * scale;
  const armLeft = pageLeft + (ARM_HINGE_ON_CANVAS.x - ARM_PIVOT.x) * scale;
  const armTop = pageTop + (ARM_HINGE_ON_CANVAS.y - ARM_PIVOT.y) * scale;

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
      <Image source={MENU_ART} resizeMode="stretch" style={{ position: 'absolute', left: pageLeft, top: pageTop, width: pageWidth, height: pageHeight }} />
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
      <Image source={MENU_LAD} resizeMode="stretch" style={{ position: 'absolute', left: pageLeft, top: pageTop, width: pageWidth, height: pageHeight }} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, overflow: 'hidden', backgroundColor: '#9A734D' } });
