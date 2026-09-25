import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
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



export default function PlayerSelectionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [playerCount, setPlayerCount] = useState<1 | 2 | 3>(1);

  const handleStartGame = () => {
    router.push({
      pathname: '/customize',
      params: {
        ...params,
        players: playerCount,
      },
    });
  };

  return (
    <BookcaseBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          
          {/* Header */}
          <View style={styles.bannerContainer}>
            <Text style={styles.bannerTitle}>PLAYER COUNT</Text>
          </View>

          {/* Character Preview Container */}
          <View style={styles.previewCard}>
            <View style={styles.avatarRow}>
              {/* Player 1 */}
              <View style={styles.avatarWrapper}>
                  <Image
                    source={require('../../assets/images/Playerblue.png')}
                  style={styles.avatarImage}
                  resizeMode="contain"
                />
                <View style={[styles.playerBadge, { backgroundColor: '#3b82f6' }]}>
                  <Text style={styles.badgeText}>P1</Text>
                </View>
              </View>

              {/* Player 2 */}
              {playerCount >= 2 && (
                <View style={styles.avatarWrapper}>
                    <Image
                      source={require('../../assets/images/Playerblue.png')}
                    style={styles.avatarImage}
                    resizeMode="contain"
                  />
                  <View style={[styles.playerBadge, { backgroundColor: '#ef4444' }]}>
                    <Text style={styles.badgeText}>P2</Text>
                  </View>
                </View>
              )}

              {/* Player 3 */}
              {playerCount === 3 && (
                <View style={styles.avatarWrapper}>
                    <Image
                      source={require('../../assets/images/Playerblue.png')}
                    style={styles.avatarImage}
                    resizeMode="contain"
                  />
                  <View style={[styles.playerBadge, { backgroundColor: '#10b981' }]}>
                    <Text style={styles.badgeText}>P3</Text>
                  </View>
                </View>
              )}
            </View>

            <Text style={styles.countDisplay}>
              {playerCount} {playerCount === 1 ? 'Player' : 'Players'}
            </Text>
          </View>

          {/* Toggle Buttons */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setPlayerCount(1)}
              style={[styles.toggleTab, playerCount === 1 && styles.toggleTabActive]}
            >
              <Text style={[styles.tabText, playerCount === 1 && styles.tabTextActive]}>
                1P
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setPlayerCount(2)}
              style={[styles.toggleTab, playerCount === 2 && styles.toggleTabActive]}
            >
              <Text style={[styles.tabText, playerCount === 2 && styles.tabTextActive]}>
                2P
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setPlayerCount(3)}
              style={[styles.toggleTab, playerCount === 3 && styles.toggleTabActive]}
            >
              <Text style={[styles.tabText, playerCount === 3 && styles.tabTextActive]}>
                3P
              </Text>
            </TouchableOpacity>
          </View>

          {/* Start Game Button */}
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartGame}
            activeOpacity={0.9}
          >
            <Text style={styles.startText}>START GAME</Text>
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
  bannerContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: CARD_RADIUS,
    padding: PADDING,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
  },
  bannerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 2,
  },
  previewCard: {
    flex: 1,
    marginVertical: PADDING,
    backgroundColor: 'rgba(15, 18, 28, 0.72)',
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: PADDING,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    height: 180,
  },
  avatarWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 80,
    height: 130,
  },
  playerBadge: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12,
  },
  countDisplay: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: PADDING,
  },
  toggleTab: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: CARD_RADIUS,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  toggleTabActive: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  tabText: {
    color: '#a0a5b5',
    fontSize: 16,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#0f121c',
    fontWeight: '800',
  },
  startButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: CARD_RADIUS,
    alignItems: 'center',
  },
  startText: {
    color: '#0f121c',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
});