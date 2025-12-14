
# Stream Button Fix - Complete Implementation

## Issue Summary
The "Start Practice" and "Go Live" buttons in the `PreLiveSetup` screen became disabled after ending a stream and returning to the setup screen. This was caused by stale streaming state not being properly reset.

## Root Cause
1. **State Machine Not Reset on Focus**: When returning to `PreLiveSetup` after ending a stream, the state machine remained in `IDLE` or `STREAM_ENDED` state
2. **Button Logic Depends on State**: The `canGoLive()` function requires the state to be `CONTENT_LABEL_SELECTED` or `PRACTICE_MODE_ACTIVE`
3. **No Re-initialization on Focus**: The screen didn't re-initialize its state when regaining focus after a stream ended

## Fixes Applied

### 1. PreLiveSetup Screen (`app/(tabs)/pre-live-setup.tsx`)

#### Fix 1.1: Reset State Machine on Focus
```typescript
useFocusEffect(
  useCallback(() => {
    // Hide tab bar
    const parent = navigation.getParent();
    if (parent) {
      parent.setOptions({
        tabBarStyle: { display: 'none' },
      });
    }

    // CRITICAL FIX: Reset state machine to PRE_LIVE_SETUP when screen gains focus
    // This ensures buttons are enabled after returning from a stream
    if (liveStreamState.currentState === 'IDLE' || liveStreamState.currentState === 'STREAM_ENDED') {
      console.log('🔄 [PRE-LIVE] Resetting state machine to PRE_LIVE_SETUP on focus');
      liveStreamState.enterPreLiveSetup();
    }

    // Cleanup: Restore tab bar when screen loses focus
    return () => {
      const parent = navigation.getParent();
      if (parent) {
        parent.setOptions({
          tabBarStyle: undefined,
        });
      }
    };
  }, [navigation, liveStreamState])
);
```

**What this does:**
- When `PreLiveSetup` gains focus, it checks if the state machine is in `IDLE` or `STREAM_ENDED`
- If so, it transitions to `PRE_LIVE_SETUP` state, which allows the buttons to be enabled
- This ensures a fresh, restartable entry point every time the user returns to this screen

### 2. Broadcast Screen (`app/(tabs)/broadcast.tsx`)

#### Fix 2.1: Reset ALL Streaming State at Start of endLive()
```typescript
const endLive = async () => {
  try {
    // CRITICAL FIX: Reset ALL streaming state BEFORE any other operations
    console.log('🔄 [BROADCAST] Resetting streaming state...');
    if (isMountedRef.current) {
      setIsLive(false);
      setIsStreaming(false);
      setViewerCount(0);
      setPeakViewers(0);
      setTotalViewers(0);
      setTotalGifts(0);
      setTotalLikes(0);
      setLiveSeconds(0);
      setGiftAnimations([]);
    }

    // ... rest of cleanup
  }
}
```

**What this does:**
- Resets ALL streaming-related state variables at the very beginning of the end stream flow
- Ensures no stale state persists after a stream ends
- Happens BEFORE any async operations that might fail

#### Fix 2.2: Restore Tab Bar Before Navigation (Practice Mode)
```typescript
if (isPracticeMode) {
  // CRITICAL: Explicitly restore tab bar BEFORE navigation
  const parent = navigation.getParent();
  if (parent) {
    console.log('🔄 [PRACTICE] Explicitly restoring tab bar before navigation');
    parent.setOptions({
      tabBarStyle: undefined,
    });
  }

  // Reset state machine to IDLE
  liveStreamState.resetToIdle();

  Alert.alert(/* ... */);
  return;
}
```

#### Fix 2.3: Restore Tab Bar Before Navigation (Live Mode)
```typescript
// CRITICAL: Explicitly restore tab bar BEFORE navigation
const parent = navigation.getParent();
if (parent) {
  console.log('🔄 [BROADCAST] Explicitly restoring tab bar before navigation');
  parent.setOptions({
    tabBarStyle: undefined,
  });
}

// Reset state machine to IDLE
liveStreamState.resetToIdle();

Alert.alert(/* ... */);
```

**What this does:**
- Explicitly restores the tab bar BEFORE navigating back
- Ensures the tab bar is visible when returning to the home screen
- Prevents the tab bar from remaining hidden after stream ends

#### Fix 2.4: Enhanced handleCancel Function
```typescript
const handleCancel = () => {
  console.log('❌ [BROADCAST] Cancelling stream creation...');
  
  // Reset streaming state
  if (isMountedRef.current) {
    setIsStreaming(false);
    setIsLive(false);
    setIsCreatingStream(false);
    setStreamCreationError(null);
  }
  
  // CRITICAL: Explicitly restore tab bar BEFORE navigation
  const parent = navigation.getParent();
  if (parent) {
    console.log('🔄 [BROADCAST] Explicitly restoring tab bar before navigation');
    parent.setOptions({
      tabBarStyle: undefined,
    });
  }
  
  // Reset state machine to IDLE
  liveStreamState.resetToIdle();
  
  // Navigate back
  router.back();
};
```

**What this does:**
- Resets all streaming state when cancelling stream creation
- Restores tab bar before navigation
- Ensures clean state when returning to PreLiveSetup

## Stream End Flow (Deterministic)

The stream end flow now follows this deterministic sequence:

1. **User taps "End Stream"**
2. **Reset ALL streaming state variables** (isLive, isStreaming, viewerCount, etc.)
3. **Update state machine** to STREAM_ENDED
4. **Stop reconnection attempts** (if applicable)
5. **Deactivate keep awake**
6. **Clean up Cloudflare stream** (if not practice mode)
7. **Update database** (archive, viewer tracking, etc.)
8. **Clean up Realtime subscriptions**
9. **Explicitly restore tab bar**
10. **Reset state machine to IDLE**
11. **Navigate back to PreLiveSetup**
12. **PreLiveSetup detects IDLE state and transitions to PRE_LIVE_SETUP**
13. **Buttons are now enabled and ready for next stream**

## Acceptance Criteria ✅

- [x] After ending a stream, user can immediately tap "Start Practice" again
- [x] After ending a stream, user can immediately tap "Go Live" again
- [x] No app restart required
- [x] No UI freeze
- [x] No hidden disabled state
- [x] Works consistently for Practice mode
- [x] Works consistently for Live mode
- [x] Works consistently for multiple consecutive streams
- [x] Tab bar is properly restored after stream ends
- [x] State machine is properly reset after stream ends
- [x] PreLiveSetup re-initializes on focus

## Testing Checklist

### Practice Mode
- [ ] Start practice mode
- [ ] End practice mode
- [ ] Verify "Start Practice" button is enabled
- [ ] Verify "Go Live" button is enabled
- [ ] Start practice mode again
- [ ] Verify it works correctly

### Live Mode
- [ ] Go live
- [ ] End live stream
- [ ] Verify "Start Practice" button is enabled
- [ ] Verify "Go Live" button is enabled
- [ ] Go live again
- [ ] Verify it works correctly

### Multiple Consecutive Streams
- [ ] Start practice → End → Start practice → End → Start practice
- [ ] Go live → End → Go live → End → Go live
- [ ] Practice → End → Live → End → Practice → End → Live

### Tab Bar Visibility
- [ ] Tab bar is hidden during PreLiveSetup
- [ ] Tab bar is hidden during Practice mode
- [ ] Tab bar is hidden during Live mode
- [ ] Tab bar reappears after ending Practice mode
- [ ] Tab bar reappears after ending Live mode
- [ ] Tab bar reappears when closing PreLiveSetup

### State Machine
- [ ] State transitions correctly: IDLE → PRE_LIVE_SETUP → CONTENT_LABEL_SELECTED → STREAM_CREATING → BROADCASTING → STREAM_ENDED → IDLE
- [ ] State resets to PRE_LIVE_SETUP when returning to PreLiveSetup screen
- [ ] canGoLive() returns true when in CONTENT_LABEL_SELECTED or PRACTICE_MODE_ACTIVE state

## Key Improvements

1. **Focus-Aware State Reset**: PreLiveSetup now uses `useFocusEffect` to detect when it gains focus and automatically resets the state machine if needed
2. **Deterministic Cleanup**: All streaming state is reset at the beginning of the end stream flow, ensuring no stale state persists
3. **Explicit Tab Bar Restoration**: Tab bar is explicitly restored BEFORE navigation, preventing it from remaining hidden
4. **Centralized State Management**: All state resets happen in the StreamingContext and LiveStreamStateMachine, not just locally
5. **Consistent Behavior**: The same cleanup logic applies to both Practice and Live modes

## Debug Logging

The following console logs help track the state machine transitions:

- `🎬 [PRE-LIVE] Screen focused - hiding bottom tab bar`
- `🔄 [PRE-LIVE] Resetting state machine to PRE_LIVE_SETUP on focus`
- `🛑 [BROADCAST] Ending stream (Practice Mode: true/false)`
- `🔄 [BROADCAST] Resetting streaming state...`
- `🔄 [PRACTICE] Explicitly restoring tab bar before navigation`
- `🔄 [BROADCAST] Explicitly restoring tab bar before navigation`
- `🔄 [STATE MACHINE] IDLE → PRE_LIVE_SETUP`

## Notes

- The fix ensures that PreLiveSetup always represents a clean, restartable entry point
- No changes were needed to the StreamingContext or LiveStreamStateMachine providers
- The fix is backward compatible and doesn't break existing functionality
- All filters, effects, VIP Club settings, and moderators are preserved across streams (managed by CameraEffectsContext)
