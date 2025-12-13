
# Swedish (sv-SE) Localization - Complete Implementation Guide

## ✅ COMPLETED WORK

### 1. Core Translation System
- **Created**: `constants/translations.ts` - Complete Swedish translation dictionary
- **Created**: `hooks/useTranslation.ts` - Translation hook and helper functions
- **Pattern**: `const t = useTranslation();` then use `t.auth.login.title` etc.

### 2. Fully Localized Components

#### Authentication
- ✅ `app/auth/login.tsx` - Login screen fully in Swedish
- ✅ `app/auth/register.tsx` - Registration screen fully in Swedish

#### Core UI Components
- ✅ `components/CreatorRulesModal.tsx` - Creator rules modal in Swedish
- ✅ `components/ChatOverlay.tsx` - Chat interface in Swedish
- ✅ `components/TikTokTabBar.tsx` - Tab bar labels in Swedish
- ✅ `components/FloatingTabBar.tsx` - Floating tab bar in Swedish

### 3. Translation Coverage

The translation file (`constants/translations.ts`) includes:

- **Common**: Loading, errors, buttons, actions
- **Authentication**: Login, register, password reset
- **Broadcaster**: Permissions, setup, live controls, end stream
- **Creator Rules**: All rules and explanations
- **Content Labels**: General, Roast Mode, Adult Only
- **Safety**: Acknowledgement, forced review lock
- **Chat**: Send message, show/hide, connection status
- **Gifts**: Send gift, balance, tiers, insufficient balance
- **Viewer List**: Active viewers, guest seats, badges, status
- **Report Modal**: Categories, submission
- **Profile**: Tabs, empty states, actions
- **Edit Profile**: Form labels, validation errors
- **Wallet**: Balance, transactions, types, status
- **Tab Bar**: Home, Explore, Go Live, Inbox, Profile
- **Connection Status**: Connected, reconnecting, disconnected
- **Stream Health**: Viewers, gifts
- **Buttons**: All common actions
- **Errors**: Generic, network, try again
- **Success Messages**: Saved, updated, deleted, sent
- **Time Formatting**: Just now, minutes/hours/days ago
- **Notifications**: Title, no notifications, mark all read
- **Settings**: All settings categories
- **Permissions**: Camera, microphone, notifications
- **Live Badge**: LIVE text
- **Moderation**: Timeout, ban, mute, kick, warn

## 🔧 HOW TO USE TRANSLATIONS

### In Any Component:

```typescript
import { useTranslation } from '@/hooks/useTranslation';

export default function MyComponent() {
  const t = useTranslation();
  
  return (
    <View>
      <Text>{t.common.loading}</Text>
      <Button title={t.buttons.save} />
      <Text>{t.auth.login.title}</Text>
    </View>
  );
}
```

### With Dynamic Values:

```typescript
import { useTranslation, formatTranslation } from '@/hooks/useTranslation';

export default function MyComponent() {
  const t = useTranslation();
  
  const message = formatTranslation(
    t.broadcaster.live.viewerCount, 
    { count: 42 }
  );
  // Result: "42 tittare"
  
  return <Text>{message}</Text>;
}
```

## 📋 REMAINING WORK

### High Priority Files (User-Facing)

These files still contain English text and need translation:

1. **Broadcaster Screen** (CRITICAL)
   - `app/(tabs)/broadcaster.tsx` - Main streaming interface
   - Needs: All alerts, error messages, setup flow, live controls

2. **Profile Screens**
   - `app/(tabs)/profile.tsx` - Profile view
   - `app/screens/EditProfileScreen.tsx` - Edit profile
   - `app/screens/WalletScreen.tsx` - Wallet screen

3. **Modals & Overlays**
   - `components/ViewerListModal.tsx` - Viewer list
   - `components/GiftSelector.tsx` - Gift selection
   - `components/ReportModal.tsx` - Report content
   - `components/ContentLabelModal.tsx` - Content labels
   - `components/SafetyAcknowledgementModal.tsx` - Safety acknowledgement
   - `components/ForcedReviewLockModal.tsx` - Review lock

4. **Other Screens** (50+ files in `app/screens/`)
   - All admin screens
   - All settings screens
   - All moderation screens
   - All analytics screens
   - All payment/subscription screens

### Medium Priority (Less Visible)

5. **Services** (Backend responses)
   - Error messages returned from services
   - Success messages from services
   - Validation messages

6. **Edge Functions** (If they return user-facing text)
   - `supabase/functions/*/index.ts` files
   - Any error messages or responses

### Low Priority (Internal)

7. **Console Logs**
   - Already partially done (Swedish console logs in updated files)
   - Not critical for user experience

## 🎯 IMPLEMENTATION STRATEGY

### For Each Remaining File:

1. **Import the translation hook**:
   ```typescript
   import { useTranslation } from '@/hooks/useTranslation';
   ```

2. **Use the hook in component**:
   ```typescript
   const t = useTranslation();
   ```

3. **Replace all English strings**:
   - Button titles
   - Labels
   - Placeholders
   - Alert messages
   - Error messages
   - Success messages
   - Empty state text
   - Modal titles and content

4. **Add new translations if needed**:
   - If a string doesn't exist in `constants/translations.ts`, add it there first
   - Follow the existing structure and naming conventions

### Example Conversion:

**Before**:
```typescript
<Text>Welcome back</Text>
<Button title="Sign In" />
Alert.alert('Error', 'Please fill in all fields');
```

**After**:
```typescript
<Text>{t.auth.login.title}</Text>
<Button title={t.auth.login.signIn} />
Alert.alert(t.common.error, t.auth.login.error);
```

## 🚀 QUICK START FOR DEVELOPERS

### To Localize a New Screen:

1. Open `constants/translations.ts`
2. Add your translations in the appropriate section
3. Import and use `useTranslation()` in your component
4. Replace all hardcoded strings with translation keys

### To Add a New Translation Category:

```typescript
// In constants/translations.ts
export const sv = {
  // ... existing translations
  
  myNewFeature: {
    title: 'Min nya funktion',
    description: 'Beskrivning här',
    button: 'Klicka här',
    error: 'Ett fel uppstod',
  },
};
```

## ✨ ICON FIXES

### Icon System Used:
- **Primary**: `IconSymbol` component with iOS and Android material icons
- **Custom**: SVG icons in `components/Icons/svg/` directory
- **Third-party**: `RoastIcon` for custom branded icons

### No "?" Characters:
All icons use proper icon names from:
- iOS SF Symbols (e.g., `"person.fill"`)
- Android Material Icons (e.g., `"person"`)
- Custom SVG components

### Icon Usage Pattern:
```typescript
<IconSymbol
  ios_icon_name="checkmark.circle.fill"
  android_material_icon_name="check_circle"
  size={24}
  color={colors.text}
/>
```

## 📊 LOCALIZATION PROGRESS

### Completed: ~15%
- Core translation system ✅
- Authentication screens ✅
- Main UI components ✅
- Tab navigation ✅
- Chat system ✅
- Creator rules ✅

### Remaining: ~85%
- Broadcaster screen (CRITICAL)
- Profile screens
- All modals
- All settings screens
- All admin screens
- All service error messages
- Edge function responses

## 🎨 DESIGN CONSISTENCY

### Swedish Language Guidelines:
1. **Formal vs Informal**: Use informal "du" form (not "ni")
2. **Capitalization**: Only capitalize proper nouns and sentence starts
3. **Button Text**: Use UPPERCASE for primary actions (e.g., "LOGGA IN")
4. **Error Messages**: Be clear and actionable
5. **Success Messages**: Be encouraging and positive

### Terminology Consistency:
- Stream = Stream (not "ström")
- Live = Live (not "direkt")
- Chat = Chatt
- Viewer = Tittare
- Gift = Gåva
- Balance = Saldo
- Profile = Profil
- Settings = Inställningar

## 🔍 TESTING CHECKLIST

After localizing each screen:

- [ ] All visible text is in Swedish
- [ ] No English fallback text appears
- [ ] No "?" or broken characters
- [ ] All icons render correctly
- [ ] Alert messages are in Swedish
- [ ] Error messages are in Swedish
- [ ] Success messages are in Swedish
- [ ] Placeholder text is in Swedish
- [ ] Button labels are in Swedish
- [ ] Navigation labels are in Swedish

## 📝 NOTES

- **No mixing languages**: Every user-facing string must be Swedish
- **No English fallbacks**: Remove all English default text
- **Consistent terminology**: Use the same Swedish word for the same concept throughout
- **Natural Swedish**: Avoid literal translations; use natural Swedish phrasing
- **Professional tone**: Maintain a professional yet friendly tone

## 🎯 NEXT STEPS

1. **Immediate**: Localize `app/(tabs)/broadcaster.tsx` (most critical user-facing screen)
2. **High Priority**: Localize all modals and overlays
3. **Medium Priority**: Localize all profile and settings screens
4. **Low Priority**: Localize admin and analytics screens
5. **Final**: Review and test entire app for any missed English text

## 🤝 CONTRIBUTION GUIDELINES

When adding new features:
1. Add Swedish translations to `constants/translations.ts` FIRST
2. Use `useTranslation()` hook from the start
3. Never hardcode English strings
4. Test with Swedish text to ensure UI layout works
5. Update this document if adding new translation categories

---

**Status**: Core system complete, ~85% of screens remaining
**Last Updated**: 2024
**Maintainer**: Development Team
