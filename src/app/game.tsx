import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Dimensions, Image, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const BOARD_SIZE = Math.min(SCREEN_WIDTH * 0.90, 360);
const CELL_SIZE = BOARD_SIZE / 10;

const JUMPS: { [key: number]: number } = {
  // Ladders (Going Up)
  2: 23,
  8: 31,
  14: 34,
  27: 84,
  33: 53,
  62: 81,
  85: 95,
  
  // Snakes (Going Down)
  12: 9,
  58: 38,
  75: 55,
  89: 70,
  93: 74,
  97: 36,
};

const DICE_IMAGES: { [key: number]: any } = {
  1: require('../../assets/images/dice1.png'),
  2: require('../../assets/images/dice2.png'),
  3: require('../../assets/images/dice3.png'),
  4: require('../../assets/images/dice4.png'),
  5: require('../../assets/images/dice5.png'),
  6: require('../../assets/images/dice6.png'),
};

const getCharacterAssetForColor = (color: string) => {
  switch (color) {
    case '#ef4444': // Red
      return require('../../assets/images/character-red.png');
    case '#22c55e': // Green
      return require('../../assets/images/character-green.png');
    case '#3b82f6': // Blue
    default:
      return require('../../assets/images/character-blue.png');
  }
};

type Player = {
  id: string;
  name: string;
  color: string;
  position: number;
};

export default function GameScreen() {
  const router = useRouter();

  const [players, setPlayers] = useState<Player[]>([
    { id: '1', name: "Green", color: '#22c55e', position: 1 },
    { id: '2', name: "Red", color: '#ef4444', position: 1 },
    { id: '3', name: "Blue", color: '#3b82f6', position: 1 },
  ]);
  const [turnIndex, setTurnIndex] = useState(0);
  const [diceValue, setDiceValue] = useState<number>(1);
  const [isRolling, setIsRolling] = useState(false);
  const [winner, setWinner] = useState<Player | null>(null);

  const activePlayer = players[turnIndex];

  const getCoordinatesForPosition = (pos: number) => {
    const zeroBased = pos - 1;
    const row = Math.floor(zeroBased / 10);
    let col = zeroBased % 10;
    if (row % 2 === 1) {
      col = 9 - col;
    }
    const x = col * CELL_SIZE;
    const y = (9 - row) * CELL_SIZE;
    return { x, y };
  };

  const rollDice = () => {
    if (isRolling || winner) return;
    setIsRolling(true);

    const finalRoll = Math.floor(Math.random() * 6) + 1;

    let steps = 0;
    const interval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      steps++;

      if (steps > 10) {
        clearInterval(interval);
        setDiceValue(finalRoll);
        setIsRolling(false);
        movePlayer(finalRoll);
      }
    }, 60);
  };

  const movePlayer = (roll: number) => {
    setPlayers((prevPlayers) => {
      const updated = [...prevPlayers];
      const player = updated[turnIndex];
      let newPos = player.position + roll;

      if (newPos >= 100) {
        newPos = 100;
        player.position = newPos;
        setWinner(player);
        return updated;
      } else if (JUMPS[newPos]) {
        const jumpTarget = JUMPS[newPos];
        newPos = jumpTarget;
      }

      player.position = newPos;
      return updated;
    });

    if (!winner) {
      setTurnIndex((prev) => (prev + 1) % players.length);
    }
  };

  const handleVictoryTap = () => {
    router.push('/stats');
  };

  return (
    <ImageBackground 
      source={require('../../assets/images/bookcase.png')} 
      style={styles.bg} 
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      {/* Main Container keeping Turn Banner, Board, and Dice stacked correctly */}
      <View style={styles.mainContainer}>
        {/* UPPER BOX: Turn Header Banner */}
        <View style={[styles.turnBanner, { backgroundColor: activePlayer.color }]}>
          <Text style={styles.turnText}>{activePlayer.name}'s Turn</Text>
        </View>

        {/* MIDDLE BOX: Board Display */}
        <View style={styles.boardWrapper}>
          <ImageBackground 
            source={require('../../assets/images/board.png')} 
            style={styles.boardImage}
            resizeMode="cover"
          >
            {players.map((player) => {
              const { x, y } = getCoordinatesForPosition(player.position);
              return (
                <Image
                  key={player.id}
                  source={getCharacterAssetForColor(player.color)}
                  style={[
                    styles.playerToken,
                    {
                      left: x + CELL_SIZE * 0.05,
                      top: y + CELL_SIZE * 0.05,
                    },
                  ]}
                />
              );
            })}
          </ImageBackground>
        </View>

        {/* LOWER SMALL BOX: Dice Button */}
        <View style={styles.diceSection}>
          <TouchableOpacity onPress={rollDice} disabled={isRolling || !!winner} activeOpacity={0.7}>
            <Image 
              source={DICE_IMAGES[diceValue]} 
              style={[styles.diceImage, isRolling && styles.diceRollingAnimation]} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* BOTTOM TABS: Player color status bars reaching up to the red line */}
      <View style={styles.bottomBarContainer}>
        {players.map((player, index) => {
          const isActive = index === turnIndex;
          return (
            <View
              key={player.id}
              style={[
                styles.bottomIndicator,
                { backgroundColor: player.color },
                isActive ? styles.indicatorActive : styles.indicatorInactive,
              ]}
            />
          );
        })}
      </View>

      {/* Victory Popup Overlay */}
      {winner && (
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={handleVictoryTap}>
          <ImageBackground 
            source={require('../../assets/images/victory-popup.png')} 
            style={styles.popupImageContainer}
            resizeMode="contain"
          >
            <View style={styles.popupTextWrapper}>
              <Text style={styles.victorySubtitle}>{winner.name} wins the game!</Text>
              <Text style={styles.tapToContinueText}>Tap to Continue</Text>
            </View>
          </ImageBackground>
        </TouchableOpacity>
      )}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, width: '100%', height: '100%' },
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.65)' },
  
  mainContainer: { 
    flex: 1,
    width: '100%', 
    alignItems: 'center', 
    justifyContent: 'space-evenly', 
    paddingVertical: 10,
  },
  
  turnBanner: {
    width: '90%', 
    maxWidth: BOARD_SIZE, 
    paddingVertical: 10, 
    borderRadius: 12,
    alignItems: 'center', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, 
    shadowRadius: 4, 
    elevation: 6,
  },
  turnText: { color: '#fff', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
  
  boardWrapper: { 
    width: BOARD_SIZE, 
    height: BOARD_SIZE, 
    borderWidth: 2, 
    borderColor: '#334155', 
    borderRadius: 10, 
    overflow: 'hidden', 
  },
  boardImage: { width: '100%', height: '100%' },
  
  playerToken: {
    position: 'absolute', 
    width: CELL_SIZE * 0.9, 
    height: CELL_SIZE * 0.9, 
    resizeMode: 'contain',
  },

  diceSection: { 
    alignItems: 'center', 
    justifyContent: 'center',
    height: 50,
  },
  diceImage: { width: 50, height: 50, resizeMode: 'contain' },
  diceRollingAnimation: { opacity: 0.6, transform: [{ scale: 0.95 }] },
  
  bottomBarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    width: '100%',
    paddingHorizontal: 12,
  },
  bottomIndicator: {
    flex: 1,
    marginHorizontal: 6,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
  },
  indicatorActive: {
    height: 95, // Increased height so it stretches all the way up to your red line mark
    borderTopWidth: 4,
    borderTopColor: '#fff',
  },
  indicatorInactive: {
    height: 25,
    opacity: 0.7,
  },

  modalOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  popupImageContainer: {
    width: 340,
    height: 260,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 28,
  },
  popupTextWrapper: {
    alignItems: 'center',
    gap: 8,
  },
  victorySubtitle: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  tapToContinueText: {
    color: '#facc15',
    fontWeight: 'bold',
    fontSize: 14,
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});