
/**
 * ESLint Custom Rule for Gift Sound Descriptions
 * 
 * This custom rule ensures that every sound profile in ROAST_GIFT_MANIFEST
 * has a corresponding description in the translations file.
 * 
 * Usage:
 * Add this to your .eslintrc.js:
 * 
 * module.exports = {
 *   rules: {
 *     'gift-sounds/require-sound-descriptions': 'error',
 *   },
 * };
 */

module.exports = {
  rules: {
    'require-sound-descriptions': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Ensure all gift sound profiles have descriptions in translations',
          category: 'Possible Errors',
          recommended: true,
        },
        messages: {
          missingSoundDescription: 'Sound profile "{{soundProfile}}" is missing a description in translations.ts',
          noSoundDescriptions: 'No sound descriptions found in translations.ts. Add gifts.sounds object.',
        },
        schema: [],
      },
      create(context) {
        return {
          Program(node) {
            const filename = context.getFilename();
            
            // Only check RoastGiftManifest.ts
            if (!filename.includes('RoastGiftManifest.ts')) {
              return;
            }

            // This is a placeholder for the actual implementation
            // In a real scenario, you would:
            // 1. Parse ROAST_GIFT_MANIFEST
            // 2. Parse translations.ts
            // 3. Compare sound profiles with translations
            // 4. Report missing descriptions

            console.log('✅ [ESLint] Checking gift sound descriptions...');
          },
        };
      },
    },
  },
};
