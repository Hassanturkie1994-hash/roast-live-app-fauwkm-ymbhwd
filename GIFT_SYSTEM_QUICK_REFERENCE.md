
# Gift System Quick Reference

## ⚠️ CRITICAL: Correct Import

### ❌ WRONG (Will Crash)
```typescript
import { ROAST_GIFTS } from '@/constants/RoastGiftManifest';
// ROAST_GIFTS is undefined → .map() will crash
```

### ✅ CORRECT
```typescript
import { ROAST_GIFT_MANIFEST, RoastGiftTier } from '@/constants/RoastGiftManifest';
// ROAST_GIFT_MANIFEST is the correct export
```

---

## 🎁 Gift Catalog Overview

### Total Gifts: 45

| Tier | Price Range | Count | Description |
|------|-------------|-------|-------------|
| LOW | 1-10 SEK | 12 | Cheap Heckles |
| MID | 20-100 SEK | 10 | Crowd Reactions |
| HIGH | 150-500 SEK | 10 | Roast Weapons |
| ULTRA | 700-4000 SEK | 13 | Battle Disruptors |

---

## 🛡️ Safety Guards (MANDATORY)

### Rule 1: Always Validate Arrays

```typescript
// ❌ WRONG
const gifts = ROAST_GIFT_MANIFEST;
gifts.map(gift => <View>{gift.name}</View>); // Might crash

// ✅ CORRECT
const gifts = ROAST_GIFT_MANIFEST || [];
if (gifts.length > 0) {
  gifts.map(gift => <View>{gift.name}</View>);
}
```

### Rule 2: Use useMemo for Arrays

```typescript
const allGifts = useMemo(() => {
  if (!ROAST_GIFT_MANIFEST || !Array.isArray(ROAST_GIFT_MANIFEST)) {
    console.error('❌ ROAST_GIFT_MANIFEST is not an array');
    return [];
  }
  return ROAST_GIFT_MANIFEST;
}, []);
```

### Rule 3: Handle Empty States

```typescript
if (!gifts || gifts.length === 0) {
  return <EmptyState />;
}
```

---

## 📦 Gift Object Structure

```typescript
interface RoastGift {
  giftId: string;           // Unique identifier
  displayName: string;      // Display name
  priceSEK: number;         // Price in SEK
  tier: RoastGiftTier;      // LOW | MID | HIGH | ULTRA
  animationType: string;    // OVERLAY | AR | CINEMATIC
  soundProfile: string;     // Sound effect name
  priority: number;         // Animation priority
  emoji: string;            // Visual emoji
  description: string;      // Gift description
  cinematicTimeline?: CinematicTimeline; // Optional cinematic data
}
```

---

## 🔧 Helper Functions

### Get Gift by ID
```typescript
import { getRoastGiftById } from '@/constants/RoastGiftManifest';

const gift = getRoastGiftById('boo');
if (gift) {
  console.log(gift.displayName); // "Boo"
}
```

### Get Gifts by Tier
```typescript
import { getRoastGiftsByTier } from '@/constants/RoastGiftManifest';

const lowTierGifts = getRoastGiftsByTier('LOW');
console.log(lowTierGifts.length); // 12
```

### Get Gifts by Price Range
```typescript
import { getRoastGiftsByPriceRange } from '@/constants/RoastGiftManifest';

const affordableGifts = getRoastGiftsByPriceRange(1, 50);
```

---

## 🎨 Tier Colors

```typescript
function getTierColor(tier: RoastGiftTier): string {
  switch (tier) {
    case 'LOW':
      return '#4CAF50'; // Green
    case 'MID':
      return '#FF9800'; // Orange
    case 'HIGH':
      return '#9C27B0'; // Purple
    case 'ULTRA':
      return '#E91E63'; // Pink
    default:
      return '#999999'; // Gray
  }
}
```

---

## 🚀 Usage Examples

### Display All Gifts
```typescript
import { ROAST_GIFT_MANIFEST } from '@/constants/RoastGiftManifest';

const gifts = ROAST_GIFT_MANIFEST || [];

return (
  <ScrollView>
    {gifts.map((gift, index) => (
      <View key={`${gift.giftId}-${index}`}>
        <Text>{gift.emoji} {gift.displayName}</Text>
        <Text>{gift.priceSEK} SEK</Text>
      </View>
    ))}
  </ScrollView>
);
```

### Filter by Tier
```typescript
const [selectedTier, setSelectedTier] = useState<RoastGiftTier | null>(null);

const filteredGifts = useMemo(() => {
  const allGifts = ROAST_GIFT_MANIFEST || [];
  if (!selectedTier) return allGifts;
  return allGifts.filter(gift => gift.tier === selectedTier);
}, [selectedTier]);
```

### Send Gift
```typescript
import { roastGiftService } from '@/app/services/roastGiftService';

const result = await roastGiftService.sendGift(
  'boo',           // giftId
  senderId,        // sender user ID
  creatorId,       // creator user ID
  streamId         // stream ID (or null)
);

if (result.success) {
  console.log('✅ Gift sent successfully');
} else {
  console.error('❌ Gift failed:', result.error);
}
```

---

## 📊 Service Integration

### Initialize Service
```typescript
import { roastGiftService } from '@/app/services/roastGiftService';

// Initialize on app start
roastGiftService.initialize();
```

### Subscribe to Gifts
```typescript
const unsubscribe = roastGiftService.subscribeToGifts(
  streamId,
  (giftData) => {
    console.log('🎁 Gift received:', giftData);
    // Show animation
  }
);

// Cleanup
return () => unsubscribe();
```

### Get Creator Earnings
```typescript
const earnings = await roastGiftService.getCreatorEarnings(creatorId);
console.log('Total earned:', earnings.totalEarnedSek, 'SEK');
console.log('Creator payout:', earnings.creatorPayout, 'SEK');
```

---

## 🎬 Animation Types

### OVERLAY
- Simple overlay animation
- Duration: 1-2 seconds
- Non-blocking

### AR
- Augmented reality effect
- Duration: 1.5-2 seconds
- Face tracking (optional)

### CINEMATIC
- Fullscreen takeover
- Duration: 5 seconds
- Blocks UI during playback
- Timeline-based keyframes

---

## 🔍 Debugging

### Check Gift Catalog
```typescript
console.log('Total gifts:', ROAST_GIFT_MANIFEST.length);
console.log('First gift:', ROAST_GIFT_MANIFEST[0]);
```

### Validate Gift ID
```typescript
const gift = getRoastGiftById('invalid_id');
if (!gift) {
  console.error('❌ Gift not found');
}
```

### Check Tier Distribution
```typescript
const tiers = ['LOW', 'MID', 'HIGH', 'ULTRA'];
tiers.forEach(tier => {
  const count = getRoastGiftsByTier(tier as RoastGiftTier).length;
  console.log(`${tier}: ${count} gifts`);
});
```

---

## ⚠️ Common Mistakes

### Mistake 1: Wrong Import
```typescript
// ❌ WRONG
import { ROAST_GIFTS } from '@/constants/RoastGiftManifest';

// ✅ CORRECT
import { ROAST_GIFT_MANIFEST } from '@/constants/RoastGiftManifest';
```

### Mistake 2: No Array Validation
```typescript
// ❌ WRONG
gifts.map(gift => <View>{gift.name}</View>);

// ✅ CORRECT
(gifts || []).map(gift => <View>{gift.name}</View>);
```

### Mistake 3: Missing Empty State
```typescript
// ❌ WRONG
return <View>{gifts.map(...)}</View>;

// ✅ CORRECT
if (!gifts || gifts.length === 0) {
  return <EmptyState />;
}
return <View>{gifts.map(...)}</View>;
```

---

## 📝 Checklist for New Gift Features

- [ ] Import `ROAST_GIFT_MANIFEST` (not `ROAST_GIFTS`)
- [ ] Validate array before `.map()`
- [ ] Handle loading state
- [ ] Handle empty state
- [ ] Use `useMemo` for filtered arrays
- [ ] Add TypeScript types
- [ ] Test with all tiers
- [ ] Test empty catalog
- [ ] Add console logs for debugging
- [ ] Verify no crashes

---

## 🎯 Quick Commands

### Get All Gifts
```typescript
const gifts = ROAST_GIFT_MANIFEST || [];
```

### Get Gift Count
```typescript
const count = ROAST_GIFT_MANIFEST?.length || 0;
```

### Check if Gift Exists
```typescript
const exists = !!getRoastGiftById(giftId);
```

### Get Cheapest Gift
```typescript
const cheapest = ROAST_GIFT_MANIFEST.reduce((min, gift) => 
  gift.priceSEK < min.priceSEK ? gift : min
);
```

### Get Most Expensive Gift
```typescript
const expensive = ROAST_GIFT_MANIFEST.reduce((max, gift) => 
  gift.priceSEK > max.priceSEK ? gift : max
);
```

---

**Remember: Always validate arrays before using `.map()`, `.filter()`, or `.reduce()`!**
