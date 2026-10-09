import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BookcaseBackground from '../components/BookcaseBackground';

const PADDING = 16;
const CARD_RADIUS = 16;

const PLAYER_OPTIONS = [
  { count: 1, label: '1 Player', subtitle: 'Solo Mode' },
  { count: 2, label: '2 Players', subtitle: 'Head to Head' },
  { count: 3, label: '3 Players', subtitle: 'Triple Threat' },
];

export default function PlayerSelectionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams(); // Captures level, difficulty, and timer from level-select
  const [selectedCount, setSelectedCount] = useState<number>(2);

  const handleBack = () => {
    router.back();
  };

  const handleContinue = () => {
    router.push({
      pathname: '/customize',
      params: {
        ...params, // Forwards level, difficulty, and timer
        players: selectedCount,
      },
    });
  };

  return (
    <BookcaseBackground>
      <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
        <View style={styles.content}>
          {/* Header Banner */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              activeOpacity={0.7}
            >
              <Text style={styles.backArrow}>‹</Text>
            </TouchableOpacity>

            <View style={styles.bannerContainer}>
              <Text style={styles.bannerTitle}>SELECT PLAYERS</Text>
            </View>
          </View>

          {/* Player Count Selection Cards */}
          <View style={styles.optionsContainer}>
            {PLAYER_OPTIONS.map((opt) => {
              const isSelected = selectedCount === opt.count;
              return (
                <TouchableOpacity
                  key={opt.count}
                  activeOpacity={0.85}
                  onPress={() => setSelectedCount(opt.count)}
                  style={[
                    styles.optionCard,
                    isSelected && styles.selectedOptionCard,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionTitle,
                      isSelected && styles.selectedText,
                    ]}
                  >
                    {opt.label}
                  </Text>
                  <Text style={styles.optionSubtitle}>{opt.subtitle}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
            activeOpacity={0.9}
          >
            <Text style={styles.continueText}>NEXT</Text>
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
    backgroundColor: 'rgba(55, 58, 66, 0.92)',
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
    backgroundColor: 'rgba(55, 58, 66, 0.92)',
    borderRadius: CARD_RADIUS,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
  },
  bannerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  optionsContainer: {
    gap: 16,
    marginVertical: PADDING,
  },
  optionCard: {
    backgroundColor: 'rgba(15, 18, 28, 0.72)',
    paddingVertical: 20,
    paddingHorizontal: PADDING,
    borderRadius: CARD_RADIUS,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    gap: 4,
  },
  selectedOptionCard: {
    borderColor: '#ffffff',
    borderWidth: 2,
    backgroundColor: 'rgba(55, 58, 66, 0.92)',
  },
  optionTitle: {
    color: '#e2e8f0',
    fontSize: 18,
    fontWeight: '700',
  },
  selectedText: {
    color: '#ffffff',
    fontWeight: '800',
  },
  optionSubtitle: {
    color: '#a0a5b5',
    fontSize: 13,
  },
  continueButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: CARD_RADIUS,
    alignItems: 'center',
  },
  continueText: {
    color: '#0f121c',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
