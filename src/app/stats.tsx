import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image, ImageBackground, ScrollView, StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Text from '../components/AdaptiveText';
import BookcaseBackground from '../components/BookcaseBackground';
import { getWoodframeSource } from '../components/woodframes';

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
  const { width: screenWidth } = useWindowDimensions();
  const params = useLocalSearchParams<{ gameData?: string; difficulty?: string; level?: string }>();
  const frameWidth = Math.min(screenWidth - 32, 400);

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
    <BookcaseBackground level={params.level}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          
          <View style={styles.headerContainer}>
            <Image
              source={require('../../assets/images/AdderDialogue.png')}
              style={[styles.snakeHeaderImage, styles.headerCharacterUnderFrame]}
              resizeMode="contain"
            />
            <Image
              source={require('../../assets/images/game-summary.png')}
              style={styles.gameSummaryTitleImage}
              resizeMode="contain"
            />
            <Image
              source={require('../../assets/images/LadDialogue.png')}
              style={[styles.ladderHeaderImage, styles.headerCharacterUnderFrame]}
              resizeMode="contain"
            />
          </View>

          <ImageBackground
            source={getWoodframeSource(params.level, '4to3')}
            resizeMode="stretch"
            style={[styles.frameCard, styles.podiumFrame, { width: frameWidth, aspectRatio: 4 / 3 }]}
          >
            <View style={styles.podiumContainer}>
              {/* 2ND PLACE (LEFT) */}
              <View style={styles.podiumColumn}>
                {secondPlace && (
                  <>
                    <Image source={getCharacterAssetForColor(secondPlace.avatar)} style={styles.avatarImage} />
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
                    <Image source={getCharacterAssetForColor(firstPlace.avatar)} style={styles.avatarImageFirst} />
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
                    <Image source={getCharacterAssetForColor(thirdPlace.avatar)} style={styles.avatarImage} />
                    <View style={[styles.pillar, styles.pillarThird]}>
                      <Text style={styles.podiumRankText}>3rd</Text>
                      <Text style={styles.podiumTileLabel}>Tile</Text>
                      <Text style={styles.podiumTileValue}>{thirdPlace.tile}</Text>
                    </View>
                  </>
                )}
              </View>
            </View>
          </ImageBackground>

          {/* STATS BREAKDOWN CARD */}
          <ImageBackground
            source={getWoodframeSource(params.level, '4to3')}
            resizeMode="stretch"
            style={[styles.frameCard, styles.statsFrame, { width: frameWidth, aspectRatio: 4 / 3 }]}
          >
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
          </ImageBackground>

          {/* BACK BUTTON IMAGE */}
          <TouchableOpacity
            onPress={() => router.replace('/mainmenu')}
            activeOpacity={0.8}
            style={styles.backButton}
          >
            <Image source={require('../../assets/images/Backbutton.png')} style={styles.backButtonImage} resizeMode="contain" />
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
    paddingHorizontal: 16,
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
  },
  snakeHeaderImage: {
    width: '50%',
    aspectRatio: 1,
    left: 0,
    zIndex: 0,
  },
  ladderHeaderImage: {
    width: '50%',
    aspectRatio: 1,
    right: 0,
    zIndex: 0,
  },
  headerCharacterUnderFrame: {
    position: 'absolute',
    top: -350,
  },
  gameSummaryTitleImage: {
    width: '60%',
    aspectRatio: 3,
  },
  podiumFrame: {
    zIndex: 1,
  },
  frameCard: { justifyContent: 'center', paddingHorizontal: '9%', paddingVertical: '8%', marginBottom: 12, overflow: 'hidden' },
  statsFrame: { paddingHorizontal: '12%', paddingVertical: '11%' },
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    flex: 1,
    paddingHorizontal: 2,
    transform: [{ scale: 0.92 }, { translateY: -20 }],
  },
  podiumColumn: {
    alignItems: 'center',
    width: '30%',
    flex: 1,
    justifyContent: 'flex-end',
  },
  podiumColumnFirst: {
    width: '34%',
    zIndex: 3,
  },
  crownEmoji: {
    fontSize: 18,
    marginBottom: 2,
  },
  avatarImage: { width: 60, height: 60, resizeMode: 'contain', marginBottom: 4 },
  avatarImageFirst: { width: 72, height: 72, resizeMode: 'contain', marginBottom: 4 },
  pillar: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 3,
  },
  pillarSecond: {
    height: 80,
    backgroundColor: '#cbd5e1',
  },
  pillarFirst: {
    height: 96,
    backgroundColor: '#fbbf24',
  },
  pillarThird: {
    height: 70,
    backgroundColor: '#c2410c',
  },
  podiumRankText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 2,
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
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 1,
  },
  statLabel: {
    flexShrink: 1,
    fontSize: 14,
    color: '#f8fafc',
    fontWeight: '800',
  },
  statValue: {
    fontSize: 16,
    color: '#f8fafc',
    fontWeight: '900',
  },
  backButton: { width: 72, height: 54, justifyContent: 'center', alignItems: 'center' },
  backButtonImage: {
    width: 60,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
