import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Pressable, useColorScheme, Dimensions, ActivityIndicator, Share } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, withSpring, withRepeat, withSequence, useSharedValue, cancelAnimation } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../constants/Colors';
import { FORMATIONS, Formation, FormationConfig } from '../../app/constants/Formations';
import { ThemedText, ThemedView } from '../../app/components/Themed';
import { Player } from '../../types/player';
import { useUserTeam } from '../hooks/useUserTeam';
import ViewShot from 'react-native-view-shot';
import { useToast } from '../context/ToastContext';

const SCREEN_WIDTH = Dimensions.get('window').width;
const FIELD_WIDTH = Math.min(SCREEN_WIDTH - 32, 320);
const FIELD_HEIGHT = FIELD_WIDTH * 1.3;
const PLAYER_DOT_SIZE = 36;

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

type ExtendedPlayer = Partial<Player> & {
  auction_name?: string;
};

interface PlayerDotProps {
  player: ExtendedPlayer;
  onLongPress: () => void;
  onPress?: () => void;
  isStarter?: boolean;
  style?: any;
  isSelected?: boolean;
  position?: string;
}

const PlayerDot: React.FC<PlayerDotProps> = ({
  player,
  onLongPress,
  onPress,
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
        onLongPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onLongPress();
        }}
        onPress={() => {
          if (onPress) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onPress();
          }
        }}
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
        {isStarter && (
          <View style={styles.playerNameContainer}>
            <ThemedText style={styles.playerName}>{player.name}</ThemedText>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

const RosterCard = ({ formation: initialFormation = '442', auctionId }: { formation?: Formation, auctionId?: string }) => {
  const [formation, setFormation] = useState<Formation>(initialFormation);
  const { wonPlayers, isLoading, setWonPlayers } = useUserTeam(auctionId);
  const [swapMode, setSwapMode] = useState<{ 
    player: ExtendedPlayer; 
    position: string;
    isReserve?: boolean;
  } | null>(null);
  const fieldRef = useRef<ViewShot>(null);
  const { showToast } = useToast();

  // Load saved formation and player order
  useEffect(() => {
    const loadSavedState = async () => {
      try {
        const savedFormation = await AsyncStorage.getItem(`formation_${auctionId}`);
        if (savedFormation) {
          setFormation(savedFormation as Formation);
        }

        const savedPlayerOrder = await AsyncStorage.getItem(`playerOrder_${auctionId}`);
        if (savedPlayerOrder && wonPlayers.length > 0) {
          const playerOrder = JSON.parse(savedPlayerOrder);
          const orderedPlayers = [...wonPlayers].sort((a, b) => {
            const indexA = playerOrder.indexOf(a.player_id);
            const indexB = playerOrder.indexOf(b.player_id);
            return indexA - indexB;
          });
          setWonPlayers(orderedPlayers);
        }
      } catch (error) {
        console.error('Error loading saved state:', error);
      }
    };

    if (auctionId) {
      loadSavedState();
    }
  }, [auctionId, wonPlayers.length]);

  // Save formation and player order when they change
  useEffect(() => {
    const saveState = async () => {
      try {
        await AsyncStorage.setItem(`formation_${auctionId}`, formation);
        await AsyncStorage.setItem(
          `playerOrder_${auctionId}`,
          JSON.stringify(wonPlayers.map(p => p.player_id))
        );
      } catch (error) {
        console.error('Error saving state:', error);
      }
    };

    if (auctionId) {
      saveState();
    }
  }, [formation, wonPlayers, auctionId]);

  const formationConfig = FORMATIONS[formation];
  
  const getBasePosition = useCallback((detailedPosition: string) => {
    if (['GK'].includes(detailedPosition)) return 'GK';
    if (['LB', 'CB', 'RB', 'DEF'].includes(detailedPosition)) return 'DEF';
    if (['CDM', 'CM', 'CAM', 'LM', 'RM', 'MID'].includes(detailedPosition)) return 'MID';
    if (['ST', 'CF', 'LW', 'RW', 'LF', 'RF', 'ATT'].includes(detailedPosition)) return 'ATT';
    return detailedPosition;
  }, []);

  // Sort players by position for optimal placement
  const sortedPlayers = [...wonPlayers].sort((a, b) => {
    const posOrder = { GK: 1, DEF: 2, MID: 3, ATT: 4 };
    return (posOrder[a.player.position as keyof typeof posOrder] || 0) - 
           (posOrder[b.player.position as keyof typeof posOrder] || 0);
  });

  // Group players by base position
  const playersByPosition = sortedPlayers.reduce((acc, wp) => {
    const basePos = getBasePosition(wp.player.position);
    if (!acc[basePos]) acc[basePos] = [];
    acc[basePos].push({
      ...wp.player,
      id: wp.player_id,
      auction_name: wp.auction_name
    });
    return acc;
  }, {} as Record<string, ExtendedPlayer[]>);

  // Assign players to positions based on formation
  const assignedPlayers = formationConfig.positions.map((pos) => {
    const basePositionType = getBasePosition(pos.position);
    const availablePlayers = playersByPosition[basePositionType] || [];
    const player = availablePlayers.shift(); // Take the next available player for this position
    return {
      position: pos,
      player: player || null,
    };
  });

  const startingXI = assignedPlayers.map(ap => ap.player).filter(Boolean);
  const reserves = sortedPlayers
    .filter(wp => !startingXI.find(p => p?.id === wp.player_id))
    .map(wp => ({
      ...wp.player,
      id: wp.player_id,
      auction_name: wp.auction_name
    }));

  const getDetailedPosition = (basePosition: string, index: number, totalInPosition: number) => {
    const positions = {
      GK: ['GK'],
      DEF: formation === '442' ? ['LB', 'CB', 'CB', 'RB'] : ['LB', 'CB', 'RB'],
      MID: formation === '442' ? ['LM', 'CM', 'CM', 'RM'] : ['CDM', 'CM', 'CAM'],
      ATT: formation === '442' ? ['ST', 'ST'] : ['LW', 'ST', 'RW']
    };

    const posArray = positions[basePosition as keyof typeof positions] || [basePosition];
    return posArray[Math.min(index, posArray.length - 1)] || basePosition;
  };

  const handleLongPress = useCallback((player: ExtendedPlayer, isReserve = false) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSwapMode({ player, position: player.position!, isReserve });
  }, []);

  const handleMoveToReserves = useCallback(() => {
    if (!swapMode) return;

    const newPlayers = [...wonPlayers];
    const playerIndex = newPlayers.findIndex(p => p.player_id === swapMode.player.id);
    if (playerIndex !== -1) {
      const [movedPlayer] = newPlayers.splice(playerIndex, 1);
      newPlayers.push(movedPlayer);
      setWonPlayers(newPlayers);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSwapMode(null);
  }, [swapMode, wonPlayers, setWonPlayers]);

  const handleEmptyPositionPress = useCallback((position: string) => {
    if (!swapMode) return;

    const emptyBasePosition = getBasePosition(position);
    const playerBasePosition = getBasePosition(swapMode.player.position!);

    // Check if the player's position matches the empty position
    if (playerBasePosition !== emptyBasePosition && 
        (playerBasePosition === 'GK' || emptyBasePosition === 'GK')) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast('Invalid position swap', 'error');
      setSwapMode(null);
      return;
    }

    const newPlayers = [...wonPlayers];
    const playerIndex = newPlayers.findIndex(p => p.player_id === swapMode.player.id);
    
    if (playerIndex !== -1) {
      const [movedPlayer] = newPlayers.splice(playerIndex, 1);
      
      // Find the target position index in the formation
      const targetIndex = assignedPlayers.findIndex(ap => 
        ap.position.position === position
      );

      if (targetIndex !== -1) {
        // If coming from reserves, put them at the start
        // If coming from starting XI, maintain relative position
        const insertIndex = swapMode.isReserve ? 0 : targetIndex;
        newPlayers.splice(insertIndex, 0, movedPlayer);
        setWonPlayers(newPlayers);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }

    setSwapMode(null);
  }, [swapMode, wonPlayers, showToast, getBasePosition, setWonPlayers, assignedPlayers]);

  const handlePlayerPress = useCallback((player: ExtendedPlayer) => {
    if (!swapMode) return;

    // Don't swap with self
    if (swapMode.player.id === player.id) {
      setSwapMode(null);
      return;
    }

    // Only enforce position check for GK
    if (player.position === 'GK' || swapMode.player.position === 'GK') {
      if (player.position !== swapMode.player.position) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showToast('Cannot swap GK with other positions', 'error');
        setSwapMode(null);
        return;
      }
    }

    const newPlayers = [...wonPlayers];
    const index1 = newPlayers.findIndex(p => p.player_id === swapMode.player.id);
    const index2 = newPlayers.findIndex(p => p.player_id === player.id);
    
    if (index1 !== -1 && index2 !== -1) {
      // Simple swap of array elements
      [newPlayers[index1], newPlayers[index2]] = [newPlayers[index2], newPlayers[index1]];
      setWonPlayers(newPlayers);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setSwapMode(null);
  }, [swapMode, wonPlayers, setWonPlayers]);

  const handleAutoPlace = useCallback(() => {
    // Try to place each reserve player in an empty position of matching type
    const emptyPositions = assignedPlayers
      .filter(ap => !ap.player)
      .map(ap => ({
        position: ap.position.position,
        basePosition: getBasePosition(ap.position.position)
      }));

    if (emptyPositions.length === 0) {
      showToast('No empty positions available', 'info');
      return;
    }

    const reservesByPosition = reserves.reduce((acc, player) => {
      const basePosition = getBasePosition(player.position!);
      if (!acc[basePosition]) acc[basePosition] = [];
      acc[basePosition].push(player);
      return acc;
    }, {} as Record<string, ExtendedPlayer[]>);

    // For each empty position, try to fill it with a matching reserve player
    let newPlayers = [...wonPlayers];
    let anyPlaced = false;

    emptyPositions.forEach(({ position, basePosition }) => {
      const matchingReserves = reservesByPosition[basePosition] || [];
      if (matchingReserves.length > 0) {
        const player = matchingReserves[0];
        const playerIndex = newPlayers.findIndex(p => p.player_id === player.id);
        if (playerIndex !== -1) {
          // Move the player to the front of the array to make them a starter
          const movedPlayer = newPlayers.splice(playerIndex, 1)[0];
          newPlayers.unshift(movedPlayer);
          anyPlaced = true;
        }
        // Remove the used player from reserves
        const reserveIndex = matchingReserves.indexOf(player);
        if (reserveIndex > -1) {
          matchingReserves.splice(reserveIndex, 1);
        }
      }
    });

    if (anyPlaced) {
      // Update the state with the new player order
      setWonPlayers(newPlayers);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      showToast('No matching reserve players for empty positions', 'info');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [reserves, assignedPlayers, wonPlayers, getBasePosition, setWonPlayers]);

  const handleScreenshot = async () => {
    try {
      const ref = fieldRef.current;
      if (!ref?.capture) return;
      
      const uri = await ref.capture();
      await Share.share({
        url: uri,
        message: 'My team formation',
      });
    } catch (error) {
      console.error('Error taking screenshot:', error);
      showToast('Failed to take screenshot', 'error');
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  return (
    <View style={styles.rosterContainer}>
      <ViewShot ref={fieldRef} style={styles.fieldContainer}>
        <View style={styles.field}>
          <View style={styles.centerCircle} />
          <View style={styles.centerLine} />
          <View style={styles.penaltyBox} />
          <View style={styles.penaltyBoxTop} />

          {assignedPlayers.map(({ position: pos, player }, index) => {
            if (!player) {
              return (
                <Pressable
                  key={pos.position + index}
                  style={[
                    styles.playerPosition,
                    {
                      left: pos.x * FIELD_WIDTH,
                      top: pos.y * FIELD_HEIGHT,
                    },
                  ]}
                  onPress={() => {
                    if (swapMode) {
                      handleEmptyPositionPress(pos.position);
                    }
                  }}
                >
                  <View style={[
                    styles.emptyPosition, 
                    { opacity: swapMode ? 0.8 : 0.5 }
                  ]}>
                    <ThemedText style={styles.emptyPositionText}>
                      {pos.position}
                    </ThemedText>
                  </View>
                </Pressable>
              );
            }

            const positionsByType = assignedPlayers
              .filter(ap => ap.player?.position === player.position)
              .map(ap => ap.player);
            const positionIndex = positionsByType.findIndex(p => p?.id === player.id);
            const detailedPosition = getDetailedPosition(
              player.position!,
              positionIndex,
              positionsByType.length
            );

            return (
              <Pressable
                key={pos.position + index}
                style={[
                  styles.playerPosition,
                  {
                    left: pos.x * FIELD_WIDTH,
                    top: pos.y * FIELD_HEIGHT,
                  },
                ]}
                onPress={() => {
                  if (swapMode) {
                    handlePlayerPress(player);
                  }
                }}
              >
                <PlayerDot
                  player={player}
                  onLongPress={() => handleLongPress(player, false)}
                  isStarter
                  isSelected={swapMode?.player.id === player.id}
                  position={detailedPosition}
                />
              </Pressable>
            );
          })}
        </View>
      </ViewShot>

      <View style={styles.bottomSheet}>
        <View style={styles.bottomSheetHeader}>
          <View style={styles.formationSection}>
            <FormationSelector
              formation={formation}
              onFormationChange={setFormation}
            />
          </View>
          <View style={styles.actionButtons}>
            {swapMode && (
              <Pressable 
                style={styles.actionButton}
                onPress={handleMoveToReserves}
              >
                <ThemedText style={styles.actionButtonText}>To Reserves</ThemedText>
              </Pressable>
            )}
            <Pressable 
              style={styles.actionButton}
              onPress={handleAutoPlace}
            >
              <ThemedText style={styles.actionButtonText}>🎯</ThemedText>
            </Pressable>
            <Pressable 
              style={styles.actionButton}
              onPress={handleScreenshot}
            >
              <MaterialIcons name="camera-alt" size={24} color="#2196f3" />
            </Pressable>
          </View>
        </View>

        <View style={styles.reserves}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.reservesRow}>
              {reserves.map((player) => (
                <View key={player.id} style={styles.reservePlayerContainer}>
                  <PlayerDot
                    player={player}
                    onLongPress={() => handleLongPress(player, true)}
                    onPress={() => handlePlayerPress(player)}
                    isStarter={false}
                    isSelected={swapMode?.player.id === player.id}
                    style={styles.reservePlayer}
                  />
                  <ThemedText style={styles.reservePlayerName} numberOfLines={1}>
                    {player.name}
                  </ThemedText>
                  <ThemedText style={styles.reservePlayerInfo}>
                    {player.position} • {player.ovr} OVR
                  </ThemedText>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

const TeamsScreen = () => {
  const [selectedAuctionId, setSelectedAuctionId] = useState<string>();
  const { userAuctions, isLoading } = useUserTeam();

  return (
    <ThemedView style={styles.container}>
      {isLoading ? (
        <ActivityIndicator style={styles.loader} size="large" />
      ) : userAuctions.length === 0 ? (
        <ThemedText style={styles.noAuctionsText}>
          You haven't participated in any auctions yet.
        </ThemedText>
      ) : (
        <>
          <View style={styles.header}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.auctionButtonsContainer}
            >
              {userAuctions.map((auction) => (
                <Pressable
                  key={auction.id}
                  style={[
                    styles.auctionButton,
                    selectedAuctionId === auction.id && styles.auctionButtonActive
                  ]}
                  onPress={() => setSelectedAuctionId(auction.id)}
                >
                  <ThemedText style={[
                    styles.auctionButtonText,
                    selectedAuctionId === auction.id && styles.auctionButtonTextActive
                  ]}>
                    {auction.name}
                  </ThemedText>
                </Pressable>
              ))}
            </ScrollView>
          </View>
          {selectedAuctionId && <RosterCard formation="442" auctionId={selectedAuctionId} />}
        </>
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  auctionButtonsContainer: {
    paddingHorizontal: 16,
  },
  auctionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: '#f0f0f0',
  },
  auctionButtonActive: {
    backgroundColor: '#2196f3',
  },
  auctionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  auctionButtonTextActive: {
    color: '#fff',
  },
  rosterContainer: {
    flex: 1,
    position: 'relative',
  },
  fieldContainer: {
    flex: 1,
    paddingTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSheet: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    paddingTop: 8,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  formationSection: {
    flex: 1,
  },
  formationSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  formationButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  formationButtonActive: {
    backgroundColor: '#2196f3',
  },
  formationButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  formationButtonTextActive: {
    color: '#fff',
  },
  screenshotButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    marginLeft: 8,
  },
  reserves: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  reservesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  reservePlayerContainer: {
    alignItems: 'center',
    marginRight: 16,
    width: 80,
  },
  reservePlayer: {
    marginRight: 16,
  },
  reservePlayerName: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  reservePlayerInfo: {
    fontSize: 10,
    opacity: 0.7,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  loader: {
    marginTop: 32,
  },
  noAuctionsText: {
    textAlign: 'center',
    marginTop: 32,
    fontSize: 16,
    opacity: 0.7,
  },
  emptyPosition: {
    width: PLAYER_DOT_SIZE,
    height: PLAYER_DOT_SIZE,
    borderRadius: PLAYER_DOT_SIZE / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyPositionText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
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
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    minWidth: 40,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#2196f3',
    fontWeight: '600',
  },
});

export default TeamsScreen;
