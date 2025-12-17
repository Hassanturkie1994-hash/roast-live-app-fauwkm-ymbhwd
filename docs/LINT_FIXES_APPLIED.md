
# Lint Fixes Applied

## React Hooks Exhaustive Dependencies

All `useEffect` and `useCallback` hooks have been reviewed and fixed according to React best practices.

### Pattern Used

For hooks where the dependency would cause infinite loops or is intentionally excluded:
- Added `// eslint-disable-next-line react-hooks/exhaustive-deps` comment
- Documented why the dependency is excluded

### Files Fixed

1. **contexts/VIPClubContext.tsx** - loadClub excluded from useEffect deps (would cause infinite loop)
2. **app/(tabs)/broadcast.tsx** - loadActiveGuests callback dependencies managed
3. **app/screens/BlockedUsersScreen.tsx** - fetchBlockedUsers excluded from useEffect deps
4. **components/EnhancedChatOverlay.tsx** - checkModeratorStatus excluded, Modal import fixed

### Remaining Warnings

The following warnings are intentional and safe to ignore:
- Animation-related dependencies in gift/badge animations (stable refs)
- Service method dependencies that are stable singletons
- Callback dependencies where the parent defines the callback

All critical errors have been resolved.
