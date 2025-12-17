
# VIP Club System - Developer Quick Reference

## Import the Service

```typescript
import { unifiedVIPClubService } from '@/app/services/unifiedVIPClubService';
```

## Common Operations

### Check if Creator Can Create VIP Club

```typescript
const eligibility = await unifiedVIPClubService.canCreateVIPClub(creatorId);
if (eligibility.canCreate) {
  // Creator has 10+ hours
} else {
  // Show: "Need X more hours"
  console.log(`Hours needed: ${eligibility.hoursNeeded - eligibility.hoursStreamed}`);
}
```

### Create VIP Club

```typescript
const result = await unifiedVIPClubService.createVIPClub(
  creatorId,
  'Elite Squad',      // club_name
  'Rambo',            // badge_name
  '#FF1493',          // badge_color
  'Exclusive access'  // description (optional)
);

if (result.success) {
  console.log('Club created:', result.data);
}
```

### Get Creator's VIP Club

```typescript
const club = await unifiedVIPClubService.getVIPClubByCreator(creatorId);
if (club) {
  console.log('Club name:', club.club_name);
  console.log('Badge name:', club.badge_name);
  console.log('Total members:', club.total_members);
}
```

### Check if User is VIP Member

```typescript
const isMember = await unifiedVIPClubService.isVIPMember(creatorId, userId);
```

### Get VIP Badge Data for Chat

```typescript
const badgeData = await unifiedVIPClubService.getVIPBadgeData(creatorId, userId);
if (badgeData.isMember) {
  console.log('Badge name:', badgeData.badgeName);
  console.log('Badge color:', badgeData.badgeColor);
  console.log('VIP level:', badgeData.vipLevel);
}
```

### Display VIP Badge in Chat

```tsx
import UnifiedVIPClubBadge from '@/components/UnifiedVIPClubBadge';

<UnifiedVIPClubBadge
  creatorId={creatorId}
  userId={userId}
  size="medium"
  showLevel={true}
/>
```

### Get VIP Club Members

```typescript
const members = await unifiedVIPClubService.getVIPClubMembers(clubId);
members.forEach(member => {
  console.log(`${member.profiles.display_name} - Level ${member.vip_level}`);
  console.log(`Total gifted: ${member.total_gifted_sek} SEK`);
});
```

### Send VIP Club Chat Message

```typescript
const result = await unifiedVIPClubService.sendVIPClubChatMessage(
  clubId,
  userId,
  'Hello VIP members!'
);

if (result.success && result.data) {
  // Broadcast to all members
  await unifiedVIPClubService.broadcastVIPClubChatMessage(clubId, result.data);
}
```

### Subscribe to VIP Club Chat

```typescript
const channel = unifiedVIPClubService.subscribeToVIPClubChat(
  clubId,
  (message) => {
    console.log('New message:', message.message);
    console.log('From:', message.profiles.display_name);
  }
);

// Cleanup
supabase.removeChannel(channel);
```

### Get Top 50 VIP Clubs

```typescript
const topClubs = await unifiedVIPClubService.getTop50VIPClubs();
topClubs.forEach((club, index) => {
  console.log(`#${index + 1}: ${club.club_name} - ${club.total_members} members`);
});
```

### Send Announcement to VIP Members

```typescript
const result = await unifiedVIPClubService.sendVIPClubAnnouncement(
  clubId,
  creatorId,
  'Special Event',
  'Join my stream tonight at 8 PM!'
);

console.log(`Sent to ${result.sentCount} members`);
```

### Calculate SEK Needed for Next Level

```typescript
const sekNeeded = unifiedVIPClubService.calculateSEKForNextLevel(
  currentLevel,
  currentTotal
);
console.log(`Need ${sekNeeded} SEK more for next level`);
```

## Level Calculation Formula

```typescript
// Level 1 = 0 SEK
// Level 20 = 25,000 SEK
// Linear progression

function calculateLevel(totalSEK: number): number {
  if (totalSEK <= 0) return 1;
  if (totalSEK >= 25000) return 20;
  return 1 + Math.floor((totalSEK / 25000) * 19);
}
```

## Superscript Conversion

```typescript
const getSuperscript = (num: number): string => {
  const superscripts: { [key: string]: string } = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  };
  return num.toString().split('').map(d => superscripts[d] || d).join('');
};

// Example: getSuperscript(20) → "²⁰"
```

## Context Usage

```typescript
import { useVIPClub } from '@/contexts/VIPClubContext';

function MyComponent() {
  const { 
    club,              // Current club or null
    isLoading,         // Loading state
    canCreateClub,     // Can create (10+ hours)
    hoursStreamed,     // Current hours
    hoursNeeded,       // Hours needed (10)
    refreshClub        // Refresh function
  } = useVIPClub();

  if (!club) {
    return <Text>No VIP Club</Text>;
  }

  return <Text>{club.club_name}</Text>;
}
```

## Database Queries

### Get VIP Club with Members

```sql
SELECT 
  vc.*,
  COUNT(vcm.id) FILTER (WHERE vcm.status = 'active') as active_members
FROM vip_clubs vc
LEFT JOIN vip_club_members vcm ON vcm.club_id = vc.id
WHERE vc.creator_id = 'creator-uuid'
GROUP BY vc.id;
```

### Get Top Gifters in Club

```sql
SELECT 
  vcm.user_id,
  p.display_name,
  vcm.vip_level,
  vcm.total_gifted_sek
FROM vip_club_members vcm
JOIN profiles p ON p.id = vcm.user_id
WHERE vcm.club_id = 'club-uuid' AND vcm.status = 'active'
ORDER BY vcm.total_gifted_sek DESC
LIMIT 10;
```

### Get Gift History for Member

```sql
SELECT 
  vgt.*,
  g.name as gift_name,
  g.price_sek
FROM vip_gift_tracking vgt
JOIN gifts g ON g.id = vgt.gift_id
WHERE vgt.club_id = 'club-uuid' AND vgt.member_id = 'user-uuid'
ORDER BY vgt.created_at DESC;
```

## Troubleshooting

### VIP Level Not Updating
1. Check if user is active VIP member
2. Verify gift_events INSERT completed
3. Check trigger execution in logs
4. Manually run: `SELECT calculate_vip_level(total_sek)`

### Badge Not Showing in Chat
1. Verify user is active VIP member
2. Check badge data cache
3. Refresh badge data: `loadVIPBadge(userId)`
4. Verify creator_id matches stream owner

### Chat Messages Not Appearing
1. Check Realtime subscription status
2. Verify RLS policies allow access
3. Check channel name: `vip_club:{clubId}:chat`
4. Verify user is active member

### Top 50 Not Showing Club
1. Check `total_members` count
2. Verify `is_active = true`
3. Check if club is in top 50 by count
4. Refresh ranking data

## Performance Tips

1. **Cache VIP Badge Data** - Don't fetch on every message
2. **Batch Member Queries** - Use single query with JOIN
3. **Index Usage** - Queries use indexes for speed
4. **Realtime Channels** - Reuse channels, don't create duplicates
5. **Pagination** - Limit chat messages to last 50

## Security Notes

1. **RLS Enforced** - All queries respect RLS policies
2. **Creator Validation** - Only creator can modify club
3. **Member Validation** - Only active members can chat
4. **10-Hour Check** - Enforced at database level
5. **Input Validation** - All inputs validated before DB insert

## Common Patterns

### Show VIP Badge in List

```tsx
{members.map(member => (
  <View key={member.id}>
    <Text>{member.profiles.display_name}</Text>
    <UnifiedVIPClubBadge
      creatorId={creatorId}
      userId={member.user_id}
      size="small"
    />
    <Text>Level {member.vip_level}</Text>
  </View>
))}
```

### Restrict Stream to VIP Only

```typescript
// In pre-live setup
const [selectedVIPClub, setSelectedVIPClub] = useState<string | null>(null);

// Pass to broadcast screen
router.push({
  pathname: '/broadcast',
  params: {
    selectedVIPClub: selectedVIPClub || '',
  },
});

// In broadcast screen - check viewer access
const canWatch = selectedVIPClub 
  ? await unifiedVIPClubService.isVIPMember(creatorId, viewerId)
  : true;
```

### Display Level Progress

```typescript
const member = await unifiedVIPClubService.getVIPMemberDetails(clubId, userId);
const sekNeeded = unifiedVIPClubService.calculateSEKForNextLevel(
  member.vip_level,
  member.total_gifted_sek
);

console.log(`${sekNeeded} SEK needed for Level ${member.vip_level + 1}`);
```

## Constants

```typescript
const VIP_LEVEL_MAX = 20;
const VIP_LEVEL_MIN = 1;
const VIP_MAX_SEK = 25000;
const VIP_UNLOCK_HOURS = 10;
const VIP_MONTHLY_PRICE_SEK = 30;
const VIP_CREATOR_SHARE = 0.70; // 70%
const VIP_PLATFORM_SHARE = 0.30; // 30%
```

## File Locations

- **Service:** `app/services/unifiedVIPClubService.ts`
- **Context:** `contexts/VIPClubContext.tsx`
- **Badge Component:** `components/UnifiedVIPClubBadge.tsx`
- **Panel Component:** `components/UnifiedVIPClubPanel.tsx`
- **Editor Modal:** `components/UnifiedBadgeEditorModal.tsx`
- **Chat Screen:** `app/screens/VIPClubChatScreen.tsx`
- **Ranking Screen:** `app/screens/VIPClubsTop50Screen.tsx`
- **Migration:** Applied via `apply_migration` tool

## Support Tables

- `vip_clubs` - Club configuration
- `vip_club_members` - Members with levels
- `vip_club_chat_messages` - Chat messages
- `vip_gift_tracking` - Gift history
- `vip_club_conversations` - Inbox conversations
- `gift_events` - Triggers level updates
- `profiles` - Stores total_streaming_hours
