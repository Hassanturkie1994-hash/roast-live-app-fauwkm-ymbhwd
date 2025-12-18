
/**
 * Season Helper Utilities
 * 
 * Utility functions for working with seasons and rankings.
 */

/**
 * Format season score for display
 */
export function formatSeasonScore(score: number): string {
  if (score >= 1000000) {
    return `${(score / 1000000).toFixed(1)}M`;
  } else if (score >= 1000) {
    return `${(score / 1000).toFixed(1)}K`;
  }
  return Math.round(score).toString();
}

/**
 * Get tier color
 */
export function getTierColor(tierName: string | null): string {
  if (!tierName) return '#CCCCCC';
  
  const tierColors: Record<string, string> = {
    'Bronze Mouth': '#CD7F32',
    'Silver Tongue': '#C0C0C0',
    'Golden Roast': '#FFD700',
    'Diamond Disrespect': '#B9F2FF',
    'Legendary Menace': '#FF0000',
  };

  return tierColors[tierName] || '#CCCCCC';
}

/**
 * Get tier icon
 */
export function getTierIcon(tierName: string | null): string {
  if (!tierName) return '🏅';
  
  const tierIcons: Record<string, string> = {
    'Bronze Mouth': '🥉',
    'Silver Tongue': '🥈',
    'Golden Roast': '🥇',
    'Diamond Disrespect': '💎',
    'Legendary Menace': '👑',
  };

  return tierIcons[tierName] || '🏅';
}

/**
 * Get level tier name
 */
export function getLevelTierName(level: number): string {
  if (level >= 50) return 'Legendary';
  if (level >= 40) return 'Master';
  if (level >= 30) return 'Expert';
  if (level >= 20) return 'Advanced';
  if (level >= 10) return 'Intermediate';
  return 'Beginner';
}

/**
 * Get level tier color
 */
export function getLevelTierColor(level: number): string {
  if (level >= 50) return '#FF0000';
  if (level >= 40) return '#FF1493';
  if (level >= 30) return '#FFD700';
  if (level >= 20) return '#C0C0C0';
  if (level >= 10) return '#CD7F32';
  return '#CCCCCC';
}

/**
 * Calculate XP for a given level
 */
export function calculateXPForLevel(level: number): number {
  return Math.floor(1000 * Math.pow(1.15, level - 1));
}

/**
 * Calculate total XP needed to reach a level
 */
export function calculateTotalXPForLevel(level: number): number {
  let totalXP = 0;
  for (let i = 1; i < level; i++) {
    totalXP += calculateXPForLevel(i);
  }
  return totalXP;
}

/**
 * Format XP amount
 */
export function formatXP(xp: number): string {
  if (xp >= 1000000) {
    return `${(xp / 1000000).toFixed(1)}M`;
  } else if (xp >= 1000) {
    return `${(xp / 1000).toFixed(1)}K`;
  }
  return xp.toString();
}

/**
 * Get perk icon for display
 */
export function getPerkIcon(perkType: string): string {
  switch (perkType) {
    case 'cosmetic':
      return '✨';
    case 'ux':
      return '🎨';
    case 'analytics':
      return '📊';
    case 'priority':
      return '⚡';
    default:
      return '🎁';
  }
}

/**
 * Calculate level progress percentage
 */
export function getLevelProgress(currentXP: number, xpToNext: number): number {
  if (xpToNext === 0) return 100;
  return Math.min(100, Math.round((currentXP / xpToNext) * 100));
}

/**
 * Check if creator is near rank-up
 */
export function isNearRankUp(progressToNextTier: number): boolean {
  return progressToNextTier >= 90;
}

/**
 * Get rank percentile description
 */
export function getPercentileDescription(percentile: number): string {
  if (percentile >= 99) return 'Top 1%';
  if (percentile >= 95) return 'Top 5%';
  if (percentile >= 90) return 'Top 10%';
  if (percentile >= 75) return 'Top 25%';
  if (percentile >= 50) return 'Top 50%';
  return `Top ${Math.round(100 - percentile)}%`;
}

/**
 * Calculate days remaining in season
 */
export function getDaysRemainingInSeason(endDate: string): number {
  const end = new Date(endDate).getTime();
  const now = new Date().getTime();
  const diff = end - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Format season date range
 */
export function formatSeasonDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const end = new Date(endDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `${start} - ${end}`;
}

/**
 * Get win rate percentage
 */
export function getWinRate(wins: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((wins / total) * 100);
}

/**
 * Get win rate color
 */
export function getWinRateColor(winRate: number): string {
  if (winRate >= 70) return '#4CAF50';
  if (winRate >= 50) return '#FFD700';
  if (winRate >= 30) return '#FFA500';
  return '#FF6B6B';
}
