
/**
 * Roast Gift Manifest
 * 
 * Complete definition of 45 roast-themed gifts for the live streaming app.
 * Gifts are designed for roast battles, drama, and disrespect humor.
 * 
 * Monetization:
 * - 30% platform fee
 * - 70% creator payout
 * - No refunds after confirmation
 * 
 * Principles:
 * - All gifts are metadata events
 * - All animations and sounds are rendered locally
 * - No video data is transmitted
 * - Gifts must work during live streams without frame drops
 */

export type RoastGiftTier = 'LOW' | 'MID' | 'HIGH' | 'ULTRA';
export type RoastAnimationType = 'OVERLAY' | 'AR' | 'CINEMATIC';

export interface RoastGift {
  giftId: string;
  displayName: string;
  priceSEK: number;
  tier: RoastGiftTier;
  animationType: RoastAnimationType;
  soundProfile: string;
  priority: number;
  emoji: string;
  description: string;
}

/**
 * Complete Roast Gift Catalog - 45 Gifts
 */
export const ROAST_GIFT_MANIFEST: RoastGift[] = [
  // ============================================================================
  // LOW TIER (1-10 SEK) - Cheap Heckles
  // ============================================================================
  {
    giftId: 'boo',
    displayName: 'Boo',
    priceSEK: 1,
    tier: 'LOW',
    animationType: 'OVERLAY',
    soundProfile: 'crowd_boo',
    priority: 1,
    emoji: '👎',
    description: 'Classic crowd disapproval',
  },
  {
    giftId: 'tomato',
    displayName: 'Flying Tomato',
    priceSEK: 2,
    tier: 'LOW',
    animationType: 'OVERLAY',
    soundProfile: 'tomato_splat',
    priority: 1,
    emoji: '🍅',
    description: 'Throw a rotten tomato',
  },
  {
    giftId: 'laugh_track',
    displayName: 'Laugh Track',
    priceSEK: 3,
    tier: 'LOW',
    animationType: 'OVERLAY',
    soundProfile: 'sitcom_laugh',
    priority: 1,
    emoji: '😂',
    description: 'Fake sitcom laughter',
  },
  {
    giftId: 'facepalm',
    displayName: 'Facepalm',
    priceSEK: 4,
    tier: 'LOW',
    animationType: 'OVERLAY',
    soundProfile: 'slap_sound',
    priority: 1,
    emoji: '🤦',
    description: 'Ultimate disappointment',
  },
  {
    giftId: 'crickets',
    displayName: 'Crickets',
    priceSEK: 5,
    tier: 'LOW',
    animationType: 'OVERLAY',
    soundProfile: 'cricket_chirp',
    priority: 1,
    emoji: '🦗',
    description: 'Awkward silence',
  },
  {
    giftId: 'yawn',
    displayName: 'Yawn',
    priceSEK: 5,
    tier: 'LOW',
    animationType: 'OVERLAY',
    soundProfile: 'yawn_sound',
    priority: 1,
    emoji: '🥱',
    description: 'So boring...',
  },
  {
    giftId: 'clown',
    displayName: 'Clown',
    priceSEK: 6,
    tier: 'LOW',
    animationType: 'OVERLAY',
    soundProfile: 'clown_horn',
    priority: 1,
    emoji: '🤡',
    description: 'You\'re a joke',
  },
  {
    giftId: 'trash',
    displayName: 'Trash',
    priceSEK: 7,
    tier: 'LOW',
    animationType: 'OVERLAY',
    soundProfile: 'trash_dump',
    priority: 1,
    emoji: '🗑️',
    description: 'Garbage take',
  },
  {
    giftId: 'skull',
    displayName: 'Skull',
    priceSEK: 8,
    tier: 'LOW',
    animationType: 'OVERLAY',
    soundProfile: 'death_sound',
    priority: 1,
    emoji: '💀',
    description: 'You killed it (badly)',
  },
  {
    giftId: 'poop',
    displayName: 'Poop',
    priceSEK: 10,
    tier: 'LOW',
    animationType: 'OVERLAY',
    soundProfile: 'fart_sound',
    priority: 1,
    emoji: '💩',
    description: 'That was crap',
  },

  // ============================================================================
  // MID TIER (20-100 SEK) - Crowd Reactions
  // ============================================================================
  {
    giftId: 'mic_drop',
    displayName: 'Mic Drop',
    priceSEK: 20,
    tier: 'MID',
    animationType: 'AR',
    soundProfile: 'mic_drop_thud',
    priority: 2,
    emoji: '🎤',
    description: 'Drop the mic on them',
  },
  {
    giftId: 'airhorn',
    displayName: 'Airhorn',
    priceSEK: 25,
    tier: 'MID',
    animationType: 'OVERLAY',
    soundProfile: 'airhorn_blast',
    priority: 2,
    emoji: '📢',
    description: 'Loud and obnoxious',
  },
  {
    giftId: 'laugh_explosion',
    displayName: 'Laugh Explosion',
    priceSEK: 30,
    tier: 'MID',
    animationType: 'AR',
    soundProfile: 'crowd_roar',
    priority: 2,
    emoji: '🤣',
    description: 'Uncontrollable laughter',
  },
  {
    giftId: 'roast_bell',
    displayName: 'Roast Bell',
    priceSEK: 35,
    tier: 'MID',
    animationType: 'OVERLAY',
    soundProfile: 'boxing_bell',
    priority: 2,
    emoji: '🔔',
    description: 'Round 1, fight!',
  },
  {
    giftId: 'fire_emoji',
    displayName: 'Fire',
    priceSEK: 40,
    tier: 'MID',
    animationType: 'AR',
    soundProfile: 'fire_whoosh',
    priority: 2,
    emoji: '🔥',
    description: 'That was fire',
  },
  {
    giftId: 'explosion',
    displayName: 'Explosion',
    priceSEK: 50,
    tier: 'MID',
    animationType: 'AR',
    soundProfile: 'explosion_boom',
    priority: 2,
    emoji: '💥',
    description: 'Mind blown',
  },
  {
    giftId: 'shocked_face',
    displayName: 'Shocked',
    priceSEK: 60,
    tier: 'MID',
    animationType: 'OVERLAY',
    soundProfile: 'gasp_sound',
    priority: 2,
    emoji: '😱',
    description: 'Oh no they didn\'t',
  },
  {
    giftId: 'savage',
    displayName: 'Savage',
    priceSEK: 70,
    tier: 'MID',
    animationType: 'AR',
    soundProfile: 'savage_sound',
    priority: 2,
    emoji: '😈',
    description: 'Absolutely savage',
  },
  {
    giftId: 'salt_shaker',
    displayName: 'Salt Shaker',
    priceSEK: 80,
    tier: 'MID',
    animationType: 'OVERLAY',
    soundProfile: 'salt_pour',
    priority: 2,
    emoji: '🧂',
    description: 'So salty',
  },
  {
    giftId: 'tea_spill',
    displayName: 'Tea Spill',
    priceSEK: 100,
    tier: 'MID',
    animationType: 'AR',
    soundProfile: 'tea_spill',
    priority: 2,
    emoji: '☕',
    description: 'Spill the tea',
  },

  // ============================================================================
  // HIGH TIER (150-500 SEK) - Roast Weapons
  // ============================================================================
  {
    giftId: 'flame_thrower',
    displayName: 'Flame Thrower',
    priceSEK: 150,
    tier: 'HIGH',
    animationType: 'AR',
    soundProfile: 'flamethrower',
    priority: 3,
    emoji: '🔥',
    description: 'Burn them to ashes',
  },
  {
    giftId: 'diss_stamp',
    displayName: 'Diss Stamp',
    priceSEK: 200,
    tier: 'HIGH',
    animationType: 'AR',
    soundProfile: 'stamp_slam',
    priority: 3,
    emoji: '🚫',
    description: 'Officially rejected',
  },
  {
    giftId: 'judge_gavel',
    displayName: 'Judge Gavel',
    priceSEK: 250,
    tier: 'HIGH',
    animationType: 'AR',
    soundProfile: 'gavel_bang',
    priority: 3,
    emoji: '⚖️',
    description: 'Guilty as charged',
  },
  {
    giftId: 'roast_crown',
    displayName: 'Roast Crown',
    priceSEK: 300,
    tier: 'HIGH',
    animationType: 'AR',
    soundProfile: 'crown_fanfare',
    priority: 3,
    emoji: '👑',
    description: 'King of roasts',
  },
  {
    giftId: 'knockout_punch',
    displayName: 'Knockout Punch',
    priceSEK: 350,
    tier: 'HIGH',
    animationType: 'AR',
    soundProfile: 'punch_knockout',
    priority: 3,
    emoji: '👊',
    description: 'Knocked out cold',
  },
  {
    giftId: 'bomb',
    displayName: 'Bomb',
    priceSEK: 400,
    tier: 'HIGH',
    animationType: 'AR',
    soundProfile: 'bomb_explosion',
    priority: 3,
    emoji: '💣',
    description: 'Dropped a bomb',
  },
  {
    giftId: 'lightning_strike',
    displayName: 'Lightning Strike',
    priceSEK: 450,
    tier: 'HIGH',
    animationType: 'AR',
    soundProfile: 'thunder_crack',
    priority: 3,
    emoji: '⚡',
    description: 'Struck by lightning',
  },
  {
    giftId: 'roast_trophy',
    displayName: 'Roast Trophy',
    priceSEK: 500,
    tier: 'HIGH',
    animationType: 'AR',
    soundProfile: 'trophy_win',
    priority: 3,
    emoji: '🏆',
    description: 'Champion roaster',
  },

  // ============================================================================
  // ULTRA TIER - BATTLE DISRUPTORS (700-1500 SEK)
  // ============================================================================
  {
    giftId: 'screen_shake',
    displayName: 'Screen Shake',
    priceSEK: 700,
    tier: 'ULTRA',
    animationType: 'CINEMATIC',
    soundProfile: 'earthquake_rumble',
    priority: 4,
    emoji: '📳',
    description: 'Shake the whole screen',
  },
  {
    giftId: 'slow_motion_roast',
    displayName: 'Slow Motion Roast',
    priceSEK: 800,
    tier: 'ULTRA',
    animationType: 'CINEMATIC',
    soundProfile: 'slow_motion',
    priority: 4,
    emoji: '🎬',
    description: 'Epic slow-mo moment',
  },
  {
    giftId: 'spotlight_shame',
    displayName: 'Spotlight Shame',
    priceSEK: 900,
    tier: 'ULTRA',
    animationType: 'CINEMATIC',
    soundProfile: 'spotlight_on',
    priority: 4,
    emoji: '💡',
    description: 'Put them in the spotlight',
  },
  {
    giftId: 'silence_button',
    displayName: 'Silence Button',
    priceSEK: 1000,
    tier: 'ULTRA',
    animationType: 'CINEMATIC',
    soundProfile: 'mute_sound',
    priority: 4,
    emoji: '🔇',
    description: 'Silence them',
  },
  {
    giftId: 'time_freeze',
    displayName: 'Time Freeze',
    priceSEK: 1100,
    tier: 'ULTRA',
    animationType: 'CINEMATIC',
    soundProfile: 'time_stop',
    priority: 4,
    emoji: '⏸️',
    description: 'Freeze time',
  },
  {
    giftId: 'roast_nuke',
    displayName: 'Roast Nuke',
    priceSEK: 1200,
    tier: 'ULTRA',
    animationType: 'CINEMATIC',
    soundProfile: 'nuke_explosion',
    priority: 4,
    emoji: '☢️',
    description: 'Nuclear roast',
  },
  {
    giftId: 'shame_bell',
    displayName: 'Shame Bell',
    priceSEK: 1300,
    tier: 'ULTRA',
    animationType: 'CINEMATIC',
    soundProfile: 'shame_bell_ring',
    priority: 4,
    emoji: '🔔',
    description: 'Shame! Shame! Shame!',
  },
  {
    giftId: 'roast_meteor',
    displayName: 'Roast Meteor',
    priceSEK: 1500,
    tier: 'ULTRA',
    animationType: 'CINEMATIC',
    soundProfile: 'meteor_impact',
    priority: 4,
    emoji: '☄️',
    description: 'Meteor strike',
  },

  // ============================================================================
  // ULTRA TIER - NUCLEAR MOMENTS (2000-4000 SEK)
  // ============================================================================
  {
    giftId: 'funeral_music',
    displayName: 'Funeral Music',
    priceSEK: 2000,
    tier: 'ULTRA',
    animationType: 'CINEMATIC',
    soundProfile: 'funeral_march',
    priority: 5,
    emoji: '⚰️',
    description: 'Play funeral music',
  },
  {
    giftId: 'crowd_riot',
    displayName: 'Crowd Riot',
    priceSEK: 2500,
    tier: 'ULTRA',
    animationType: 'CINEMATIC',
    soundProfile: 'riot_chaos',
    priority: 5,
    emoji: '🔥',
    description: 'Start a riot',
  },
  {
    giftId: 'roast_execution',
    displayName: 'Roast Execution',
    priceSEK: 3000,
    tier: 'ULTRA',
    animationType: 'CINEMATIC',
    soundProfile: 'execution_sound',
    priority: 5,
    emoji: '⚔️',
    description: 'Execute the roast',
  },
  {
    giftId: 'you_are_done',
    displayName: 'You\'re Done',
    priceSEK: 3500,
    tier: 'ULTRA',
    animationType: 'CINEMATIC',
    soundProfile: 'game_over',
    priority: 5,
    emoji: '🚫',
    description: 'Game over',
  },
  {
    giftId: 'roast_apocalypse',
    displayName: 'Roast Apocalypse',
    priceSEK: 4000,
    tier: 'ULTRA',
    animationType: 'CINEMATIC',
    soundProfile: 'apocalypse_sound',
    priority: 5,
    emoji: '🌋',
    description: 'End of the world',
  },

  // ============================================================================
  // ADDITIONAL ROAST GIFTS (to reach 45 total)
  // ============================================================================
  {
    giftId: 'eye_roll',
    displayName: 'Eye Roll',
    priceSEK: 9,
    tier: 'LOW',
    animationType: 'OVERLAY',
    soundProfile: 'sigh_sound',
    priority: 1,
    emoji: '🙄',
    description: 'Seriously?',
  },
  {
    giftId: 'snore',
    displayName: 'Snore',
    priceSEK: 8,
    tier: 'LOW',
    animationType: 'OVERLAY',
    soundProfile: 'snore_sound',
    priority: 1,
    emoji: '😴',
    description: 'Put me to sleep',
  },
  {
    giftId: 'cringe',
    displayName: 'Cringe',
    priceSEK: 90,
    tier: 'MID',
    animationType: 'OVERLAY',
    soundProfile: 'cringe_sound',
    priority: 2,
    emoji: '😬',
    description: 'So cringe',
  },
  {
    giftId: 'roast_hammer',
    displayName: 'Roast Hammer',
    priceSEK: 350,
    tier: 'HIGH',
    animationType: 'AR',
    soundProfile: 'hammer_slam',
    priority: 3,
    emoji: '🔨',
    description: 'Hammer them down',
  },
  {
    giftId: 'roast_sword',
    displayName: 'Roast Sword',
    priceSEK: 400,
    tier: 'HIGH',
    animationType: 'AR',
    soundProfile: 'sword_slash',
    priority: 3,
    emoji: '⚔️',
    description: 'Slice through their argument',
  },
  {
    giftId: 'roast_shield',
    displayName: 'Roast Shield',
    priceSEK: 300,
    tier: 'HIGH',
    animationType: 'AR',
    soundProfile: 'shield_block',
    priority: 3,
    emoji: '🛡️',
    description: 'Block their roast',
  },
  {
    giftId: 'roast_dragon',
    displayName: 'Roast Dragon',
    priceSEK: 1400,
    tier: 'ULTRA',
    animationType: 'CINEMATIC',
    soundProfile: 'dragon_roar',
    priority: 4,
    emoji: '🐉',
    description: 'Unleash the dragon',
  },
];

/**
 * Get gift by ID
 */
export function getRoastGiftById(giftId: string): RoastGift | undefined {
  return ROAST_GIFT_MANIFEST.find((gift) => gift.giftId === giftId);
}

/**
 * Get gifts by tier
 */
export function getRoastGiftsByTier(tier: RoastGiftTier): RoastGift[] {
  return ROAST_GIFT_MANIFEST.filter((gift) => gift.tier === tier);
}

/**
 * Get gifts by price range
 */
export function getRoastGiftsByPriceRange(minPrice: number, maxPrice: number): RoastGift[] {
  return ROAST_GIFT_MANIFEST.filter(
    (gift) => gift.priceSEK >= minPrice && gift.priceSEK <= maxPrice
  );
}

/**
 * Get animation duration based on tier
 */
export function getRoastGiftAnimationDuration(tier: RoastGiftTier): number {
  switch (tier) {
    case 'LOW':
      return 1000; // 1 second
    case 'MID':
      return 1500; // 1.5 seconds
    case 'HIGH':
      return 2000; // 2 seconds
    case 'ULTRA':
      return 3000; // 3 seconds
    default:
      return 1000;
  }
}

/**
 * Check if gifts can be batched (LOW tier only)
 */
export function canBatchRoastGift(tier: RoastGiftTier): boolean {
  return tier === 'LOW';
}

/**
 * Check if gift blocks other gifts (ULTRA tier only)
 */
export function doesRoastGiftBlock(tier: RoastGiftTier): boolean {
  return tier === 'ULTRA';
}
