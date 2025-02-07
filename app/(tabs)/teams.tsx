import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Pressable, useColorScheme, Dimensions, ActivityIndicator, Share } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  useAnimatedGestureHandler,
} from 'react-native-reanimated';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
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

type ExtendedPlayer = {
  id?: string;
  player_id?: string;
  position?: string;
  name?: string;
  auction_name?: string;
  ovr?: number;
};

interface FormationSelectorProps {
  formation: Formation;
  onFormationChange: (formation: Formation) => void;
}

interface DraggablePlayerProps {
  player: PlayerData;
  position?: string;
  isStarter: boolean;
  onDragEnd: (coords: { x: number; y: number }) => void;
}

interface DragEndCoords {
  x: number;
  y: number;
}

interface FieldPosition {
  position: string;
  x: number;
  y: number;
}

interface PlayerData {
  id: string;
  name: string;
  position: string;
  ovr: number;
}

interface AssignedPlayerData {
  position: FieldPosition;
  player: PlayerData | null;
}

const FormationSelector: React.FC<FormationSelectorProps> = ({ formation, onFormationChange }) => {
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

const DraggablePlayer: React.FC<DraggablePlayerProps> = ({ player, position, isStarter, onDragEnd }) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const zIndex = useSharedValue(1);

  const panGestureEvent = useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
    onStart: () => {
      scale.value = withSpring(1.1);
      zIndex.value = 1000;
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
    },
    onActive: (event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    },
    onEnd: (event) => {
      scale.value = withSpring(1);
      zIndex.value = 1;
      translateX.value = withTiming(0);
      translateY.value = withTiming(0);
      runOnJS(onDragEnd)({
        x: event.absoluteX,
        y: event.absoluteY,
      });
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
      zIndex: zIndex.value,
    };
  });

  const getBackgroundColor = () => {
    switch (player.position) {
      case 'GK': return '#FF9800';
      case 'DEF': return '#2196F3';
      case 'MID': return '#4CAF50';
      case 'ATT': return '#F44336';
      default: return '#fff';
    }
  };

  return (
    <PanGestureHandler onGestureEvent={panGestureEvent}>
      <Animated.View style={[styles.draggableContainer, animatedStyle]}>
        <View
          style={[
            styles.playerDot,
            { backgroundColor: getBackgroundColor() },
            !isStarter && styles.reserveDot,
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
        </View>
      </Animated.View>
    </PanGestureHandler>
  );
};

interface RosterCardProps {
  formation?: Formation;
  auctionId?: string;
}

const RosterCard: React.FC<RosterCardProps> = ({ formation: initialFormation = '442', auctionId }) => {
  const [formation, setFormation] = useState(initialFormation);
  const { wonPlayers, isLoading, setWonPlayers } = useUserTeam(auctionId);
  const fieldRef = useRef<View | null>(null);
  const screenshotRef = useRef<ViewShot | null>(null);
  const { showToast } = useToast();
  const [fieldLayout, setFieldLayout] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [assignedPlayersList, setAssignedPlayersList] = useState<AssignedPlayerData[]>([]);
  const [reservePlayersList, setReservePlayersList] = useState<PlayerData[]>([]);

  const getBasePosition = useCallback((detailedPosition: string) => {
    if (['GK'].includes(detailedPosition)) return 'GK';
    if (['LB', 'CB', 'RB', 'DEF'].includes(detailedPosition)) return 'DEF';
    if (['CDM', 'CM', 'CAM', 'LM', 'RM', 'MID'].includes(detailedPosition)) return 'MID';
    if (['ST', 'CF', 'LW', 'RW', 'LF', 'RF', 'ATT'].includes(detailedPosition)) return 'ATT';
    return detailedPosition;
  }, []);

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

  useEffect(() => {
    const formationConfig = FORMATIONS[formation];
    
    const sortedPlayers = [...wonPlayers].sort((a, b) => {
      const posOrder = { GK: 1, DEF: 2, MID: 3, ATT: 4 };
      return (posOrder[a.player.position as keyof typeof posOrder] || 0) - 
             (posOrder[b.player.position as keyof typeof posOrder] || 0);
    });

    const playersByPosition = sortedPlayers.reduce((acc, wp) => {
      const basePos = getBasePosition(wp.player.position);
      if (!acc[basePos]) acc[basePos] = [];
      acc[basePos].push({
        id: wp.player_id,
        name: wp.player.name,
        position: wp.player.position,
        ovr: wp.player.ovr
      });
      return acc;
    }, {} as Record<string, PlayerData[]>);

    const newAssignedPlayers = formationConfig.positions.map((pos) => {
      const basePositionType = getBasePosition(pos.position);
      const availablePlayers = playersByPosition[basePositionType] || [];
      const player = availablePlayers.shift();
      return {
        position: pos,
        player: player || null,
      };
    });

    setAssignedPlayersList(newAssignedPlayers);

    const assignedPlayerIds = newAssignedPlayers
      .map(ap => ap.player?.id)
      .filter(Boolean) as string[];
    
    const newReserves = sortedPlayers
      .filter(wp => !assignedPlayerIds.includes(wp.player_id))
      .map(wp => ({
        id: wp.player_id,
        name: wp.player.name,
        position: wp.player.position,
        ovr: wp.player.ovr
      }));

    setReservePlayersList(newReserves);
  }, [formation, wonPlayers, getBasePosition]);

  useEffect(() => {
    if (fieldRef.current) {
      fieldRef.current.measure((
        x: number,
        y: number,
        width: number,
        height: number,
        pageX: number,
        pageY: number
      ) => {
        setFieldLayout({
          x: pageX,
          y: pageY,
          width,
          height,
        });
      });
    }
  }, []);

  const formationConfig = FORMATIONS[formation];
  
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

  const movePlayerToReserves = useCallback((player: PlayerData) => {
    setReservePlayersList(prev => [...prev, player]);
    setAssignedPlayersList(prev => 
      prev.map(p => p.player?.id === player.id ? { ...p, player: null } : p)
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleDragEnd = useCallback(
    (coords: { x: number; y: number }, draggedPlayer: PlayerData) => {
      if (!fieldRef.current) return;

      fieldRef.current.measure((x, y, width, height, pageX, pageY) => {
        const fieldBounds = {
          left: pageX,
          right: pageX + width,
          top: pageY,
          bottom: pageY + height,
        };

        // Check if dropped in reserves area
        if (
          coords.y > fieldBounds.bottom ||
          coords.y < fieldBounds.top ||
          coords.x < fieldBounds.left ||
          coords.x > fieldBounds.right
        ) {
          movePlayerToReserves(draggedPlayer);
          return;
        }

        // Find closest position
        const relativeX = (coords.x - fieldBounds.left) / width;
        const relativeY = (coords.y - fieldBounds.top) / height;

        let closestDistance = Infinity;
        let closestPosition: FieldPosition | null = null;
        let closestIndex = -1;

        assignedPlayersList.forEach((pos, index) => {
          const distance = Math.sqrt(
            Math.pow(pos.position.x - relativeX, 2) + Math.pow(pos.position.y - relativeY, 2)
          );
          if (distance < closestDistance) {
            closestDistance = distance;
            closestPosition = pos.position;
            closestIndex = index;
          }
        });

        if (!closestPosition || closestDistance > 0.2) return; // Add distance threshold

        const targetPlayer = assignedPlayersList[closestIndex]?.player;
        const sourceIndex = assignedPlayersList.findIndex(p => p.player?.id === draggedPlayer.id);

        if (sourceIndex === -1) {
          // Player is coming from reserves
          if (targetPlayer) {
            // Swap with existing player
            movePlayerToReserves(targetPlayer);
          }
          setAssignedPlayersList(prev => 
            prev.map((p, i) => i === closestIndex ? { ...p, player: draggedPlayer } : p)
          );
          setReservePlayersList(prev => prev.filter(p => p.id !== draggedPlayer.id));
        } else {
          // Player is already on field
          setAssignedPlayersList(prev => {
            const newPlayers = [...prev];
            // Always perform the swap, whether target position has a player or not
            newPlayers[sourceIndex] = { 
              ...newPlayers[sourceIndex], 
              player: targetPlayer // This will be null if target position was empty
            };
            newPlayers[closestIndex] = { 
              ...newPlayers[closestIndex], 
              player: draggedPlayer 
            };
            return newPlayers;
          });
        }

        // Provide haptic feedback for successful drop
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      });
    },
    [assignedPlayersList, movePlayerToReserves]
  );

  const handleAutoPlace = useCallback(() => {
    // Try to place each reserve player in an empty position of matching type
    const emptyPositions = assignedPlayersList
      .filter(ap => !ap.player)
      .map(ap => ({
        position: ap.position.position,
        basePosition: getBasePosition(ap.position.position)
      }));

    if (emptyPositions.length === 0) {
      showToast('No empty positions available', 'info');
      return;
    }

    const reservesByPosition = reservePlayersList.reduce((acc, player) => {
      const basePosition = getBasePosition(player.position!);
      if (!acc[basePosition]) acc[basePosition] = [];
      acc[basePosition].push(player);
      return acc;
    }, {} as Record<string, PlayerData[]>);

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
  }, [reservePlayersList, assignedPlayersList, wonPlayers, getBasePosition, setWonPlayers]);

  const handleScreenshot = async () => {
    try {
      const ref = screenshotRef.current;
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
    <GestureHandlerRootView style={styles.rosterContainer}>
      <ViewShot ref={screenshotRef} style={styles.fieldContainer}>
        <View ref={fieldRef} style={styles.field}>
          <View style={styles.centerCircle} />
          <View style={styles.centerLine} />
          <View style={styles.penaltyBox} />
          <View style={styles.penaltyBoxTop} />

          {assignedPlayersList.map(({ position: pos }, index) => (
            <View
              key={`empty-${index}`}
              style={[
                styles.playerPosition,
                {
                  left: pos.x * FIELD_WIDTH,
                  top: pos.y * FIELD_HEIGHT,
                },
              ]}
            >
              <View style={[
                styles.emptyPosition,
                styles.dropTarget,
              ]}>
                <ThemedText style={styles.emptyPositionText}>
                  {pos.position}
                </ThemedText>
              </View>
            </View>
          ))}

          {assignedPlayersList.map(({ position: pos, player }, index) => {
            if (!player) return null;

            return (
              <View
                key={`player-${index}`}
                style={[
                  styles.playerPosition,
                  {
                    left: pos.x * FIELD_WIDTH,
                    top: pos.y * FIELD_HEIGHT,
                  },
                ]}
              >
                <DraggablePlayer
                  player={player}
                  position={pos.position}
                  isStarter
                  onDragEnd={(coords) => handleDragEnd(coords, player)}
                />
              </View>
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
              {reservePlayersList.map((player) => (
                <View key={player.id} style={styles.reservePlayerContainer}>
                  <DraggablePlayer
                    player={player}
                    isStarter={false}
                    onDragEnd={(coords) => handleDragEnd(coords, player)}
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
    </GestureHandlerRootView>
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
  draggableContainer: {
    position: 'absolute',
    width: PLAYER_DOT_SIZE,
    height: PLAYER_DOT_SIZE,
  },
  dropTarget: {
    opacity: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 2,
    borderStyle: 'dashed',
  },
});

export default TeamsScreen;
