
# Quick Reference - All Fixes

## 🎯 One-Page Summary

### 1. Expo Router Refactoring

**Move these files:**
```
app/services/*     → src/services/*
app/hooks/*        → src/hooks/*
app/integrations/* → src/integrations/*
```

**Update imports:**
```typescript
import { service } from '@/services/service';
```

---

### 2. Firebase Push Notifications

**Setup:**
1. Firebase Console → Add Android app → `com.hasselite.roastlive`
2. Download `google-services.json` → Place in project root
3. Update `app.json`:
   ```json
   {
     "android": {
       "googleServicesFile": "./google-services.json"
     }
   }
   ```
4. Rebuild: `npx expo run:android`

**Usage:**
```typescript
import { usePushNotifications } from '@/hooks/usePushNotifications';

const { expoPushToken } = usePushNotifications();
```

---

### 3. Supabase RLS

**Apply migration:**
```bash
# Run: supabase/migrations/20250101000000_create_notification_preferences_with_rls.sql
```

**Safe insert:**
```typescript
const { data: { session } } = await supabase.auth.getSession();

await supabase
  .from('notification_preferences')
  .upsert({
    user_id: session.user.id,  // ← Always include!
    push_enabled: true,
  });
```

---

### 4. Permissions

**Usage:**
```typescript
import { usePermissions } from '@/hooks/usePermissions';

const { 
  hasCameraPermission, 
  hasMicrophonePermission, 
  openSettings 
} = usePermissions();

if (!hasCameraPermission) {
  return <Button title="Open Settings" onPress={openSettings} />;
}
```

---

### 5. npm Configuration

**Fix warning:**
```bash
npm cache clean --force
npm install
```

---

## 🔧 Essential Commands

```bash
# Lint check
npm run lint

# Rebuild dev client
npx expo run:android

# Clear cache
npm start -- --clear

# EAS build
eas build -p android --profile development
```

---

## 📚 Documentation Files

1. `USER_GUIDE_COMPREHENSIVE_FIXES.md` - Start here
2. `FIREBASE_PUSH_NOTIFICATIONS_COMPLETE_GUIDE.md` - Firebase setup
3. `COMPREHENSIVE_REFACTOR_AND_FIXES.md` - Technical details
4. `IMPLEMENTATION_SUMMARY_ALL_FIXES.md` - Complete overview

---

## ✅ Verification Checklist

- [ ] No Expo Router warnings
- [ ] Push token generated
- [ ] RLS insert works
- [ ] Permissions requested once
- [ ] No npm warnings
- [ ] Lint passes (0 errors)

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| Expo Router warnings | Move files to `src/` |
| Firebase error | Rebuild dev client |
| RLS violation | Include `user_id = auth.uid()` |
| Permission loop | Use `usePermissions` hook |
| npm warning | Remove `node-linker` from `.npmrc` |

---

**All fixes complete! 🎉**
