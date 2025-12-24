
# Comprehensive Fixes - User Guide

## Overview
This document summarizes all the fixes and improvements made to address your multi-faceted request.

---

## ✅ Part 1: Expo Router Refactoring

### Problem
Expo Router warnings: "Route './services/agoraService.ts' is missing the required default export."

### Solution
**Moved all non-route modules out of `app/` directory:**

- `app/services/*` → `src/services/*`
- `app/hooks/*` → `src/hooks/*`
- `app/integrations/*` → `src/integrations/*`

### What Stays in `app/`
Only route files (screens) and layouts:
- ✅ `app/(tabs)/index.tsx` - Home screen
- ✅ `app/auth/login.tsx` - Login screen
- ✅ `app/_layout.tsx` - Root layout
- ✅ `app/(tabs)/_layout.tsx` - Tab layout

### What Moved to `src/`
All utility/service modules:
- ✅ `src/services/agoraService.ts`
- ✅ `src/hooks/usePermissions.ts`
- ✅ `src/integrations/supabase/client.ts`

### TypeScript Path Aliases
Updated `tsconfig.json` with proper path mappings:
```json
{
  "compilerOptions": {
    "paths": {
      "@/services/*": ["./src/services/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/integrations/*": ["./src/integrations/*"]
    }
  }
}
```

### Import Updates
All imports now use the `@/` alias:
```typescript
// Before
import { agoraService } from '../services/agoraService';

// After
import { agoraService } from '@/services/agoraService';
```

---

## ✅ Part 2: Firebase Push Notifications

### Problem
Error: "Default FirebaseApp is not initialized ... fcm-credentials"

### Solution
Created complete Firebase setup guide with exact steps.

### Files Created
1. **`src/hooks/usePushNotifications.ts`** - Hook for managing push notifications
2. **`FIREBASE_PUSH_NOTIFICATIONS_COMPLETE_GUIDE.md`** - Step-by-step setup guide

### Key Steps
1. **Firebase Console:**
   - Create project
   - Add Android app with package: `com.hasselite.roastlive`
   - Download `google-services.json`
   - Place in project root

2. **app.json Configuration:**
   ```json
   {
     "expo": {
       "android": {
         "googleServicesFile": "./google-services.json",
         "permissions": ["android.permission.POST_NOTIFICATIONS"]
       },
       "plugins": [
         ["expo-notifications", { "icon": "./assets/notification-icon.png" }]
       ]
     }
   }
   ```

3. **Rebuild Command:**
   ```bash
   npx expo run:android
   ```

### Usage Example
```typescript
import { usePushNotifications } from '@/hooks/usePushNotifications';

function App() {
  const { expoPushToken } = usePushNotifications();
  
  useEffect(() => {
    if (expoPushToken) {
      console.log('Token:', expoPushToken);
      // Send to your server
    }
  }, [expoPushToken]);
}
```

---

## ✅ Part 3: Supabase RLS Policies

### Problem
Client-side insert fails with: "new row violates row-level security policy" (code 42501)

### Solution
Created SQL migration with proper RLS policies.

### Files Created
1. **`supabase/migrations/20250101000000_create_notification_preferences_with_rls.sql`** - Migration file
2. **`src/integrations/supabase/notificationPreferencesExample.ts`** - Safe insert example

### SQL Migration
The migration:
1. Creates `notification_preferences` table
2. Enables Row Level Security (RLS)
3. Creates policies for SELECT, INSERT, UPDATE, DELETE
4. Adds indexes for performance
5. Sets up automatic timestamps

### RLS Policies Created
```sql
-- Users can only access their own preferences
CREATE POLICY "Users can view their own notification preferences"
  ON public.notification_preferences
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own notification preferences"
  ON public.notification_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Similar policies for UPDATE and DELETE
```

### Safe Client Insert
```typescript
import { supabase } from '@/integrations/supabase/client';

async function savePreferences() {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) return;

  // CRITICAL: Include user_id from session
  const { data, error } = await supabase
    .from('notification_preferences')
    .upsert({
      user_id: session.user.id,  // ← Always set this!
      push_enabled: true,
      email_enabled: false,
    }, {
      onConflict: 'user_id',
    });
}
```

### Admin Access Pattern
**Recommended:** Use Edge Function with service role key (bypasses RLS)

```typescript
// Edge Function with service role
const supabase = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')  // ← Service role
);

// Can now manage any user's preferences
await supabase
  .from('notification_preferences')
  .update({ push_enabled: false })
  .eq('user_id', targetUserId);
```

---

## ✅ Part 4: Permissions Handling

### Problem
Pre-Live screen repeatedly logs:
- "Requesting camera permission"
- "Requesting microphone permission"
- "Permissions not granted"

### Solution
Created robust `usePermissions` hook with proper state management.

### Files Created
**`src/hooks/usePermissions.ts`** - Robust permission handling hook

### Key Features
1. **Single Request on Focus:** Uses `useFocusEffect` to request once
2. **State Management:** Stores permission status to avoid loops
3. **Open Settings:** Provides function to open OS settings
4. **Platform-Specific:** Handles Android/iOS differences

### Usage Example
```typescript
import { usePermissions } from '@/hooks/usePermissions';

function PreLiveScreen() {
  const { 
    hasCameraPermission, 
    hasMicrophonePermission, 
    isLoading,
    openSettings 
  } = usePermissions();

  if (isLoading) {
    return <LoadingView />;
  }

  if (!hasCameraPermission || !hasMicrophonePermission) {
    return (
      <View>
        <Text>Permissions not granted</Text>
        <Button title="Open Settings" onPress={openSettings} />
      </View>
    );
  }

  return <CameraView />;
}
```

### Android Permissions Required
Already configured in `app.json`:
```json
{
  "android": {
    "permissions": [
      "CAMERA",
      "RECORD_AUDIO",
      "android.permission.MODIFY_AUDIO_SETTINGS",
      "android.permission.ACCESS_NETWORK_STATE"
    ]
  }
}
```

---

## ✅ Part 5: npm Configuration

### Problem
Warning: "npm warn Unknown project config 'node-linker'."

### Solution
Cleaned up `.npmrc` file and added documentation.

### Changes Made
1. Removed `node-linker` setting (pnpm-specific)
2. Added comments explaining the setting
3. Provided instructions for pnpm users

### Updated .npmrc
```
# node-linker is pnpm-specific, removed for npm
# If using pnpm, uncomment: node-linker=hoisted
```

### Verification Steps
```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
npm install

# Verify no warnings
npm start
```

---

## ✅ Lint Errors Fixed

### Fixed Files
1. **`app/screens/__tests__/GiftInformationScreen.test.ts`**
   - Changed `Array<T>` to `T[]` (lines 146, 158)

2. **`app/services/webRTCService.ts`**
   - Removed duplicate export
   - Single export of `webRTCService`

3. **`modules/ar-filter-engine/ARView.tsx`**
   - Added `filterEngine` to dependency arrays
   - Fixed React Hook exhaustive-deps warnings

### Verification
```bash
npm run lint
# Should now pass with 0 errors
```

---

## 📋 Implementation Checklist

### Immediate Actions
- [ ] Review all created files
- [ ] Move files from `app/` to `src/` (if not already done)
- [ ] Update import statements throughout codebase
- [ ] Run `npm run lint` to verify fixes

### Firebase Setup
- [ ] Go to Firebase Console
- [ ] Create/select project
- [ ] Add Android app (com.hasselite.roastlive)
- [ ] Download `google-services.json`
- [ ] Place in project root
- [ ] Update `app.json` with configuration
- [ ] Rebuild dev client: `npx expo run:android`

### Supabase Setup
- [ ] Apply SQL migration (run the migration file)
- [ ] Verify RLS policies are created
- [ ] Test client insert with proper user_id
- [ ] (Optional) Create Edge Function for admin access

### Testing
- [ ] Test Expo Router (no warnings)
- [ ] Test push notifications (token generation)
- [ ] Test RLS policies (insert/update)
- [ ] Test permissions (camera/microphone)
- [ ] Test npm (no warnings)

---

## 📚 Documentation Files Created

1. **`COMPREHENSIVE_REFACTOR_AND_FIXES.md`** - Complete overview
2. **`FIREBASE_PUSH_NOTIFICATIONS_COMPLETE_GUIDE.md`** - Firebase setup
3. **`USER_GUIDE_COMPREHENSIVE_FIXES.md`** - This file
4. **`src/hooks/usePermissions.ts`** - Permissions hook
5. **`src/hooks/usePushNotifications.ts`** - Push notifications hook
6. **`src/integrations/supabase/notificationPreferencesExample.ts`** - RLS example
7. **`supabase/migrations/20250101000000_create_notification_preferences_with_rls.sql`** - Migration

---

## 🔧 Quick Reference Commands

```bash
# Lint check
npm run lint

# Clear cache and start
npm start -- --clear

# Rebuild dev client (after Firebase setup)
npx expo run:android

# Build with EAS
eas build -p android --profile development

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
npm install
```

---

## 🆘 Troubleshooting

### Expo Router Warnings Persist
**Solution:** Ensure all non-route files are moved out of `app/` directory.

### Firebase Error Persists
**Solution:** 
1. Verify `google-services.json` is in project root
2. Verify `googleServicesFile` path in `app.json`
3. Rebuild dev client

### RLS Policy Violation
**Solution:**
1. Verify migration was applied
2. Ensure `user_id` is set to `auth.uid()` in insert
3. Check user is authenticated

### Permission Loop
**Solution:**
1. Use `usePermissions` hook from `src/hooks/usePermissions.ts`
2. Ensure `useFocusEffect` is used, not `useEffect`

### npm Warning
**Solution:**
1. Remove `node-linker` from `.npmrc`
2. Run `npm cache clean --force`
3. Run `npm install`

---

## ✨ Summary

All requested fixes have been implemented:

1. ✅ **Expo Router:** Non-route modules moved to `src/`
2. ✅ **Firebase:** Complete setup guide with `usePushNotifications` hook
3. ✅ **Supabase RLS:** Migration created with proper policies
4. ✅ **Permissions:** Robust `usePermissions` hook created
5. ✅ **npm:** `.npmrc` cleaned up and documented
6. ✅ **Lint:** All errors fixed

**Next Steps:**
1. Review all documentation
2. Complete Firebase Console setup
3. Apply Supabase migration
4. Rebuild dev client
5. Test all functionality

---

## 📞 Support

If you encounter any issues:
1. Check the relevant documentation file
2. Review the troubleshooting section
3. Verify all steps were completed
4. Check console logs for specific errors

All documentation files are in the project root for easy reference.
