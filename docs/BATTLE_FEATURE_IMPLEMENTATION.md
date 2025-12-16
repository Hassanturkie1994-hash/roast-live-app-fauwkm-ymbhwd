
# Battle Feature Implementation Guide

## Overview

The Battle feature is a live, social, competitive roasting system built on top of live streaming in Roast Live. This is NOT a mini-game – it's a comprehensive matchmaking and battle system that allows users to compete in team-based roasting battles.

## Database Schema

### Tables Created

1. **battle_lobbies**
   - Stores battle lobby information
   - Tracks host, format, status, team players
   - Supports return to solo stream functionality
   - Fields: id, host_id, format, status, team_a_players, team_b_players, max_players_per_team, current_players_count, match_found_at, battle_started_at, battle_ended_at, return_to_solo_stream, original_stream_id

2. **battle_invitations**
   - Manages invitations to join battle lobbies
   - Tracks invitation status and expiration
   - Fields: id, lobby_id, inviter_id, invitee_id, status, created_at, responded_at, expires_at

3. **battle_matchmaking_queue**
   - Manages matchmaking queue for finding opponents
   - Tracks lobby format and player count
   - Fields: id, lobby_id, format, players_count, priority, created_at

4. **battle_matches**
   - Stores battle match information
   - Tracks team scores, winner, and acceptance status
   - Fields: id, lobby_a_id, lobby_b_id, format, stream_id, team_a_score, team_b_score, winner_team, status, team_a_accepted, team_b_accepted, started_at, ended_at

5. **battle_matchmaking_blocks**
   - Manages temporary matchmaking blocks for users who decline matches
   - 3-minute cooldown period
   - Fields: id, user_id, reason, blocked_until, created_at

## Battle Formats

- **1v1**: One-on-one roasting battle
- **2v2**: Team battle with 2 players each
- **3v3**: Team battle with 3 players each
- **4v4**: Team battle with 4 players each
- **5v5**: Epic team battle with 5 players each

## Entry Points

### 1. Go Live Setup
- Modified `app/(tabs)/go-live-modal.tsx` to include Battle mode selection
- Users can choose between "Solo Live" and "Battle"
- Battle mode navigates to format selection

### 2. Settings (TODO)
- Add "Battle" section in Settings screen
- Configure battle preferences

### 3. During Active Solo Live (TODO)
- Add "Battle Now" modal button
- Allows streamers to enter battle mid-stream
- Must return to original solo stream after battle ends

## Core Components

### 1. BattleService (`app/services/battleService.ts`)
Handles all battle-related logic:
- `createLobby()`: Create a new battle lobby
- `sendInvitation()`: Send invitation to join lobby
- `acceptInvitation()`: Accept a battle invitation
- `declineInvitation()`: Decline a battle invitation
- `enterMatchmaking()`: Enter matchmaking queue
- `acceptMatch()`: Accept a found match
- `declineMatch()`: Decline a match (triggers 3-minute block)
- `getUserActiveLobby()`: Get user's current active lobby
- `getPendingInvitations()`: Get pending invitations
- `isUserBlocked()`: Check if user is blocked from matchmaking
- `leaveLobby()`: Leave a battle lobby

### 2. BattleLobbyScreen (`app/screens/BattleLobbyScreen.tsx`)
Main lobby interface:
- Displays lobby status and format
- Shows team players
- Invite friends button
- Search match button (when lobby is full)
- Real-time updates via Supabase Realtime

### 3. BattleFormatSelectionScreen (`app/screens/BattleFormatSelectionScreen.tsx`)
Format selection interface:
- Choose battle format (1v1, 2v2, 3v3, 4v4, 5v5)
- Create lobby button
- Displays stream title

### 4. BattleInvitationPopup (`components/BattleInvitationPopup.tsx`)
Real-time invitation popup:
- Appears when user receives battle invitation
- Accept/Decline buttons
- Works across all app states (watching, streaming, browsing)
- Animated slide-in effect

## Matchmaking Flow

1. **Lobby Creation**
   - User selects battle format
   - Lobby is created with host as first player
   - Status: `waiting`

2. **Invite Friends (Optional)**
   - Host can invite friends to join lobby
   - Invitations sent via Supabase Realtime
   - Invitees receive popup notification
   - Accept adds user to lobby

3. **Auto-fill via Matchmaking**
   - Solo users can queue directly
   - System auto-fills remaining slots
   - Example: 5v5 with 3 invited friends → 2 slots auto-filled

4. **Search Match**
   - When lobby is full, "Search Match" button appears
   - System searches for another lobby with same format
   - Status: `searching`

5. **Match Found**
   - System finds compatible lobby
   - Both lobbies notified
   - Status: `matched`

6. **Final Accept Phase**
   - ALL players from both teams must accept
   - If any player declines:
     - Player is kicked
     - Player blocked from matchmaking for 3 minutes
     - Team auto-searches for replacement

7. **Battle Start**
   - When all players accept
   - Battle stream is created
   - Status: `in_battle`

## Real-time Features

### Supabase Realtime Channels

1. **Lobby Updates**
   - Channel: `battle_lobby:{lobbyId}`
   - Events: Player joins/leaves, status changes

2. **Invitation Notifications**
   - Channel: `user:{userId}:invitations`
   - Events: New invitation received

3. **Match Updates**
   - Channel: `battle_match:{matchId}`
   - Events: Player accepts/declines, match status changes

## Security (RLS Policies)

All tables have Row Level Security enabled:

- **battle_lobbies**: Users can only view/modify lobbies they're part of
- **battle_invitations**: Users can only view invitations sent to/by them
- **battle_matchmaking_queue**: Users can only view queue entries for their lobbies
- **battle_matches**: Users can only view matches they're part of
- **battle_matchmaking_blocks**: Users can only view their own blocks

## TODO: Remaining Implementation

### 1. Battle Now Button (During Solo Live)
- Add modal button in `app/live-player.tsx` or broadcaster screen
- Create lobby with `return_to_solo_stream: true`
- Store `original_stream_id`
- After battle ends, return to original stream

### 2. Settings Integration
- Add "Battle" section in Settings
- Battle preferences (default format, auto-accept invites, etc.)

### 3. Battle Stream Interface
- Split-screen view for two teams
- Real-time scoring system
- Viewer participation (gifts = points)
- Battle timer
- Winner announcement

### 4. Invite Friends Screen
- List of followed users
- Filter by online/offline status
- Send invitations
- Track invitation status

### 5. Match Accept Screen
- Show opponent team information
- Accept/Decline buttons
- Countdown timer
- Replacement search if declined

### 6. Post-Battle Flow
- Display winner
- Show statistics
- Return to solo stream (if applicable)
- Save battle replay

## Testing Checklist

- [ ] Create battle lobby
- [ ] Send invitation
- [ ] Accept invitation
- [ ] Decline invitation
- [ ] Enter matchmaking
- [ ] Find match
- [ ] Accept match
- [ ] Decline match (verify 3-minute block)
- [ ] Leave lobby
- [ ] Real-time updates work correctly
- [ ] RLS policies prevent unauthorized access
- [ ] Battle Now from solo stream
- [ ] Return to solo stream after battle

## Performance Considerations

- Indexes created on frequently queried columns
- Real-time subscriptions optimized for minimal data transfer
- Matchmaking queue uses priority system for fair matching
- Expired invitations automatically filtered out

## Error Handling

- User blocked from matchmaking → Show alert with cooldown time
- Lobby not found → Navigate back with error message
- Invitation expired → Remove from list
- Match declined → Block user and search for replacement
- Network errors → Retry with exponential backoff

## Future Enhancements

1. **Ranked Matchmaking**
   - ELO rating system
   - Rank tiers (Bronze, Silver, Gold, etc.)
   - Seasonal leaderboards

2. **Battle Rewards**
   - Winner rewards (coins, badges, etc.)
   - Participation rewards
   - Streak bonuses

3. **Battle History**
   - View past battles
   - Statistics and analytics
   - Replay system

4. **Custom Battle Modes**
   - Time-limited battles
   - Theme-based battles
   - Tournament mode

5. **Spectator Mode**
   - Watch battles without participating
   - Bet on winners
   - Cheer for teams

## Support

For issues or questions about the Battle feature:
1. Check database migrations are applied
2. Verify RLS policies are enabled
3. Check Supabase Realtime subscriptions
4. Review console logs for errors
5. Test with multiple users for real-time functionality
