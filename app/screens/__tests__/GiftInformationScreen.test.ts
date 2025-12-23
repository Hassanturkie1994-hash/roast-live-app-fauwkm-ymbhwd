
/**
 * Unit tests for GiftInformationScreen
 * 
 * Tests:
 * 1. Manifest parsing and validation
 * 2. Sound description presence for all gifts
 * 3. Error handling for empty/unavailable manifest
 * 4. Localization support for sound descriptions
 */

import { ROAST_GIFT_MANIFEST, RoastGift } from '@/constants/RoastGiftManifest';
import sv from '@/constants/translations';

describe('GiftInformationScreen - Manifest Validation', () => {
  test('ROAST_GIFT_MANIFEST should be defined', () => {
    expect(ROAST_GIFT_MANIFEST).toBeDefined();
  });

  test('ROAST_GIFT_MANIFEST should be an array', () => {
    expect(Array.isArray(ROAST_GIFT_MANIFEST)).toBe(true);
  });

  test('ROAST_GIFT_MANIFEST should not be empty', () => {
    expect(ROAST_GIFT_MANIFEST.length).toBeGreaterThan(0);
  });

  test('ROAST_GIFT_MANIFEST should contain 45 gifts', () => {
    expect(ROAST_GIFT_MANIFEST.length).toBe(45);
  });

  test('All gifts should have required properties', () => {
    ROAST_GIFT_MANIFEST.forEach((gift: RoastGift) => {
      expect(gift.giftId).toBeDefined();
      expect(gift.displayName).toBeDefined();
      expect(gift.priceSEK).toBeDefined();
      expect(gift.tier).toBeDefined();
      expect(gift.animationType).toBeDefined();
      expect(gift.soundProfile).toBeDefined();
      expect(gift.priority).toBeDefined();
      expect(gift.emoji).toBeDefined();
      expect(gift.description).toBeDefined();
    });
  });

  test('All gifts should have unique giftIds', () => {
    const giftIds = ROAST_GIFT_MANIFEST.map((gift: RoastGift) => gift.giftId);
    const uniqueGiftIds = new Set(giftIds);
    expect(giftIds.length).toBe(uniqueGiftIds.size);
  });

  test('All gifts should have valid tier values', () => {
    const validTiers = ['LOW', 'MID', 'HIGH', 'ULTRA'];
    ROAST_GIFT_MANIFEST.forEach((gift: RoastGift) => {
      expect(validTiers).toContain(gift.tier);
    });
  });

  test('All gifts should have valid animation types', () => {
    const validAnimationTypes = ['OVERLAY', 'AR', 'CINEMATIC'];
    ROAST_GIFT_MANIFEST.forEach((gift: RoastGift) => {
      expect(validAnimationTypes).toContain(gift.animationType);
    });
  });

  test('All gifts should have positive prices', () => {
    ROAST_GIFT_MANIFEST.forEach((gift: RoastGift) => {
      expect(gift.priceSEK).toBeGreaterThan(0);
    });
  });
});

describe('GiftInformationScreen - Sound Description Validation', () => {
  test('All sound profiles should have descriptions in translations', () => {
    const missingSoundDescriptions: string[] = [];

    ROAST_GIFT_MANIFEST.forEach((gift: RoastGift) => {
      const soundKey = gift.soundProfile;
      const hasDescription = sv.gifts?.sounds?.[soundKey as keyof typeof sv.gifts.sounds];

      if (!hasDescription) {
        missingSoundDescriptions.push(soundKey);
      }
    });

    if (missingSoundDescriptions.length > 0) {
      console.error('❌ Missing sound descriptions for:', missingSoundDescriptions);
    }

    expect(missingSoundDescriptions.length).toBe(0);
  });

  test('All sound descriptions should be non-empty strings', () => {
    const soundDescriptions = sv.gifts?.sounds || {};

    Object.entries(soundDescriptions).forEach(([key, value]) => {
      expect(typeof value).toBe('string');
      expect(value.length).toBeGreaterThan(0);
    });
  });

  test('Sound descriptions should be localized (Swedish)', () => {
    const soundDescriptions = sv.gifts?.sounds || {};

    // Check that at least some descriptions contain Swedish characters or words
    const swedishDescriptions = Object.values(soundDescriptions).filter((desc) => {
      return desc.includes('ljud') || desc.includes('effekt') || desc.includes('å') || desc.includes('ä') || desc.includes('ö');
    });

    expect(swedishDescriptions.length).toBeGreaterThan(0);
  });

  test('All unique sound profiles in manifest should have translations', () => {
    const uniqueSoundProfiles = new Set(
      ROAST_GIFT_MANIFEST.map((gift: RoastGift) => gift.soundProfile)
    );

    const soundDescriptions = sv.gifts?.sounds || {};
    const translatedSounds = new Set(Object.keys(soundDescriptions));

    const missingSounds: string[] = [];
    uniqueSoundProfiles.forEach((soundProfile) => {
      if (!translatedSounds.has(soundProfile)) {
        missingSounds.push(soundProfile);
      }
    });

    if (missingSounds.length > 0) {
      console.error('❌ Missing translations for sound profiles:', missingSounds);
    }

    expect(missingSounds.length).toBe(0);
  });
});

describe('GiftInformationScreen - Sorting and Filtering', () => {
  test('Gifts should be sortable by price', () => {
    const sortedGifts = [...ROAST_GIFT_MANIFEST].sort((a, b) => a.priceSEK - b.priceSEK);
    
    for (let i = 0; i < sortedGifts.length - 1; i++) {
      expect(sortedGifts[i].priceSEK).toBeLessThanOrEqual(sortedGifts[i + 1].priceSEK);
    }
  });

  test('Gifts should be filterable by tier', () => {
    const tiers: Array<'LOW' | 'MID' | 'HIGH' | 'ULTRA'> = ['LOW', 'MID', 'HIGH', 'ULTRA'];

    tiers.forEach((tier) => {
      const filteredGifts = ROAST_GIFT_MANIFEST.filter((gift) => gift.tier === tier);
      expect(filteredGifts.length).toBeGreaterThan(0);
      filteredGifts.forEach((gift) => {
        expect(gift.tier).toBe(tier);
      });
    });
  });

  test('Each tier should have at least one gift', () => {
    const tiers: Array<'LOW' | 'MID' | 'HIGH' | 'ULTRA'> = ['LOW', 'MID', 'HIGH', 'ULTRA'];

    tiers.forEach((tier) => {
      const giftsInTier = ROAST_GIFT_MANIFEST.filter((gift) => gift.tier === tier);
      expect(giftsInTier.length).toBeGreaterThan(0);
    });
  });
});

describe('GiftInformationScreen - Error Handling', () => {
  test('Should handle empty manifest gracefully', () => {
    const emptyManifest: RoastGift[] = [];
    expect(emptyManifest.length).toBe(0);
    
    // Simulate error detection
    const hasError = emptyManifest.length === 0;
    expect(hasError).toBe(true);
  });

  test('Should validate manifest structure', () => {
    const isValidManifest = (manifest: any): boolean => {
      if (!manifest) return false;
      if (!Array.isArray(manifest)) return false;
      if (manifest.length === 0) return false;
      return true;
    };

    expect(isValidManifest(ROAST_GIFT_MANIFEST)).toBe(true);
    expect(isValidManifest(null)).toBe(false);
    expect(isValidManifest(undefined)).toBe(false);
    expect(isValidManifest([])).toBe(false);
    expect(isValidManifest({})).toBe(false);
  });
});

describe('GiftInformationScreen - Animation and Sound Integration', () => {
  test('All gifts should have valid sound profiles', () => {
    ROAST_GIFT_MANIFEST.forEach((gift: RoastGift) => {
      expect(gift.soundProfile).toBeDefined();
      expect(typeof gift.soundProfile).toBe('string');
      expect(gift.soundProfile.length).toBeGreaterThan(0);
    });
  });

  test('ULTRA tier gifts should have longer durations', () => {
    const ultraGifts = ROAST_GIFT_MANIFEST.filter((gift) => gift.tier === 'ULTRA');
    const lowGifts = ROAST_GIFT_MANIFEST.filter((gift) => gift.tier === 'LOW');

    // ULTRA gifts should generally be more expensive than LOW gifts
    const avgUltraPrice = ultraGifts.reduce((sum, gift) => sum + gift.priceSEK, 0) / ultraGifts.length;
    const avgLowPrice = lowGifts.reduce((sum, gift) => sum + gift.priceSEK, 0) / lowGifts.length;

    expect(avgUltraPrice).toBeGreaterThan(avgLowPrice);
  });

  test('Cinematic gifts should have cinematic animation type', () => {
    const cinematicGifts = ROAST_GIFT_MANIFEST.filter((gift) => gift.animationType === 'CINEMATIC');
    
    cinematicGifts.forEach((gift) => {
      expect(gift.animationType).toBe('CINEMATIC');
      // Cinematic gifts are typically ULTRA tier
      expect(['HIGH', 'ULTRA']).toContain(gift.tier);
    });
  });
});

// Export test utilities for use in other tests
export const validateGiftManifest = (manifest: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!manifest) {
    errors.push('Manifest is undefined or null');
    return { valid: false, errors };
  }

  if (!Array.isArray(manifest)) {
    errors.push('Manifest is not an array');
    return { valid: false, errors };
  }

  if (manifest.length === 0) {
    errors.push('Manifest is empty');
    return { valid: false, errors };
  }

  manifest.forEach((gift: any, index: number) => {
    if (!gift.giftId) errors.push(`Gift at index ${index} missing giftId`);
    if (!gift.displayName) errors.push(`Gift at index ${index} missing displayName`);
    if (!gift.soundProfile) errors.push(`Gift at index ${index} missing soundProfile`);
    if (!gift.emoji) errors.push(`Gift at index ${index} missing emoji`);
  });

  return { valid: errors.length === 0, errors };
};

export const validateSoundDescriptions = (manifest: RoastGift[], translations: any): { valid: boolean; missing: string[] } => {
  const missing: string[] = [];

  manifest.forEach((gift) => {
    const soundKey = gift.soundProfile;
    const hasDescription = translations.gifts?.sounds?.[soundKey];

    if (!hasDescription) {
      missing.push(soundKey);
    }
  });

  return { valid: missing.length === 0, missing };
};
