import { Player } from '../types/player';

type PlayerTier = 'Elite' | 'Gold' | 'Silver' | 'Bronze';

export const getTier = (ovr: number): PlayerTier => {
  if (ovr >= 89) return 'Elite';
  if (ovr >= 83) return 'Gold';
  if (ovr >= 79) return 'Silver';
  return 'Bronze';
};

/**
 * Calculate minimum bid based on player tier
 * @param tier Player's tier (Elite, Gold, Silver, Bronze)
 * @returns Minimum bid in Ghanta Coins (GC)
 */
export const calculateMinBid = (tier: PlayerTier): number => {
  console.log('Calculating min bid for tier:', tier);
  switch (tier) {
    case 'Elite':
      return 60;
    case 'Gold':
      return 50;
    case 'Silver':
      return 30;
    case 'Bronze':
      return 10;
    default:
      console.warn('Unknown player tier:', tier);
      return 10; // Default to Bronze tier minimum
  }
};
