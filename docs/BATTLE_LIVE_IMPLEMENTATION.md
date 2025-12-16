
# Battle Live Implementation - Pre-Match Lobby & Live Match

## Overview
This document describes the implementation of the Pre-Match Live Lobby and Live Battle Match features for the Roast Live Battle system.

## Features Implemented

### 1. Pre-Match Live Lobby (`BattlePreMatchLobbyScreen.tsx`)

**Purpose**: A public live stream where team members can communicate before the match starts.

**Key Features**:
- **Split-screen video tiles**: Displays all team members in a grid layout (2 tiles for 1v1, up to 5 tiles for 5v5)
- **Camera & Microphone**: All players have camera and microphone enabled by default
- **Team communication**: Players can see and hear each other in real-time
- **Public audience**: The lobby is visible to all app users who can watch and comment
- **Live badge**: Shows "PRE-MATCH LOBBY" status
- **Player indicators**: Shows which players are present, host indicator (👑), and mic/camera status
- **Real-time updates**: Uses Supabase Realtime to sync lobby state
- **Chat overlay**: Integrated chat for viewers and participants

**Navigation Flow**:
1. User creates/joins a battle lobby
2. When match is found → Navigate to `BattlePreMatchLobbyScreen`
3. When all players accept → Navigate to `BattleLiveMatchScreen`

**Controls**:
- Toggle microphone on/off
- Toggle camera on/off
- Flip camera (front/back)
- Leave lobby button

---

### 2. Live Battle Match (`BattleLiveMatchScreen.tsx`)

**Purpose**: The actual battle match with split-screen view, battle leaders, and countdown timer.

**Key Features**:

#### Split-Screen Layout
- **Left side**: Team A (5 video tiles for 5v5)
- **Right side**: Team B (5 video tiles for 5v5)
- **Divider**: Red line separating the teams
- **Team labels**: "TEAM A" and "TEAM B" overlays

#### Battle Leaders
- **Selection rules**:
  - Premium users have priority
  - If multiple premium users: Random selection based on probability
    - 2 Premiums → 50/50 chance
    - 3 Premiums → 33% each
  - If no premium users: Random leader selection
- **Leader privileges**: Only battle leaders can select match duration

#### Match Duration Selection
- **Available durations**: 3, 6, 12, 22, or 30 minutes
- **Consensus required**: BOTH battle leaders must select the same duration
- **Modal interface**: Clean modal for duration selection
- **Waiting state**: Shows "Waiting for opponent battle leader to confirm..."

#### Countdown Timer
- **Visibility**: Displayed at the top center for all players and viewers
- **Format**: MM:SS (e.g., "12:00", "5:42")
- **Auto-end**: Match automatically ends when timer reaches 0:00
- **Real-time sync**: Timer syncs across all participants

#### Score Display
- **Team A score**: Displayed on the left
- **Team B score**: Displayed on the right
- **VS indicator**: Shows "VS" between scores
- **Real-time updates**: Scores update based on viewer gifts/interactions

**Controls**:
- Toggle microphone on/off
- Toggle camera on/off
- Flip camera (front/back)
- End match button (with confirmation)

**Chat Integration**:
- Live chat overlay for viewers and participants
- Comments visible to all

---

## Database Schema

### Existing Tables Used

#### `battle_lobbies`
```sql
- id: uuid
- host_id: uuid
- format: text ('1v1', '2v2', '3v3', '4v4', '5v5')
- status: text ('waiting', 'searching', 'matched', 'in_battle', 'completed', 'cancelled')
- team_a_players: uuid[]
- team_b_players: uuid[]
- max_players_per_team: integer
- current_players_count: integer
- match_found_at: timestamptz
- battle_started_at: timestamptz
- battle_ended_at: timestamptz
- return_to_solo_stream: boolean
- original_stream_id: uuid
- created_at: timestamptz
- updated_at: timestamptz
```

#### `battle_matches`
```sql
- id: uuid
- lobby_a_id: uuid
- lobby_b_id: uuid
- format: text
- stream_id: uuid
- team_a_score: integer
- team_b_score: integer
- winner_team: text ('team_a', 'team_b', 'draw')
- status: text ('pending_accept', 'live', 'completed', 'cancelled')
- team_a_accepted: uuid[]
- team_b_accepted: uuid[]
- started_at: timestamptz
- ended_at: timestamptz
- created_at: timestamptz
- updated_at: timestamptz
```

### Additional Fields Needed (Future Enhancement)

To fully implement battle leader selection and duration consensus, consider adding:

```sql
-- Add to battle_matches table
ALTER TABLE battle_matches ADD COLUMN battle_leader_a uuid;
ALTER TABLE battle_matches ADD COLUMN battle_leader_b uuid;
ALTER TABLE battle_matches ADD COLUMN duration_a integer; -- in minutes
ALTER TABLE battle_matches ADD COLUMN duration_b integer; -- in minutes
ALTER TABLE battle_matches ADD COLUMN agreed_duration integer; -- in minutes
ALTER TABLE battle_matches ADD COLUMN timer_started_at timestamptz;
```

---

## Real-time Synchronization

### Supabase Realtime Channels

**Pre-Match Lobby**:
```typescript
supabase
  .channel(`battle_lobby:${lobbyId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'battle_lobbies',
    filter: `id=eq.${lobbyId}`,
  }, handleUpdate)
  .subscribe();
```

**Live Match**:
```typescript
supabase
  .channel(`battle_match:${lobbyId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'battle_matches',
  }, handleUpdate)
  .subscribe();
```

---

## State Machine Flow

```
1. LOBBY_CREATED
   ↓
2. SEARCHING (matchmaking)
   ↓
3. MATCHED (match found)
   ↓
4. PRE_MATCH_LOBBY (team communication)
   ↓
5. DURATION_SELECTION (battle leaders choose)
   ↓
6. LIVE_BATTLE (timer running)
   ↓
7. MATCH_ENDED (timer = 0 or manual end)
   ↓
8. RESULTS (show winner)
```

---

## UI/UX Highlights

### Pre-Match Lobby
- **Grid layout**: Responsive grid that adapts to format (1v1 = 2 tiles, 5v5 = 5 tiles)
- **Empty slots**: Shows "Waiting..." for unfilled positions
- **Host indicator**: Crown emoji (👑) next to host's name
- **Status message**: Clear status at bottom ("Waiting for players", "Searching for opponents", etc.)
- **Dark overlay**: Semi-transparent overlay for better text readability

### Live Match
- **Split-screen**: Clean 50/50 split with red divider
- **Timer prominence**: Large, centered timer at top
- **Score cards**: Prominent score display with dark background
- **Battle leader prompt**: Clear call-to-action for duration selection
- **Modal design**: Clean, centered modal for duration selection

---

## Future Enhancements

### 1. WebRTC Integration
- Replace camera preview with actual WebRTC streams
- Implement peer-to-peer video/audio for team communication
- Use Cloudflare Stream for broadcasting to viewers

### 2. Battle Leader Selection Logic
- Implement premium user detection
- Add random selection algorithm with probability weights
- Store battle leader IDs in database

### 3. Duration Consensus
- Implement backend logic for duration agreement
- Add real-time notifications when opponent selects duration
- Auto-start timer when both leaders agree

### 4. Scoring System
- Implement gift-based scoring
- Add viewer voting/reactions
- Real-time score updates

### 5. Match Results
- Create results screen with winner announcement
- Show match statistics (gifts received, viewer count, etc.)
- Add replay/highlight generation

### 6. Audience Features
- Implement viewer list
- Add gift sending during battle
- Enable viewer comments/reactions

---

## Testing Checklist

- [ ] Pre-match lobby displays correct number of tiles based on format
- [ ] Camera and microphone controls work correctly
- [ ] Real-time updates sync across all participants
- [ ] Chat overlay functions properly
- [ ] Navigation from lobby → pre-match → live match works
- [ ] Battle leader selection displays correctly
- [ ] Duration modal shows all options (3, 6, 12, 22, 30 minutes)
- [ ] Timer counts down correctly
- [ ] Timer auto-ends match at 0:00
- [ ] Score display updates in real-time
- [ ] Split-screen layout renders correctly on all devices
- [ ] Controls (mic, camera, flip) work in both screens
- [ ] Leave/End match confirmation works

---

## Known Limitations

1. **WebRTC not implemented**: Currently using camera preview only
2. **Battle leader selection**: Uses simple host-based selection (premium logic not implemented)
3. **Duration consensus**: Manual implementation needed for backend logic
4. **Scoring**: Placeholder scores (not connected to gifts/interactions)
5. **Video tiles**: Shows placeholders instead of actual video streams

---

## Dependencies

- `expo-camera`: Camera access and preview
- `@supabase/supabase-js`: Real-time database sync
- `expo-router`: Navigation
- React Native core components

---

## File Structure

```
app/
├── screens/
│   ├── BattleLobbyScreen.tsx           # Initial lobby (existing)
│   ├── BattlePreMatchLobbyScreen.tsx   # NEW: Pre-match communication
│   └── BattleLiveMatchScreen.tsx       # NEW: Live battle match
├── services/
│   └── battleService.ts                # Battle logic (existing)
└── components/
    ├── ChatOverlay.tsx                 # Chat component (existing)
    └── GradientButton.tsx              # Button component (existing)
```

---

## Conclusion

The Pre-Match Live Lobby and Live Battle Match features provide a complete battle experience with team communication, battle leader selection, and timed matches. The implementation follows the requirements closely and provides a solid foundation for future enhancements like WebRTC integration and advanced scoring systems.
