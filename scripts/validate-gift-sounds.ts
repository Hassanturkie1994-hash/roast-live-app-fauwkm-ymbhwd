
/**
 * Gift Sound Description Validator
 * 
 * This script validates that all gift sound profiles have corresponding
 * descriptions in the translations file.
 * 
 * Run with: npx ts-node scripts/validate-gift-sounds.ts
 * Or add to package.json scripts: "validate:gifts": "ts-node scripts/validate-gift-sounds.ts"
 */

import { ROAST_GIFT_MANIFEST, RoastGift } from '../constants/RoastGiftManifest';
import sv from '../constants/translations';

interface ValidationResult {
  valid: boolean;
  totalGifts: number;
  uniqueSoundProfiles: number;
  missingSoundDescriptions: string[];
  duplicateSoundProfiles: string[];
  errors: string[];
}

function validateGiftSoundDescriptions(): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    totalGifts: 0,
    uniqueSoundProfiles: 0,
    missingSoundDescriptions: [],
    duplicateSoundProfiles: [],
    errors: [],
  };

  console.log('🔍 Validating gift sound descriptions...\n');

  // Check if manifest exists
  if (!ROAST_GIFT_MANIFEST) {
    result.valid = false;
    result.errors.push('ROAST_GIFT_MANIFEST is undefined');
    return result;
  }

  if (!Array.isArray(ROAST_GIFT_MANIFEST)) {
    result.valid = false;
    result.errors.push('ROAST_GIFT_MANIFEST is not an array');
    return result;
  }

  if (ROAST_GIFT_MANIFEST.length === 0) {
    result.valid = false;
    result.errors.push('ROAST_GIFT_MANIFEST is empty');
    return result;
  }

  result.totalGifts = ROAST_GIFT_MANIFEST.length;
  console.log(`✅ Found ${result.totalGifts} gifts in manifest`);

  // Collect all sound profiles
  const soundProfiles: string[] = [];
  const soundProfileCounts: Record<string, number> = {};

  ROAST_GIFT_MANIFEST.forEach((gift: RoastGift) => {
    const soundProfile = gift.soundProfile;
    soundProfiles.push(soundProfile);
    soundProfileCounts[soundProfile] = (soundProfileCounts[soundProfile] || 0) + 1;
  });

  // Check for duplicates (multiple gifts using same sound)
  Object.entries(soundProfileCounts).forEach(([profile, count]) => {
    if (count > 1) {
      result.duplicateSoundProfiles.push(`${profile} (used ${count} times)`);
    }
  });

  const uniqueSoundProfiles = new Set(soundProfiles);
  result.uniqueSoundProfiles = uniqueSoundProfiles.size;
  console.log(`✅ Found ${result.uniqueSoundProfiles} unique sound profiles`);

  if (result.duplicateSoundProfiles.length > 0) {
    console.log(`ℹ️  ${result.duplicateSoundProfiles.length} sound profiles are reused across multiple gifts`);
  }

  // Check translations
  const soundDescriptions = sv.gifts?.sounds;

  if (!soundDescriptions) {
    result.valid = false;
    result.errors.push('No sound descriptions found in translations.ts (gifts.sounds is undefined)');
    return result;
  }

  console.log(`✅ Found sound descriptions in translations\n`);

  // Validate each sound profile has a description
  console.log('🔍 Checking for missing sound descriptions...\n');

  uniqueSoundProfiles.forEach((soundProfile) => {
    const description = soundDescriptions[soundProfile as keyof typeof soundDescriptions];

    if (!description) {
      result.missingSoundDescriptions.push(soundProfile);
      result.valid = false;
    }
  });

  // Report results
  if (result.missingSoundDescriptions.length > 0) {
    console.error('❌ VALIDATION FAILED\n');
    console.error(`Missing sound descriptions for ${result.missingSoundDescriptions.length} sound profiles:\n`);
    result.missingSoundDescriptions.forEach((profile) => {
      console.error(`  - ${profile}`);
    });
    console.error('\n💡 Add these sound descriptions to constants/translations.ts under gifts.sounds\n');
  } else {
    console.log('✅ VALIDATION PASSED\n');
    console.log('All sound profiles have descriptions in translations!\n');
  }

  // Summary
  console.log('📊 Summary:');
  console.log(`  Total gifts: ${result.totalGifts}`);
  console.log(`  Unique sound profiles: ${result.uniqueSoundProfiles}`);
  console.log(`  Missing descriptions: ${result.missingSoundDescriptions.length}`);
  console.log(`  Reused sound profiles: ${result.duplicateSoundProfiles.length}`);
  console.log(`  Validation status: ${result.valid ? '✅ PASS' : '❌ FAIL'}\n`);

  return result;
}

// Run validation
const result = validateGiftSoundDescriptions();

// Exit with error code if validation failed
if (!result.valid) {
  process.exit(1);
}

export default validateGiftSoundDescriptions;
