import { useRouter } from 'expo-router';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BookcaseBackground from '../components/BookcaseBackground';

const MODES = [
  { count: 1, label: '1 PLAYER', image: require('../../assets/images/Playerblue.png'), color: '#2563eb' },
  { count: 2, label: '2 PLAYERS', image: require('../../assets/images/Playergreen.png'), color: '#16a34a' },
  { count: 3, label: '3 PLAYERS', image: require('../../assets/images/Playerred.png'), color: '#dc2626' },
];

export default function ModeSelectScreen() {
  const router = useRouter();

  const handleContinue = (count: number) => {
    router.push({ pathname: '/level-select', params: { players: String(count) } });
  };

  return (
    <BookcaseBackground>
      <SafeAreaView edges={['top']} style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.headerBanner}>
            <Text style={styles.headerTitle}>SELECT PLAYERS</Text>
          </View>

          <View style={styles.modeList}>
            {MODES.map((mode) => (
              <TouchableOpacity
                key={mode.count}
                style={[styles.modeCard, { borderColor: mode.color }]}
                onPress={() => handleContinue(mode.count)}
                activeOpacity={0.85}
              >
                <Image source={mode.image} style={styles.playerImage} resizeMode="contain" />
                <View style={styles.modeText}>
                  <Text style={[styles.modeLabel, { color: mode.color }]}>{mode.label}</Text>
                  <Text style={styles.placeholderLabel}>PLACEHOLDER MODE</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.85}>
            <Text style={styles.backText}>BACK</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </BookcaseBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 16,
  },
  headerBanner: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(15,18,28,0.78)',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: 2,
  },
  modeList: {
    gap: 10,
  },
  modeCard: {
    minHeight: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: 'rgba(15,18,28,0.84)',
  },
  playerImage: {
    width: 72,
    height: 82,
  },
  modeText: {
    flex: 1,
    gap: 6,
  },
  modeLabel: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  placeholderLabel: {
    marginTop: 0,
    color: '#a0a5b5',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    textAlign: 'center',
  },
  backButton: {
    alignSelf: 'center',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  backText: {
    color: '#0f121c',
    fontWeight: '800',
    letterSpacing: 1,
  },
});
