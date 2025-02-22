import React, { useState, useCallback, useEffect, useRef, memo, useMemo } from 'react';
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
import { getTeamAnalysis } from '../../utils/teamAnalysis';
import AIRatingDialog from '../components/AIRatingDialog';
import { useTheme } from '../context/ThemeContext';
import { ThemedButton } from '../components/ThemedButton';
import { debounce } from 'lodash';
import { ErrorBoundary as RNErrorBoundary } from 'react-error-boundary';

const SCREEN_WIDTH = Dimensions.get('window').width;
const FIELD_WIDTH = Math.min(SCREEN_WIDTH - 32, 300);
const FIELD_HEIGHT = FIELD_WIDTH * 1.5;
const PLAYER_DOT_SIZE = 32;
const PLAYER_NAME_WIDTH = 80;

// Constants
const ANIMATION_CONFIG = {
  SPRING: { damping: 10, stiffness: 100 },
  TIMING: { duration: 300 },
};

const POSITION_COLORS = {
  GK: 'theme.tint',
  DEF: '#2196F3',
  MID: '#4CAF50',
  ATT: '#F44336',
} as const;

const POSITION_PRIORITIES: Record<string, number> = {
  GK: 10,  // Goalkeeper is highest priority
  ST: 9,   // Strikers are next highest
  CB: 8,   // Center backs are important
  CDM: 7,  // Defensive mid
  CM: 6,   // Central mid
  CAM: 6,  // Attacking mid
  LW: 5,   // Wingers
  RW: 5,
  LM: 4,   // Wide midfielders
  RM: 4,
  LB: 3,   // Full backs
  RB: 3,
  DEF: 2,  // Generic positions have lower priority
  MID: 1,
  ATT: 1
} as const;

const POSITION_COMPATIBILITY: Record<string, readonly string[]> = {
  GK: ['GK'],
  CB: ['CB', 'DEF'],
  LB: ['LB', 'LWB', 'DEF'],
  RB: ['RB', 'RWB', 'DEF'],
  CDM: ['CDM', 'CM', 'MID'],
  CM: ['CM', 'CDM', 'CAM', 'MID'],
  CAM: ['CAM', 'CM', 'MID', 'ATT'],
  LM: ['LM', 'LW', 'MID'],
  RM: ['RM', 'RW', 'MID'],
  LW: ['LW', 'LM', 'ATT'],
  RW: ['RW', 'RM', 'ATT'],
  ST: ['ST', 'CF', 'ATT'],
  CF: ['CF', 'ST', 'CAM', 'ATT'],
  DEF: ['DEF', 'CB', 'LB', 'RB'],
  MID: ['MID', 'CM', 'CDM', 'CAM', 'LM', 'RM'],
  ATT: ['ATT', 'ST', 'CF', 'LW', 'RW']
} as const;

// Types
type Position = keyof typeof POSITION_PRIORITIES;
type PositionColor = keyof typeof POSITION_COLORS;

interface PlayerPosition {
  x: number;
  y: number;
  position: Position;
}

interface PlayerStats {
  id: string;
  name: string;
  position: Position;
  ovr: number;
}

interface AssignedPlayer {
  position: PlayerPosition;
  player: PlayerStats | null;
}

interface FieldLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Update existing interfaces
interface DraggablePlayerProps {
  player: PlayerStats;
  position?: Position;
  isStarter: boolean;
  onDragEnd: (coords: { x: number; y: number }) => void;
}

interface RosterCardProps {
  formation?: Formation;
  auctionId?: string;
}

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

const FormationSelector = memo<FormationSelectorProps>(({ formation, onFormationChange }) => {
  const { theme, isDark } = useTheme();
  
  return (
    <View style={styles.formationSelector}>
      {Object.values(FORMATIONS).map((f) => (
        <ThemedButton
          key={f.name}
          title={f.label}
          variant={formation === f.name ? 'primary' : 'secondary'}
          onPress={() => onFormationChange(f.name)}
          style={styles.formationButton}
        />
      ))}
    </View>
  );
});

const DraggablePlayer = memo<DraggablePlayerProps>(({ player, position, isStarter, onDragEnd }) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const zIndex = useSharedValue(1);
  const { theme } = useTheme();

  const getBackgroundColor = useCallback(() => {
    switch (player.position) {
      case 'GK': return theme.tint;
      case 'DEF': return '#2196F3';
      case 'MID': return '#4CAF50';
      case 'ATT': return '#F44336';
      default: return theme.card;
    }
  }, [player.position, theme]);

  const panGestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
    onStart: () => {
      scale.value = withSpring(1.1, ANIMATION_CONFIG.SPRING);
      zIndex.value = 1000;
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
    },
    onActive: (event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    },
    onEnd: (event) => {
      scale.value = withSpring(1, ANIMATION_CONFIG.SPRING);
      zIndex.value = 1;
      translateX.value = withTiming(0, ANIMATION_CONFIG.TIMING);
      translateY.value = withTiming(0, ANIMATION_CONFIG.TIMING);
      runOnJS(onDragEnd)({
        x: event.absoluteX,
        y: event.absoluteY,
      });
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    zIndex: zIndex.value,
  }));

  return (
    <PanGestureHandler onGestureEvent={panGestureHandler}>
      <Animated.View style={[styles.draggableContainer, animatedStyle]}>
        <View
          style={[
            styles.playerDot,
            { backgroundColor: getBackgroundColor() }
          ]}
        >
          <ThemedText style={styles.positionIndicator}>
            {player.position}
          </ThemedText>
          <View style={[
            styles.playerNameContainer,
            !isStarter && styles.reservePlayerNameContainer
          ]}>
            <ThemedText style={styles.playerName}>{player.name}</ThemedText>
          </View>
        </View>
      </Animated.View>
    </PanGestureHandler>
  );
});

FormationSelector.displayName = 'FormationSelector';
DraggablePlayer.displayName = 'DraggablePlayer';

interface RosterCardProps {
  formation?: Formation;
  auctionId?: string;
}

const LoadingState = () => (
  <ThemedView style={styles.loadingContainer}>
    <ActivityIndicator size="large" />
  </ThemedView>
);

const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) => {
  const { showToast } = useToast();

  useEffect(() => {
    if (error?.message) {
      showToast(error.message, 'error');
    } else {
      showToast('An error occurred. Please try again.', 'error');
    }
  }, [error, showToast]);

  return (
    <ThemedView style={styles.errorContainer}>
      <ThemedText style={styles.errorText}>Something went wrong.</ThemedText>
      <ThemedButton
        title="Try Again"
        onPress={resetErrorBoundary}
        variant="primary"
        style={styles.errorButton}
      />
    </ThemedView>
  );
};

const ErrorBoundaryWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <RNErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error: Error) => {
        console.error('Error caught by boundary:', error);
      }}
      onReset={() => {
        // Optional: Add any reset logic here
      }}
    >
      {children}
    </RNErrorBoundary>
  );
};

const RosterCard: React.FC<RosterCardProps> = ({ formation: initialFormation = '442', auctionId }) => {
  const { theme, isDark } = useTheme();
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
  const [isAIDialogVisible, setIsAIDialogVisible] = useState(false);
  const [aiRating, setAiRating] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingFormation, setIsLoadingFormation] = useState(false);
  const [isLoadingSave, setIsLoadingSave] = useState(false);

  const getBasePosition = useCallback((detailedPosition: string) => {
    if (['GK'].includes(detailedPosition)) return 'GK';
    if (['LB', 'CB', 'RB', 'DEF'].includes(detailedPosition)) return 'DEF';
    if (['CDM', 'CM', 'CAM', 'LM', 'RM', 'MID'].includes(detailedPosition)) return 'MID';
    if (['ST', 'CF', 'LW', 'RW', 'LF', 'RF', 'ATT'].includes(detailedPosition)) return 'ATT';
    return detailedPosition;
  }, []);

  const debouncedSave = useCallback(
    debounce(async (formation: Formation, players: any[]) => {
      setIsLoadingSave(true);
      try {
        await AsyncStorage.setItem(`formation_${auctionId}`, formation);
        await AsyncStorage.setItem(
          `playerOrder_${auctionId}`,
          JSON.stringify(players.map(p => p.player_id))
        );
      } catch (error) {
        console.error('Error saving state:', error);
        showToast('Failed to save changes', 'error');
      } finally {
        setIsLoadingSave(false);
      }
    }, 500),
    [auctionId]
  );

  useEffect(() => {
    const loadSavedState = async () => {
      setIsLoadingFormation(true);
      try {
        const [savedFormation, savedPlayerOrder] = await Promise.all([
          AsyncStorage.getItem(`formation_${auctionId}`),
          AsyncStorage.getItem(`playerOrder_${auctionId}`)
        ]);

        if (savedFormation) {
          setFormation(savedFormation as Formation);
        }

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
        showToast('Failed to load saved formation', 'error');
      } finally {
        setIsLoadingFormation(false);
      }
    };

    if (auctionId) {
      loadSavedState();
    }
  }, [auctionId, wonPlayers.length]);

  useEffect(() => {
    if (auctionId) {
      debouncedSave(formation, wonPlayers);
    }
  }, [formation, wonPlayers, auctionId, debouncedSave]);

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

  const getPositionPriority = (position: string) => {
    // Priority order for positions (higher number = higher priority)
    const priorities: Record<string, number> = {
      GK: 10,  // Goalkeeper is highest priority
      ST: 9,   // Strikers are next highest
      CB: 8,   // Center backs are important
      CDM: 7,  // Defensive mid
      CM: 6,   // Central mid
      CAM: 6,  // Attacking mid
      LW: 5,   // Wingers
      RW: 5,
      LM: 4,   // Wide midfielders
      RM: 4,
      LB: 3,   // Full backs
      RB: 3,
      // Generic positions have lower priority
      DEF: 2,
      MID: 1,
      ATT: 1
    };
    return priorities[position] || 0;
  };

  const isPositionCompatible = (playerPos: string, targetPos: string): boolean => {
    // Define position compatibility rules
    const compatibilityMap: Record<string, string[]> = {
      GK: ['GK'],
      CB: ['CB', 'DEF'],
      LB: ['LB', 'LWB', 'DEF'],
      RB: ['RB', 'RWB', 'DEF'],
      CDM: ['CDM', 'CM', 'MID'],
      CM: ['CM', 'CDM', 'CAM', 'MID'],
      CAM: ['CAM', 'CM', 'MID', 'ATT'],
      LM: ['LM', 'LW', 'MID'],
      RM: ['RM', 'RW', 'MID'],
      LW: ['LW', 'LM', 'ATT'],
      RW: ['RW', 'RM', 'ATT'],
      ST: ['ST', 'CF', 'ATT'],
      CF: ['CF', 'ST', 'CAM', 'ATT'],
      // Generic positions
      DEF: ['DEF', 'CB', 'LB', 'RB'],
      MID: ['MID', 'CM', 'CDM', 'CAM', 'LM', 'RM'],
      ATT: ['ATT', 'ST', 'CF', 'LW', 'RW']
    };

    return compatibilityMap[playerPos]?.includes(targetPos) || 
           compatibilityMap[targetPos]?.includes(playerPos) || 
           false;
  };

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
          // Check if player is already in reserves to prevent duplicates
          const isInReserves = reservePlayersList.some(p => p.id === draggedPlayer.id);
          if (!isInReserves) {
            setReservePlayersList(prev => [...prev, draggedPlayer]);
          }
          
          // Remove player from field position if they were on the field
          setAssignedPlayersList(prev => 
            prev.map(p => p.player?.id === draggedPlayer.id ? { ...p, player: null } : p)
          );
          
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          return;
        }

        // Rest of the field drop handling logic...
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

        if (!closestPosition || closestDistance > 0.2) {
          // If dropped too far from any position, treat as dropping to reserves
          const isInReserves = reservePlayersList.some(p => p.id === draggedPlayer.id);
          if (!isInReserves) {
            setReservePlayersList(prev => [...prev, draggedPlayer]);
          }
          setAssignedPlayersList(prev => 
            prev.map(p => p.player?.id === draggedPlayer.id ? { ...p, player: null } : p)
          );
          return;
        }

        const targetPlayer = assignedPlayersList[closestIndex]?.player;
        const sourceIndex = assignedPlayersList.findIndex(p => p.player?.id === draggedPlayer.id);

        if (sourceIndex === -1) {
          // Player is coming from reserves
          if (targetPlayer) {
            // Swap with existing player - ensure it's not already in reserves
            const isTargetInReserves = reservePlayersList.some(p => p.id === targetPlayer.id);
            if (!isTargetInReserves) {
              setReservePlayersList(prev => [...prev, targetPlayer]);
            }
          }
          setAssignedPlayersList(prev => 
            prev.map((p, i) => i === closestIndex ? { ...p, player: draggedPlayer } : p)
          );
          // Remove from reserves
          setReservePlayersList(prev => prev.filter(p => p.id !== draggedPlayer.id));
        } else {
          // Player is already on field
          setAssignedPlayersList(prev => {
            const newPlayers = [...prev];
            newPlayers[sourceIndex] = { 
              ...newPlayers[sourceIndex], 
              player: targetPlayer
            };
            newPlayers[closestIndex] = { 
              ...newPlayers[closestIndex], 
              player: draggedPlayer 
            };
            return newPlayers;
          });
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      });
    },
    [assignedPlayersList, reservePlayersList]
  );

  const handleAutoPlace = useCallback(() => {
    // Simply trigger the same logic as the useEffect by forcing a formation change
    setFormation(currentFormation => currentFormation);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showToast('Team positions reset', 'success');
  }, []);

  const handleAnalyzeTeam = async () => {
    if (!wonPlayers.length) {
      showToast('No players to analyze');
      return;
    }

    setIsAnalyzing(true);
    setIsAIDialogVisible(true);

    try {
      const playersWithPositions = assignedPlayersList
        .filter(ap => ap.player)
        .map(ap => ({
          player: {
            name: ap.player!.name,
            ovr: ap.player!.ovr,
            position: ap.player!.position,
          },
          position: ap.position.position,
        }));

      const analysis = await getTeamAnalysis(playersWithPositions);
      if (analysis.success && analysis.message) {
        setAiRating(analysis.message);
      } else {
        setAiRating(analysis.error || 'Unable to analyze team at this time.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze team';
      setAiRating(errorMessage);
      showToast(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleScreenshotPress = useCallback(async () => {
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
  }, [showToast]);

  const handleFieldLayout = useCallback((event: any) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    setFieldLayout({ x, y, width, height });
  }, []);

  useEffect(() => {
    return () => {
      if (screenshotRef.current?.capture) {
        // Cleanup any pending screenshot operations
        screenshotRef.current = null;
      }
    };
  }, []);

  if (isLoading || isLoadingFormation) {
    return (
      <LoadingState />
    );
  }

  return (
    <ErrorBoundaryWrapper>
      <ThemedView style={styles.container}>
        <ViewShot ref={screenshotRef} style={styles.container}>
          <ScrollView contentContainerStyle={styles.contentContainer}>
            <View style={[styles.header, { backgroundColor: theme.card }]}>
              <FormationSelector 
                formation={formation} 
                onFormationChange={(newFormation) => {
                  setFormation(newFormation);
                }} 
              />
              <View style={styles.headerActions}>
                <ThemedButton
                  title="Auto-Fill"
                  icon={<MaterialIcons name="auto-fix-high" size={24} color={theme.text} />}
                  onPress={handleAutoPlace}
                  variant="secondary"
                />
                <ThemedButton
                  title="Share"
                  icon={<MaterialIcons name="share" size={24} color={theme.text} />}
                  onPress={handleScreenshotPress}
                  variant="secondary"
                />
                <ThemedButton
                  title="Analyze"
                  icon={<MaterialIcons name="analytics" size={24} color={theme.text} />}
                  onPress={handleAnalyzeTeam}
                  variant="secondary"
                />
              </View>
            </View>

            {isLoading ? (
              <ActivityIndicator size="large" color={theme.text} style={{ marginTop: 20 }} />
            ) : (
              <>
                <View 
                  ref={fieldRef}
                  onLayout={handleFieldLayout}
                  style={[
                    styles.field,
                    { 
                      backgroundColor: isDark ? '#1A2327' : '#4CAF50',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.4)'
                    }
                  ]}
                >
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

                <View style={[styles.reserves, { backgroundColor: theme.card }]}>
                  <ThemedText type="subtitle" style={styles.reservesTitle}>Reserves</ThemedText>
                  <View style={styles.reservesList}>
                    {reservePlayersList.map((player) => (
                      <DraggablePlayer
                        key={player.id}
                        player={player}
                        isStarter={false}
                        onDragEnd={(coords) => handleDragEnd(coords, player)}
                      />
                    ))}
                  </View>
                </View>
              </>
            )}
          </ScrollView>
        </ViewShot>
        <AIRatingDialog
          visible={isAIDialogVisible}
          onClose={() => setIsAIDialogVisible(false)}
          rating={aiRating ?? 'Analyzing...'}
          loading={isAnalyzing}
        />
      </ThemedView>
    </ErrorBoundaryWrapper>
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
  contentContainer: {
    flexGrow: 1,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
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
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  formationButton: {
    minWidth: 60,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  screenshotButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    marginLeft: 8,
  },
  reserves: {
    width: '100%',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    maxWidth: FIELD_WIDTH,
    alignSelf: 'center',
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyPositionText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  field: {
    width: FIELD_WIDTH,
    height: FIELD_HEIGHT,
    marginVertical: 24,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'center',
    marginBottom: 40,
  },
  centerCircle: {
    position: 'absolute',
    width: FIELD_WIDTH * 0.3,
    height: FIELD_WIDTH * 0.3,
    borderRadius: FIELD_WIDTH * 0.15,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    left: '35%',
    top: '40%',
  },
  centerLine: {
    position: 'absolute',
    width: '100%',
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    top: '50%',
  },
  penaltyBox: {
    position: 'absolute',
    width: '40%',
    height: '20%',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    left: '30%',
    bottom: 0,
  },
  penaltyBoxTop: {
    position: 'absolute',
    width: '40%',
    height: '20%',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
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
    zIndex: 5,
  },
  positionIndicator: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  reserveDot: {
    width: PLAYER_DOT_SIZE,
    height: PLAYER_DOT_SIZE,
    borderRadius: PLAYER_DOT_SIZE / 2,
  },
  playerNameContainer: {
    position: 'absolute',
    top: PLAYER_DOT_SIZE + 4,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    width: PLAYER_NAME_WIDTH,
    left: PLAYER_DOT_SIZE / 2,
    transform: [{ translateX: -PLAYER_NAME_WIDTH / 2 }],
    zIndex: 10,
  },
  reservePlayerNameContainer: {
    top: PLAYER_DOT_SIZE + 4,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  playerName: {
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    marginTop: 6,
  },
  reservesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  reservesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  errorButton: {
    minWidth: 120,
    marginTop: 8,
  },
});

export default TeamsScreen;
