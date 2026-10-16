import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image, ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BookcaseBackground from '../components/BookcaseBackground';

type LeaderboardEntry = {
  rank: number;
  name: string;
  tile: number;
  avatar: string;
};

type GameStats = {
  time: string;
  totalRolls: number;
  questionsAnswered: number;
  snakeBites: number;
  ladderClimbs: number;
  powersUsed: number;
  leaderboard: LeaderboardEntry[];
};

const getCharacterAssetForColor = (color: string) => {
  switch (color) {
    case '#dc2626':
    case '#ff5252':
      return require('../../assets/images/Playerred.png');
    case '#16a34a':
    case '#26de81':
      return require('../../assets/images/Playergreen.png');
    case '#fed330':
      return require('../../assets/images/Playeryellow.png');
    case '#2563eb':
    case '#4b7bec':
    default:
      return require('../../assets/images/Playerblue.png');
  }
};

export default function StatsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ gameData?: string }>();

  const stats: GameStats = params.gameData
    ? JSON.parse(params.gameData)
    : {
        time: '00:00',
        totalRolls: 0,
        questionsAnswered: 0,
        snakeBites: 0,
        ladderClimbs: 0,
        powersUsed: 0,
        leaderboard: [],
      };

  const sortedLeaderboard = [...stats.leaderboard].sort((a, b) => a.rank - b.rank);
  const firstPlace = sortedLeaderboard.find((p) => p.rank === 1) || sortedLeaderboard[0];
  const secondPlace = sortedLeaderboard.find((p) => p.rank === 2);
  const thirdPlace = sortedLeaderboard.find((p) => p.rank === 3);

  return (
    <BookcaseBackground>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          
          {/* HEADER DECORATIONS & GAME SUMMARY TITLE IMAGE */}
          <View style={styles.headerContainer}>
            <Image
              source={require('../../assets/images/LogoKnowItAdder.png')}
              style={styles.snakeHeaderImage}
              resizeMode="contain"
            />
            <Image
              source={require('../../assets/images/game-summary.png')}
              style={styles.gameSummaryTitleImage}
              resizeMode="contain"
            />
            <Image
              source={require('../../assets/images/LogoLad.png')}
              style={styles.ladderHeaderImage}
              resizeMode="contain"
            />
          </View>

          {/* PODIUM CARD */}
          <View style={styles.podiumCard}>
            <View style={styles.podiumContainer}>
              
              {/* 2ND PLACE (LEFT) */}
              <View style={styles.podiumColumn}>
                {secondPlace && (
                  <>
                    <View style={styles.avatarWrapper}>
                      <Image
                        source={getCharacterAssetForColor(secondPlace.avatar)}
                        style={[styles.avatarImage, { backgroundColor: secondPlace.avatar }]}
                      />
                    </View>
                    <View style={[styles.pillar, styles.pillarSecond]}>
                      <Text style={styles.podiumRankText}>2nd</Text>
                      <Text style={styles.podiumTileLabel}>Tile</Text>
                      <Text style={styles.podiumTileValue}>{secondPlace.tile}</Text>
                    </View>
                  </>
                )}
              </View>

              {/* 1ST PLACE (CENTER) */}
              <View style={[styles.podiumColumn, styles.podiumColumnFirst]}>
                {firstPlace && (
                  <>
                    <Text style={styles.crownEmoji}>👑</Text>
                    <View style={styles.avatarWrapperFirst}>
                      <Image
                        source={getCharacterAssetForColor(firstPlace.avatar)}
                        style={[styles.avatarImage, { backgroundColor: firstPlace.avatar }]}
                      />
                    </View>
                    <View style={[styles.pillar, styles.pillarFirst]}>
                      <Text style={styles.podiumRankText}>1st</Text>
                      <Text style={styles.podiumTileLabelFirst}>Tile</Text>
                      <Text style={styles.podiumTileValueFirst}>{firstPlace.tile}</Text>
                    </View>
                  </>
                )}
              </View>

              {/* 3RD PLACE (RIGHT) */}
              <View style={styles.podiumColumn}>
                {thirdPlace && (
                  <>
                    <View style={styles.avatarWrapper}>
                      <Image
                        source={getCharacterAssetForColor(thirdPlace.avatar)}
                        style={[styles.avatarImage, { backgroundColor: thirdPlace.avatar }]}
                      />
                    </View>
                    <View style={[styles.pillar, styles.pillarThird]}>
                      <Text style={styles.podiumRankText}>3rd</Text>
                      <Text style={styles.podiumTileLabel}>Tile</Text>
                      <Text style={styles.podiumTileValue}>{thirdPlace.tile}</Text>
                    </View>
                  </>
                )}
              </View>

            </View>
          </View>

          {/* STATS BREAKDOWN CARD */}
          <View style={styles.statsCard}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Time:</Text>
              <Text style={styles.statValue}>{stats.time}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Total rolls:</Text>
              <Text style={styles.statValue}>{stats.totalRolls}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Questions answered:</Text>
              <Text style={styles.statValue}>{stats.questionsAnswered}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Snake bites:</Text>
              <Text style={styles.statValue}>{stats.snakeBites}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Ladder climbs:</Text>
              <Text style={styles.statValue}>{stats.ladderClimbs}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Powers used:</Text>
              <Text style={styles.statValue}>{stats.powersUsed}</Text>
            </View>
          </View>

          {/* RETURN BUTTON IMAGE */}
          <TouchableOpacity
            onPress={() => router.replace('/mainmenu')}
            activeOpacity={0.8}
          >
            <ImageBackground
              source={require('../../assets/images/return-button.png')}
              style={styles.returnButtonImage}
              resizeMode="contain"
            />
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    </BookcaseBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 380,
    marginBottom: 16,
    position: 'relative',
    height: 90,
    overflow: 'visible',
  },
  // Adjust scaling & position for snake character here:
  snakeHeaderImage: {
    width: 180,
    height: 120,
    position: 'absolute',
    left: -20,
    top: -30,
    zIndex: 10,
  },
  // Adjust scaling & position for ladder character here:
  ladderHeaderImage: {
    width: 120,
    height: 150,
    position: 'absolute',
    right: -16,
    top: -30,
    zIndex: 10,
  },
  // Adjust scaling for the GAME SUMMARY title banner here:
  gameSummaryTitleImage: {
    width: 600,
    height: 200,
    zIndex: 5,
  },
  podiumCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#657448',
    borderRadius: 24,
    borderWidth: 3,
    borderColor: '#1e293b',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 210,
    paddingHorizontal: 10,
  },
  podiumColumn: {
    alignItems: 'center',
    width: '30%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  podiumColumnFirst: {
    width: '34%',
    zIndex: 3,
  },
  crownEmoji: {
    fontSize: 22,
    marginBottom: 2,
  },
  avatarWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#ffffff',
    overflow: 'hidden',
    marginBottom: 6,
    backgroundColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrapperFirst: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 3,
    borderColor: '#facc15',
    overflow: 'hidden',
    marginBottom: 6,
    backgroundColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  pillar: {
    width: '100%',
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  pillarSecond: {
    height: 120,
    backgroundColor: '#cbd5e1',
  },
  pillarFirst: {
    height: 150,
    backgroundColor: '#fbbf24',
  },
  pillarThird: {
    height: 100,
    backgroundColor: '#c2410c',
  },
  podiumRankText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 4,
  },
  podiumTileLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  podiumTileValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  podiumTileLabelFirst: {
    fontSize: 13,
    fontWeight: '700',
    color: '#78350f',
  },
  podiumTileValueFirst: {
    fontSize: 18,
    fontWeight: '900',
    color: '#78350f',
  },
  statsCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#657448',
    borderRadius: 24,
    borderWidth: 3,
    borderColor: '#1e293b',
    paddingVertical: 18,
    paddingHorizontal: 22,
    marginBottom: 20,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  statLabel: {
    fontSize: 16,
    color: '#f8fafc',
    fontWeight: '800',
  },
  statValue: {
    fontSize: 18,
    color: '#f8fafc',
    fontWeight: '900',
  },
  returnButtonImage: {
    width: 220,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
});