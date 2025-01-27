/**
 * Calculate minimum bid based on player tier
 * @param tier Player's tier (Elite, Gold, Silver, Bronze)
 * @returns Minimum bid in Ghanta Coins (GC)
 */
export const calculateMinBid = (tier: string): number => {
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
      return 10; // Default to Bronze tier minimum
  }
};
