import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import BookcaseBackground from '../components/BookcaseBackground';

const PADDING = 16;
const CARD_RADIUS = 16;

const COLOR_OPTIONS = [
  { id: 'blue', hex: '#4b7bec', label: 'Blue' },
  { id: 'red', hex: '#ff5252', label: 'Red' },
  { id: 'green', hex: '#26de81', label: 'Green' },
  { id: 'yellow', hex: '#fed330', label: 'Yellow' },
];

const PLAYER_ACCENT_COLORS: { [key: number]: string } = {
  0: 'hsl(0, 0%, 37%)', // Player 1 - Default Blue Accent
  1: 'hsl(0, 0%, 37%)', // Player 2 - Default Red Accent
  2: 'hsl(0, 0%, 37%)', // Player 3 - Default Green Accent
};

export default function CustomizeCharacterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const totalPlayers = Number(params.players || 1);
  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  const [hoveredColor, setHoveredColor] = useState<string | null>(null);

  const [selectedColors, setSelectedColors] = useState<(string | null)[]>(
    Array(totalPlayers).fill(null)
  );

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const currentPlayerNum = activePlayerIndex + 1;
  const currentSelection = selectedColors[activePlayerIndex];

  // Dynamic header banner background color
  const bannerBgColor =
    currentSelection ||
    PLAYER_ACCENT_COLORS[activePlayerIndex] ||
    'rgba(255, 255, 255, 0.08)';

  useEffect(() => {
    fadeAnim.setValue(0.3);
    scaleAnim.setValue(0.95);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, [activePlayerIndex]);

  const handleBack = () => {
    if (activePlayerIndex > 0) {
      setActivePlayerIndex((prev) => prev - 1);
    } else {
      router.back();
    }
  };

  const handleSelectColor = (hex: string) => {
    const isTakenByOther = selectedColors.some(
      (color, idx) => color === hex && idx !== activePlayerIndex
    );
    if (isTakenByOther) return;

    const updated = [...selectedColors];
    updated[activePlayerIndex] = hex;
    setSelectedColors(updated);
  };

  const handleNextOrStart = () => {
    if (!currentSelection) return;

    if (activePlayerIndex < totalPlayers - 1) {
      setActivePlayerIndex((prev) => prev + 1);
    } else {
      router.push({
        pathname: '/game',
        params: {
          ...params,
          playerColors: JSON.stringify(selectedColors),
        },
      });
    }
  };

  return (
    <BookcaseBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>

          {/* Header Banner with Dynamic Color Background */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              activeOpacity={0.7}
            >
              <Text style={styles.backArrow}>‹</Text>
            </TouchableOpacity>

            <View style={[styles.bannerContainer, { backgroundColor: bannerBgColor }]}>
              <Text style={styles.bannerTitle}>CUSTOMIZE CHARACTER</Text>
              <Text style={styles.bannerSubtitle}>
                PLAYER {currentPlayerNum} OF {totalPlayers} TURN
              </Text>
            </View>
          </View>

          {/* Smooth Character Preview & Instruction */}
          <Animated.View
            style={[
              styles.previewCard,
              { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
            ]}
          >
            {/* Instruction Banner with Dynamic Highlight */}
            <View style={styles.instructionBox}>
              <Text style={styles.instructionText}>
                <Text
                  style={{
                    color:
                      currentSelection ||
                      PLAYER_ACCENT_COLORS[activePlayerIndex] ||
                      'hsl(0, 0%, 37%)',
                    fontWeight: '800',
                  }}
                >
                  Player {currentPlayerNum}
                </Text>
              </Text>
            </View>

            <View style={styles.avatarWrapper}>
              <Image
                source={require('../../assets/images/book.png')}
                style={styles.avatarImage}
                resizeMode="contain"
              />
              <View
                style={[
                  styles.playerBadge,
                  {
                    backgroundColor:
                      currentSelection ||
                      PLAYER_ACCENT_COLORS[activePlayerIndex] ||
                      'rgba(255,255,255,0.2)',
                  },
                ]}
              >
                <Text style={styles.badgeText}>P{currentPlayerNum}</Text>
              </View>
            </View>

            {/* Selection Summary Row */}
            <View style={styles.summaryRow}>
              {selectedColors.map((color, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.summaryDot,
                    {
                      backgroundColor:
                        color || PLAYER_ACCENT_COLORS[idx] || 'transparent',
                    },
                    idx === activePlayerIndex && styles.activeSummaryDot,
                  ]}
                >
                  <Text style={styles.summaryDotText}>P{idx + 1}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Color Selection Grid */}
          <View style={styles.colorGrid}>
            {COLOR_OPTIONS.map((item) => {
              const isTakenByOther = selectedColors.some(
                (color, idx) => color === item.hex && idx !== activePlayerIndex
              );
              const isSelectedByCurrent = currentSelection === item.hex;

              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={isTakenByOther ? 1 : 0.8}
                  onPress={() => handleSelectColor(item.hex)}
                  onMouseEnter={() => setHoveredColor(item.hex)}
                  onMouseLeave={() => setHoveredColor(null)}
                  style={[
                    styles.colorBox,
                    { backgroundColor: item.hex },
                    isTakenByOther && styles.disabledBox,
                    isSelectedByCurrent && styles.selectedBoxBorder,
                  ]}
                >
                  {isTakenByOther && (
                    <View style={styles.takenOverlay}>
                      <Text style={styles.takenText}>TAKEN</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Continue / Next Player Button */}
          <TouchableOpacity
            style={[styles.actionButton, !currentSelection && styles.disabledButton]}
            onPress={handleNextOrStart}
            disabled={!currentSelection}
            activeOpacity={0.9}
          >
            <Text style={styles.actionText}>
              {activePlayerIndex < totalPlayers - 1 ? 'NEXT PLAYER' : 'START GAME'}
            </Text>
          </TouchableOpacity>

        </View>
      </SafeAreaView>
    </BookcaseBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: PADDING,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: CARD_RADIUS,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '300',
    marginTop: -2,
  },
  bannerContainer: {
    flex: 1,
    borderRadius: CARD_RADIUS,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    gap: 2,
  },
  bannerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  bannerSubtitle: {
    color: '#ffffff',
    opacity: 0.8,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
  },
  previewCard: {
    flex: 1,
    marginVertical: PADDING,
    backgroundColor: 'rgba(15, 18, 28, 0.72)',
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: PADDING,
  },
  instructionBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginTop: 4,
  },
  instructionText: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  avatarWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  avatarImage: {
    width: 90,
    height: 120,
  },
  playerBadge: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeSummaryDot: {
    borderColor: '#ffffff',
    borderWidth: 2.5,
  },
  summaryDotText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: PADDING,
    justifyContent: 'center',
  },
  colorBox: {
    width: '47%',
    height: 80,
    borderRadius: CARD_RADIUS,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  selectedBoxBorder: {
    borderWidth: 4,
    borderColor: '#ffffff',
  },
  disabledBox: {
    opacity: 0.25,
  },
  takenOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  takenText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 1,
  },
  actionButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: CARD_RADIUS,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.4,
  },
  actionText: {
    color: '#0f121c',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
});