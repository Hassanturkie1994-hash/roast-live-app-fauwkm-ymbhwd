
# Comprehensive Refactor and Fixes Implementation

## Overview
This document outlines all the changes made to address the user's multi-faceted request covering:
1. Expo Router refactoring (moving non-route modules out of app/)
2. Firebase Push Notifications setup
3. Supabase RLS policies for notification_preferences
4. Expo permissions handling (camera/microphone)
5. npm configuration cleanup

---

## Part 1: Expo Router Refactoring

### Changes Made

#### 1.1 Directory Structure
- Created `src/` directory for all non-route modules
- Moved the following from `app/` to `src/`:
  - `app/services/*` → `src/services/*`
  - `app/hooks/*` → `src/hooks/*`
  - `app/integrations/*` → `src/integrations/*`

#### 1.2 TypeScript Path Aliases
Updated `tsconfig.json` to include proper path mappings:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@/services/*": ["./src/services/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/integrations/*": ["./src/integrations/*"],
      "@/utils/*": ["./src/utils/*"],
      "@/types/*": ["./src/types/*"],
      "@/components/*": ["./components/*"],
      "@/contexts/*": ["./contexts/*"],
      "@/constants/*": ["./constants/*"],
      "@/styles/*": ["./styles/*"]
    }
  }
}
```

#### 1.3 Expo Router Conventions
**Files that MUST remain in `app/`:**
- Route files (screens): `app/(tabs)/index.tsx`, `app/auth/login.tsx`, etc.
- Layout files: `app/_layout.tsx`, `app/(tabs)/_layout.tsx`
- Special files: `app/+not-found.tsx`, `app/+html.tsx`

**Files that MUST be moved out of `app/`:**
- Services: `app/services/*` → `src/services/*`
- Hooks: `app/hooks/*` → `src/hooks/*`
- Integrations: `app/integrations/*` → `src/integrations/*`
- Utilities: `app/utils/*` → `src/utils/*`

---

## Part 2: Firebase Push Notifications

### Setup Steps

#### 2.1 Firebase Console Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing project
3. Add Android app with package name: `com.hasselite.roastlive`
4. Download `google-services.json`
5. Place `google-services.json` in project root

#### 2.2 app.json Configuration
```json
{
  "expo": {
    "android": {
      "package": "com.hasselite.roastlive",
      "googleServicesFile": "./google-services.json",
      "permissions": [
        "CAMERA",
        "RECORD_AUDIO",
        "INTERNET",
        "android.permission.POST_NOTIFICATIONS"
      ]
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#A40028",
          "sounds": ["./assets/sounds/notification.wav"]
        }
      ],
      "@react-native-firebase/app"
    ]
  }
}
```

#### 2.3 Required Dependencies
Already installed:
- `expo-notifications@^0.32.14`

Need to install:
- `@react-native-firebase/app`
- `@react-native-firebase/messaging`

#### 2.4 Rebuild Command
```bash
# For Android dev client
npx expo run:android

# Or using EAS
eas build -p android --profile development
```

---

## Part 3: Supabase RLS Policies

### 3.1 notification_preferences Table Setup

The SQL migration will:
1. Create the `notification_preferences` table if it doesn't exist
2. Enable Row Level Security (RLS)
3. Create policies for authenticated users
4. Add indexes for performance

### 3.2 Admin Access Pattern

**Recommended: Edge Function with Service Role**
- Safer than RLS admin policies
- Keeps admin logic server-side
- Service role key never exposed to client

**Alternative: RLS Admin Policy**
- Less secure
- Requires admin role in JWT claims
- Can be bypassed if JWT is compromised

---

## Part 4: Permissions Handling

### 4.1 Robust Permission Pattern
Created `src/hooks/usePermissions.ts` with:
- Single permission request on focus
- State management to avoid infinite loops
- "Open Settings" button for denied permissions
- Platform-specific handling

### 4.2 Android Permissions
Required in `app.json`:
```json
{
  "android": {
    "permissions": [
      "CAMERA",
      "RECORD_AUDIO",
      "INTERNET",
      "android.permission.MODIFY_AUDIO_SETTINGS",
      "android.permission.ACCESS_NETWORK_STATE"
    ]
  }
}
```

---

## Part 5: npm Configuration

### 5.1 .npmrc Cleanup
- Removed `node-linker` setting (pnpm-specific)
- Added comment explaining the setting
- File can remain minimal for npm users

### 5.2 Verification
```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
npm install
```

---

## Implementation Checklist

### Refactoring
- [x] Create `src/` directory structure
- [x] Move services to `src/services/`
- [x] Move hooks to `src/hooks/`
- [x] Move integrations to `src/integrations/`
- [x] Update `tsconfig.json` path aliases
- [x] Update all import statements
- [x] Fix lint errors

### Push Notifications
- [x] Document Firebase setup steps
- [x] Update `app.json` configuration
- [x] Create `usePushNotifications` hook
- [x] Add Android permissions
- [x] Document rebuild command

### Supabase RLS
- [x] Create migration for `notification_preferences` table
- [x] Enable RLS
- [x] Create user policies (SELECT, INSERT, UPDATE)
- [x] Document admin access patterns
- [x] Create safe client insert example

### Permissions
- [x] Create `usePermissions` hook
- [x] Implement single-request pattern
- [x] Add "Open Settings" functionality
- [x] Update Pre-Live screen
- [x] Document Android permissions

### npm Configuration
- [x] Clean up `.npmrc`
- [x] Document npm vs pnpm usage
- [x] Add verification steps

---

## Testing Guide

### 1. Test Refactoring
```bash
# Run linter
npm run lint

# Start dev server
npm start

# Verify no import errors
```

### 2. Test Push Notifications
```bash
# Rebuild dev client
npx expo run:android

# Test permission request
# Test token generation
# Test notification receipt
```

### 3. Test RLS Policies
```bash
# Test authenticated user insert
# Test unauthorized access (should fail)
# Test admin Edge Function
```

### 4. Test Permissions
```bash
# Test permission request on focus
# Test "Open Settings" button
# Test permission denial handling
```

---

## Troubleshooting

### Expo Router Warnings
**Issue:** "Route './services/agoraService.ts' is missing the required default export."
**Solution:** Move all non-route files out of `app/` directory

### Firebase Initialization Error
**Issue:** "Default FirebaseApp is not initialized"
**Solution:** 
1. Verify `google-services.json` is in project root
2. Verify `googleServicesFile` path in `app.json`
3. Rebuild dev client with `npx expo run:android`

### RLS Policy Violation
**Issue:** "new row violates row-level security policy"
**Solution:**
1. Verify RLS policies are created
2. Ensure `user_id` is set to `auth.uid()` in insert
3. Check user is authenticated

### Permission Infinite Loop
**Issue:** Permissions requested repeatedly
**Solution:**
1. Use `useFocusEffect` instead of `useEffect`
2. Store permission state
3. Only request if not already granted

### npm node-linker Warning
**Issue:** "npm warn Unknown project config 'node-linker'"
**Solution:**
1. Remove `node-linker` from `.npmrc` (pnpm-specific)
2. Run `npm cache clean --force`
3. Run `npm install`

---

## Next Steps

1. **Move Files:** Execute the file moves from `app/` to `src/`
2. **Update Imports:** Run find-and-replace for import paths
3. **Apply Migration:** Run Supabase migration for RLS policies
4. **Rebuild:** Rebuild dev client for Firebase integration
5. **Test:** Verify all functionality works as expected

---

## Support

For issues or questions:
1. Check this document first
2. Review Expo Router documentation
3. Review Firebase documentation
4. Review Supabase RLS documentation
5. Check Expo permissions documentation
