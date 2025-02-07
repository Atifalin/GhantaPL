import { View, StyleSheet, ScrollView, Pressable, useColorScheme, Dimensions } from 'react-native';
import { useState, useCallback, useEffect } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, withSpring, withRepeat, withSequence, useSharedValue, cancelAnimation } from 'react-native-reanimated';
import { Colors } from '../../constants/Colors';
import { FORMATIONS, Formation, FormationConfig } from '../../app/constants/Formations';
import { ThemedText, ThemedView } from '../../app/components/Themed';
import { Player } from '../../types/player';

const SCREEN_WIDTH = Dimensions.get('window').width;
const FIELD_WIDTH = Math.min(SCREEN_WIDTH - 32, 320);
const FIELD_HEIGHT = FIELD_WIDTH * 1.3;
const PLAYER_DOT_SIZE = 36;

const SAMPLE_PLAYERS: Partial<Player>[] = [
  { id: '1', name: 'Alisson', position: 'GK' },
  { id: '2', name: 'TAA', position: 'DEF' },
  { id: '3', name: 'VVD', position: 'DEF' },
  { id: '4', name: 'Konate', position: 'DEF' },
  { id: '5', name: 'Robertson', position: 'DEF' },
  { id: '6', name: 'Mac', position: 'MID' },
  { id: '7', name: 'Szobo', position: 'MID' },
  { id: '8', name: 'Jones', position: 'MID' },
  { id: '9', name: 'Elliott', position: 'MID' },
  { id: '10', name: 'Salah', position: 'ATT' },
  { id: '11', name: 'Nunez', position: 'ATT' },
  { id: '12', name: 'Kelleher', position: 'GK' },
  { id: '13', name: 'Gomez', position: 'DEF' },
  { id: '14', name: 'Gakpo', position: 'ATT' },
  { id: '15', name: 'Jota', position: 'ATT' },
];

const FormationSelector: React.FC<{
  formation: Formation;
  onFormationChange: (formation: Formation) => void;
}> = ({ formation, onFormationChange }) => {
  return (
    <View style={styles.formationSelector}>
      {Object.values(FORMATIONS).map((f) => (
        <Pressable
          key={f.name}
          style={[
            styles.formationButton,
            formation === f.name && styles.formationButtonActive
          ]}
          onPress={() => onFormationChange(f.name)}
        >
          <ThemedText style={[
            styles.formationButtonText,
            formation === f.name && styles.formationButtonTextActive
          ]}>
            {f.label}
          </ThemedText>
        </Pressable>
      ))}
    </View>
  );
};

interface PlayerDotProps {
  player: Partial<Player>;
  onLongPress: () => void;
  isStarter?: boolean;
  style?: any;
  isSelected?: boolean;
  position?: string;
}

const PlayerDot: React.FC<PlayerDotProps> = ({
  player,
  onLongPress,
  isStarter = true,
  style,
  isSelected = false,
  position,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (isSelected) {
      scale.value = withRepeat(
        withSequence(
          withSpring(1.1, { duration: 500 }),
          withSpring(1, { duration: 500 })
        ),
        -1,
        true
      );
      opacity.value = withRepeat(
        withSequence(
          withSpring(0.7, { duration: 500 }),
          withSpring(1, { duration: 500 })
        ),
        -1,
        true
      );
    } else {
      cancelAnimation(scale);
      cancelAnimation(opacity);
      scale.value = withSpring(1);
      opacity.value = withSpring(1);
    }
  }, [isSelected]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const getBackgroundColor = () => {
    switch (player.position) {
      case 'GK':
        return '#FF9800';
      case 'DEF':
        return '#2196F3';
      case 'MID':
        return '#4CAF50';
      case 'ATT':
        return '#F44336';
      default:
        return '#fff';
    }
  };

  return (
    <Animated.View style={[animatedStyle]}>
      <Pressable
        onLongPress={onLongPress}
        style={[
          styles.playerDot,
          { backgroundColor: getBackgroundColor() },
          !isStarter && styles.reserveDot,
          style,
        ]}
      >
        <ThemedText style={styles.positionIndicator}>
          {position || player.position}
        </ThemedText>
        <View style={styles.playerNameContainer}>
          <ThemedText style={styles.playerName}>{player.name}</ThemedText>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const RosterCard = ({ formation: initialFormation = '442' }: { formation?: Formation }) => {
  const [formation, setFormation] = useState<Formation>(initialFormation);
  const [players, setPlayers] = useState(SAMPLE_PLAYERS);
  const [swapMode, setSwapMode] = useState<{ player: Partial<Player>; position: string } | null>(null);

  const formationConfig = FORMATIONS[formation];
  const startingXI = players.slice(0, 11);
  const reserves = players.slice(11);

  const getDetailedPosition = (basePosition: string, index: number) => {
    switch (basePosition) {
      case 'DEF':
        return ['LB', 'CB', 'CB', 'RB'][index];
      case 'MID':
        return formation === '442' ? ['LM', 'CM', 'CM', 'RM'][index] : ['CDM', 'CM', 'CAM'][index];
      case 'ATT':
        return formation === '442' ? ['ST', 'ST'][index] : ['LW', 'ST', 'RW'][index];
      default:
        return basePosition;
    }
  };

  const handleLongPress = useCallback((player: Partial<Player>) => {
    if (swapMode) {
      // Only enforce position check for GK
      if (player.position === 'GK' || swapMode.player.position === 'GK') {
        if (player.position !== swapMode.player.position) {
          setSwapMode(null);
          return;
        }
      }
      
      // Don't swap with self
      if (swapMode.player.id !== player.id) {
        const newPlayers = [...players];
        const index1 = newPlayers.findIndex(p => p.id === swapMode.player.id);
        const index2 = newPlayers.findIndex(p => p.id === player.id);
        [newPlayers[index1], newPlayers[index2]] = [newPlayers[index2], newPlayers[index1]];
        setPlayers(newPlayers);
      }
      setSwapMode(null);
    } else {
      setSwapMode({ player, position: player.position });
    }
  }, [swapMode, players]);

  return (
    <ThemedView style={styles.card}>
      <FormationSelector
        formation={formation}
        onFormationChange={setFormation}
      />
      
      <View style={styles.fieldContainer}>
        <View style={styles.field}>
          <View style={styles.centerCircle} />
          <View style={styles.centerLine} />
          <View style={styles.penaltyBox} />
          <View style={styles.penaltyBoxTop} />

          {formationConfig.positions.map((pos, index) => {
            const player = startingXI[index];
            if (!player) return null;

            const positionsByType = startingXI.filter(p => p.position === player.position);
            const positionIndex = positionsByType.findIndex(p => p.id === player.id);
            const detailedPosition = getDetailedPosition(player.position, positionIndex);

            return (
              <View
                key={pos.position + index}
                style={[
                  styles.playerPosition,
                  {
                    left: pos.x * FIELD_WIDTH,
                    top: pos.y * FIELD_HEIGHT,
                  },
                ]}
              >
                <PlayerDot
                  player={player}
                  onLongPress={() => handleLongPress(player)}
                  isStarter
                  isSelected={swapMode?.player.id === player.id}
                  position={detailedPosition}
                />
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.reserves}>
        <ThemedText style={styles.reservesTitle}>Reserves</ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.reservesRow}>
            {reserves.map((player) => (
              <PlayerDot
                key={player.id}
                player={player}
                onLongPress={() => handleLongPress(player)}
                isStarter={false}
                isSelected={swapMode?.player.id === player.id}
                style={styles.reservePlayer}
              />
            ))}
          </View>
        </ScrollView>
      </View>
    </ThemedView>
  );
};

const TeamsScreen = () => {
  const [activeTab, setActiveTab] = useState<'current' | 'past' | 'pending'>('current');
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <ThemedView style={styles.container}>
      <View style={styles.tabContainer}>
        {['current', 'past', 'pending'].map((tab) => (
          <Pressable
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && { 
                backgroundColor: isDark ? '#252829' : '#f0f0f0' 
              }
            ]}
            onPress={() => setActiveTab(tab as typeof activeTab)}
          >
            <ThemedText style={styles.tabText}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <ScrollView style={styles.content}>
        <RosterCard formation="442" />
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  tabText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  card: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  formationSelector: {
    flexDirection: 'row',
    padding: 8,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  formationButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginHorizontal: 4,
    marginVertical: 4,
    backgroundColor: '#f0f0f0',
  },
  formationButtonActive: {
    backgroundColor: '#2196f3',
  },
  formationButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  formationButtonTextActive: {
    color: '#fff',
  },
  fieldContainer: {
    padding: 16,
    alignItems: 'center',
  },
  field: {
    width: FIELD_WIDTH,
    height: FIELD_HEIGHT,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    position: 'relative',
    borderWidth: 2,
    borderColor: '#388E3C',
  },
  centerCircle: {
    position: 'absolute',
    width: FIELD_WIDTH * 0.3,
    height: FIELD_WIDTH * 0.3,
    borderRadius: FIELD_WIDTH * 0.15,
    borderWidth: 2,
    borderColor: '#fff',
    left: '35%',
    top: '40%',
  },
  centerLine: {
    position: 'absolute',
    width: '100%',
    height: 2,
    backgroundColor: '#fff',
    top: '50%',
  },
  penaltyBox: {
    position: 'absolute',
    width: '40%',
    height: '20%',
    borderWidth: 2,
    borderColor: '#fff',
    left: '30%',
    bottom: 0,
  },
  penaltyBoxTop: {
    position: 'absolute',
    width: '40%',
    height: '20%',
    borderWidth: 2,
    borderColor: '#fff',
    left: '30%',
    top: 0,
  },
  playerPosition: {
    position: 'absolute',
    transform: [
      { translateX: -PLAYER_DOT_SIZE / 2 },
      { translateY: -PLAYER_DOT_SIZE / 2 },
    ],
  },
  playerDot: {
    width: PLAYER_DOT_SIZE,
    height: PLAYER_DOT_SIZE,
    borderRadius: PLAYER_DOT_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#fff',
  },
  positionIndicator: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  reserveDot: {
    width: PLAYER_DOT_SIZE * 0.8,
    height: PLAYER_DOT_SIZE * 0.8,
    borderRadius: (PLAYER_DOT_SIZE * 0.8) / 2,
  },
  playerNameContainer: {
    position: 'absolute',
    top: PLAYER_DOT_SIZE + 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    width: 60,
  },
  playerName: {
    fontSize: 10,
    color: '#fff',
    textAlign: 'center',
  },
  reserves: {
    padding: 16,
  },
  reservesTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  reservesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  reservePlayer: {
    marginRight: 16,
  },
});

export default TeamsScreen;
