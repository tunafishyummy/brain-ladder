import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { usePathname } from 'expo-router';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import BookcaseBackground from './components/BookcaseBackground';

type ScreenContextValue = {
  fadeThroughBlack: (navigate: () => void) => void;
  setBookcaseDifficulty: (difficulty: string) => void;
};

const ScreenContext = createContext<ScreenContextValue | null>(null);
const BOOKCASE_ROUTES = new Set(['/level-select', '/playerselection', '/customize']);

export function TransitionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const opacity = useRef(new Animated.Value(0)).current;
  const [transitionActive, setTransitionActive] = useState(false);
  const [bookcaseDifficulty, setBookcaseDifficulty] = useState('Normal');
  const transitionRunning = useRef(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timeout.current) clearTimeout(timeout.current);
  }, []);

  const fadeThroughBlack = useCallback((navigate: () => void) => {
    if (transitionRunning.current) return;
    transitionRunning.current = true;
    setTransitionActive(true);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) {
        transitionRunning.current = false;
        setTransitionActive(false);
        return;
      }

      navigate();
      timeout.current = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }).start(() => {
          transitionRunning.current = false;
          setTransitionActive(false);
        });
      }, 80);
    });
  }, [opacity]);

  return (
    <ScreenContext.Provider value={{ fadeThroughBlack, setBookcaseDifficulty }}>
      <View style={styles.root}>
        {BOOKCASE_ROUTES.has(pathname) && (
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <BookcaseBackground difficulty={bookcaseDifficulty} />
          </View>
        )}
        {children}
        <Animated.View
          pointerEvents={transitionActive ? 'auto' : 'none'}
          style={[styles.blackout, { opacity }]}
        />
      </View>
    </ScreenContext.Provider>
  );
}

export function useScreenTransition() {
  const context = useContext(ScreenContext);
  if (!context) throw new Error('useScreenTransition must be used inside TransitionProvider');
  return context;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  blackout: { ...StyleSheet.absoluteFill, zIndex: 100, backgroundColor: '#000' },
});
