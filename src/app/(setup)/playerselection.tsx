import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
      <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
        <View style={styles.content}>
          {/* Header Banner */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              activeOpacity={0.7}
            >
              <Image
                source={require('../../../assets/images/Backbutton.png')}
                style={styles.backArrowImage}
                resizeMode="contain"
              />
            </TouchableOpacity>

            <ImageBackground
              source={require('../../../assets/images/woodframe6to1.png')}
              resizeMode="stretch"
              style={styles.bannerContainer}
            >
              <Text style={styles.bannerTitle}>SELECT PLAYERS</Text>
            </ImageBackground>
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
                    styles.optionCardTouch,
                    !isSelected && styles.unselectedOptionCard,
                  ]}
                >
                  <ImageBackground
                    source={require('../../../assets/images/woodframe4to1.png')}
                    resizeMode="stretch"
                    style={styles.optionCard}
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
                  </ImageBackground>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Continue Button */}
          <TouchableOpacity onPress={handleContinue} activeOpacity={0.9}>
            <ImageBackground
              source={require('../../../assets/images/woodframe6to1.png')}
              resizeMode="stretch"
              style={styles.continueButton}
            >
              <Text style={styles.continueText}>NEXT</Text>
            </ImageBackground>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrowImage: {
    width: 44,
    height: 30,
  },
  bannerContainer: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
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
  optionCardTouch: {
    width: '100%',
  },
  unselectedOptionCard: {
    opacity: 0.55,
  },
  optionCard: {
    paddingVertical: 20,
    paddingHorizontal: PADDING,
    alignItems: 'center',
    gap: 4,
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
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
