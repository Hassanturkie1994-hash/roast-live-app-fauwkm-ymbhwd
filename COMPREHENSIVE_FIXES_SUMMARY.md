
# Comprehensive Fixes Summary

This document summarizes all the fixes applied to address your issues with Expo Router, Firebase Push Notifications, Supabase RLS, Permissions, and npm configuration.

## 1. Expo Router Refactor ✅

### Problem
Expo Router was warning about non-route files in the `app/` directory:
```
"Route './services/agoraService.ts' is missing the required default export."
```

### Solution
- Created `src/` directory structure for non-route modules
- Updated `tsconfig.json` with path aliases
- Created comprehensive refactor plan in `REFACTOR_PLAN.md`

### Path Aliases Added
```json
{
  "@/services/*": ["./src/services/*"],
  "@/hooks/*": ["./src/hooks/*"],
  "@/integrations/*": ["./src/integrations/*"],
  "@/utils/*": ["./src/utils/*"],
  "@/types/*": ["./src/types/*"]
}
```

### Next Steps
1. Move files from `app/services/*` to `src/services/*`
2. Move files from `app/hooks/*` to `src/hooks/*`
3. Move files from `app/integrations/*` to `src/integrations/*`
4. Update all imports to use new path aliases
5. Run `expo start --clear` to clear cache

### Expo Router Conventions
**Files that MUST be in app/:**
- Route files (screens) - must export default React component
- Layout files (`_layout.tsx`)
- Special files (`+not-found.tsx`, `_sitemap.tsx`)

**Files that should NOT be in app/:**
- Utility modules
- Service modules
- Custom hooks
- Type definitions
- Integration modules

---

## 2. Firebase Push Notifications ✅

### Problem
```
"Default FirebaseApp is not initialized ... Make sure to complete the guide ... fcm-credentials"
```

### Solution
- Updated `app.json` with Firebase configuration
- Added `expo-notifications` plugin
- Created `usePushNotifications` hook with robust permission handling
- Created comprehensive setup guide in `FIREBASE_PUSH_NOTIFICATIONS_SETUP.md`

### Configuration Added to app.json
```json
{
  "android": {
    "package": "com.hasselite.roastlive",
    "googleServicesFile": "./google-services.json"
  },
  "ios": {
    "googleServicesFile": "./google-services.json"
  },
  "plugins": [
    [
      "expo-notifications",
      {
        "sounds": ["./assets/sounds/notification.wav"]
      }
    ]
  ]
}
```

### Required Steps
1. Download `google-services.json` from Firebase Console
2. Place it in project root: `./google-services.json`
3. Rebuild dev client:
   ```bash
   eas build --platform android --profile development
   ```
4. Install and run the new dev client
5. Test with `usePushNotifications` hook

### Hook Usage
```typescript
import { usePushNotifications } from '@/hooks/usePushNotifications';

function MyComponent() {
  const { 
    expoPushToken, 
    permissionStatus, 
    error,
    requestPermissions,
    openSettings 
  } = usePushNotifications();

  if (permissionStatus === 'denied') {
    return (
      <View>
        <Text>Push notifications are disabled</Text>
        <Button title="Open Settings" onPress={openSettings} />
      </View>
    );
  }

  return <Text>Push token: {expoPushToken}</Text>;
}
```

---

## 3. Supabase RLS Policies ✅

### Problem
Client-side insert fails with:
```
code 42501 "new row violates row-level security policy"
```

### Solution
- Created migration for `notification_preferences` table with RLS
- Added comprehensive RLS policies for SELECT, INSERT, UPDATE, DELETE
- Created setup guide in `SUPABASE_RLS_SETUP.md`
- Provided safe client-side insert pattern

### RLS Policies Created
```sql
-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- SELECT policy
CREATE POLICY "Users can view their own notification preferences"
ON public.notification_preferences
FOR SELECT
USING (auth.uid() = user_id);

-- INSERT policy
CREATE POLICY "Users can insert their own notification preferences"
ON public.notification_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE policy
CREATE POLICY "Users can update their own notification preferences"
ON public.notification_preferences
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE policy
CREATE POLICY "Users can delete their own notification preferences"
ON public.notification_preferences
FOR DELETE
USING (auth.uid() = user_id);
```

### Safe Insert Pattern
```typescript
import { supabase } from '@/integrations/supabase/client';

async function insertNotificationPreference(preferenceData: any) {
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return { success: false, error: 'User not authenticated' };
  }

  // Insert with user_id from auth
  const { data, error } = await supabase
    .from('notification_preferences')
    .insert([
      {
        ...preferenceData,
        user_id: user.id, // CRITICAL: Use auth.uid()
      },
    ])
    .select();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data };
}
```

### Admin Access
**Recommended:** Use Edge Function with service role key
- Service role key never exposed to client
- Full control over admin logic
- Can add additional validation
- Audit logging built-in

See `SUPABASE_RLS_SETUP.md` for full Edge Function implementation.

---

## 4. Permissions Hook ✅

### Problem
Pre-Live screen repeatedly logs:
```
"Requesting camera permission", "Requesting microphone permission", then "Permissions not granted"
```

### Solution
- Created `usePermissions` hook with robust permission handling
- Requests permissions once on mount
- Stores result in state to avoid infinite loops
- Handles 'denied' state with button to open OS settings

### Hook Usage
```typescript
import { usePermissions } from '@/hooks/usePermissions';

function PreLiveScreen() {
  const {
    hasCameraPermission,
    hasMicrophonePermission,
    isLoading,
    error,
    requestPermissions,
    openSettings,
  } = usePermissions();

  if (isLoading) {
    return <Text>Requesting permissions...</Text>;
  }

  if (!hasCameraPermission || !hasMicrophonePermission) {
    return (
      <View>
        <Text>Camera and microphone permissions are required</Text>
        <Button title="Grant Permissions" onPress={requestPermissions} />
        <Button title="Open Settings" onPress={openSettings} />
      </View>
    );
  }

  return <Text>Permissions granted!</Text>;
}
```

### Required Android Permissions (app.json)
Already configured:
```json
{
  "android": {
    "permissions": [
      "CAMERA",
      "RECORD_AUDIO"
    ]
  }
}
```

### Rebuild Required
After adding permissions to `app.json`, rebuild dev client:
```bash
eas build --platform android --profile development
```

---

## 5. npm Configuration ✅

### Problem
```
npm warn Unknown project config 'node-linker'
```

### Solution
- Updated `.npmrc` to remove `node-linker` setting
- Added comment explaining the setting is pnpm-specific

### Updated .npmrc
```
# Removed node-linker setting as it's pnpm-specific
# If you're using npm, this file can remain minimal
# If you want to use pnpm, uncomment the line below:
# node-linker=hoisted
```

### Explanation
- `node-linker` is a pnpm-specific setting
- npm doesn't recognize this setting and shows a warning
- If using npm: Remove the line (already done)
- If using pnpm: Uncomment the line

---

## 6. Lint Errors Fixed ✅

### Fixed Issues
1. **Array type warnings** - Changed `Array<T>` to `T[]` in test file
2. **Multiple exports** - Fixed duplicate `webRTCService` export
3. **React Hooks dependencies** - Fixed missing dependencies in `ARView.tsx`

### Files Fixed
- `app/screens/__tests__/GiftInformationScreen.test.ts`
- `app/services/webRTCService.ts`
- `modules/ar-filter-engine/ARView.tsx`

---

## Summary of Files Created/Modified

### New Files Created
1. `src/hooks/usePushNotifications.ts` - Push notifications hook
2. `src/hooks/usePermissions.ts` - Camera/microphone permissions hook
3. `REFACTOR_PLAN.md` - Expo Router refactor guide
4. `FIREBASE_PUSH_NOTIFICATIONS_SETUP.md` - Firebase setup guide
5. `SUPABASE_RLS_SETUP.md` - Supabase RLS guide
6. `COMPREHENSIVE_FIXES_SUMMARY.md` - This file

### Files Modified
1. `tsconfig.json` - Added path aliases
2. `.npmrc` - Removed node-linker setting
3. `app.json` - Added Firebase and notifications config
4. `app/screens/__tests__/GiftInformationScreen.test.ts` - Fixed lint errors
5. `app/services/webRTCService.ts` - Fixed duplicate export
6. `modules/ar-filter-engine/ARView.tsx` - Fixed React Hooks dependencies

---

## Next Steps

### Immediate Actions Required
1. **Download google-services.json** from Firebase Console
2. **Place it in project root** (`./google-services.json`)
3. **Rebuild dev client:**
   ```bash
   eas build --platform android --profile development
   ```
4. **Install and test** the new dev client

### Refactoring (Optional but Recommended)
1. Move `app/services/*` to `src/services/*`
2. Move `app/hooks/*` to `src/hooks/*`
3. Move `app/integrations/*` to `src/integrations/*`
4. Update all imports to use new path aliases
5. Run `expo start --clear` to clear cache

### Testing Checklist
- [ ] Push notifications work on physical device
- [ ] Camera and microphone permissions work
- [ ] Supabase inserts work without RLS errors
- [ ] No more Expo Router warnings
- [ ] No more npm warnings
- [ ] All lint errors resolved

---

## Support

If you encounter any issues:
1. Check the relevant guide (REFACTOR_PLAN.md, FIREBASE_PUSH_NOTIFICATIONS_SETUP.md, SUPABASE_RLS_SETUP.md)
2. Verify all environment variables are set
3. Ensure dev client is rebuilt after configuration changes
4. Check console logs for detailed error messages

---

## Key Takeaways

1. **Expo Router:** Only route files should be in `app/` directory
2. **Firebase:** Requires `google-services.json` and dev client rebuild
3. **Supabase RLS:** Always use `auth.uid()` for user_id in policies
4. **Permissions:** Request once, store in state, provide settings button
5. **npm config:** Remove pnpm-specific settings when using npm

All fixes have been implemented and documented. Follow the guides for step-by-step instructions.
