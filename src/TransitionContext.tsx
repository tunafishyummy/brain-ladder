import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

type TransitionContextValue = {
  fadeThroughBlack: (navigate: () => void) => void;
};

const TransitionContext = createContext<TransitionContextValue | null>(null);

export function TransitionProvider({ children }: { children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const [active, setActive] = useState(false);
  const running = useRef(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timeout.current) clearTimeout(timeout.current);
  }, []);

  const fadeThroughBlack = useCallback((navigate: () => void) => {
    if (running.current) return;
    running.current = true;
    setActive(true);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 450,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) {
        running.current = false;
        setActive(false);
        return;
      }

      navigate();
      timeout.current = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 650,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }).start(() => {
          running.current = false;
          setActive(false);
        });
      }, 100);
    });
  }, [opacity]);

  return (
    <TransitionContext.Provider value={{ fadeThroughBlack }}>
      <View style={styles.root}>
        {children}
        <Animated.View
          pointerEvents={active ? 'auto' : 'none'}
          style={[styles.blackout, { opacity }]}
        />
      </View>
    </TransitionContext.Provider>
  );
}

export function useScreenTransition() {
  const context = useContext(TransitionContext);
  if (!context) throw new Error('useScreenTransition must be used inside TransitionProvider');
  return context;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  blackout: { ...StyleSheet.absoluteFillObject, zIndex: 100, backgroundColor: '#000' },
});
