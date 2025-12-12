
# Stream Data Normalization System

## Overview

This system ensures that all stream objects rendered in the app follow a consistent schema, preventing crashes due to undefined or missing fields.

## Problem

The original implementation had several issues:
- Direct nested property access (e.g., `stream.users.avatar`) without null checks
- Inconsistent data shapes from different Supabase queries
- Missing user profile joins in queries
- No fallback values for missing data

## Solution

### 1. Data Normalization Layer (`utils/streamNormalizer.ts`)

The normalization layer provides:
- **Type Safety**: `NormalizedStream` interface guarantees all required fields exist
- **Safe Accessors**: Helper functions with fallback values
- **Consistent Schema**: All streams follow the same structure

### 2. Stream Service (`app/services/streamService.ts`)

Centralized service for fetching streams with:
- Automatic user profile joins
- Consistent query patterns
- Error handling
- Data normalization

### 3. Updated Components

All components that display streams now use:
- `NormalizedStream` type instead of raw Supabase types
- Safe property access with optional chaining
- Fallback UI elements for missing data

## Usage

### Fetching Streams

```typescript
import { fetchLiveStreams } from '@/app/services/streamService';
import { NormalizedStream } from '@/utils/streamNormalizer';

// Fetch live streams
const streams: NormalizedStream[] = await fetchLiveStreams();

// All fields are guaranteed to exist
streams.forEach(stream => {
  console.log(stream.user.avatar); // Always defined
  console.log(stream.viewer_count); // Always a number
  console.log(stream.thumbnail_url); // Always a string
});
```

### Manual Normalization

```typescript
import { normalizeStream, normalizeStreams } from '@/utils/streamNormalizer';

// Normalize a single stream
const normalized = normalizeStream(rawStreamData);

// Normalize multiple streams
const normalizedList = normalizeStreams(rawStreamDataArray);
```

### Using in Components

```typescript
import { NormalizedStream } from '@/utils/streamNormalizer';

interface Props {
  stream: NormalizedStream;
}

function StreamCard({ stream }: Props) {
  return (
    <View>
      <Image source={{ uri: stream.thumbnail_url }} />
      <Text>{stream.title}</Text>
      <Text>{stream.user.display_name}</Text>
      <Text>{stream.viewer_count} viewers</Text>
    </View>
  );
}
```

## Guaranteed Fields

Every `NormalizedStream` object has:

```typescript
{
  id: string;                    // Stream ID
  title: string;                 // Stream title (fallback: "Untitled Stream")
  thumbnail_url: string;         // Thumbnail URL (fallback: Unsplash placeholder)
  viewer_count: number;          // Viewer count (fallback: 0)
  is_live: boolean;              // Live status
  user: {
    id: string;                  // User ID
    username: string;            // Username (fallback: "Unknown")
    display_name: string;        // Display name (fallback: "Unknown")
    avatar: string;              // Avatar URL (fallback: default avatar)
    verified_status: boolean;    // Verification status (fallback: false)
  };
  start_time: string;            // ISO timestamp
  broadcaster_id: string;        // Broadcaster user ID
  status: string;                // Stream status
  cloudflare_stream_id: string | null;
  playback_url: string | null;
}
```

## Fallback Values

- **Avatar**: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200`
- **Thumbnail**: `https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=400&h=600&fit=crop`
- **Username**: `"Unknown"`
- **Viewer Count**: `0`
- **Verified Status**: `false`

## Supabase Query Pattern

Always join user profiles when fetching streams:

```typescript
const { data } = await supabase
  .from('streams')
  .select(`
    *,
    users:broadcaster_id (
      id,
      display_name,
      avatar,
      verified_status
    )
  `)
  .eq('status', 'live');
```

## Migration Guide

### Before

```typescript
// ❌ Unsafe - can crash
const avatar = stream.users.avatar;
const username = stream.user.username;
const viewers = stream.viewer_count;
```

### After

```typescript
// ✅ Safe - guaranteed to work
import { normalizeStream } from '@/utils/streamNormalizer';

const normalized = normalizeStream(stream);
const avatar = normalized.user.avatar;
const username = normalized.user.username;
const viewers = normalized.viewer_count;
```

## Testing

To test the normalization system:

1. **Test with missing data**:
   ```typescript
   const incompleteStream = {
     id: '123',
     title: 'Test',
     broadcaster_id: 'user123',
     status: 'live',
     // Missing users, viewer_count, etc.
   };
   
   const normalized = normalizeStream(incompleteStream);
   // Should not crash and have all fallback values
   ```

2. **Test with null values**:
   ```typescript
   const streamWithNulls = {
     id: '123',
     title: null,
     users: null,
     viewer_count: null,
     // ...
   };
   
   const normalized = normalizeStream(streamWithNulls);
   // Should handle nulls gracefully
   ```

## Best Practices

1. **Always use the stream service** for fetching streams
2. **Always normalize** raw stream data before rendering
3. **Use TypeScript types** to catch errors at compile time
4. **Test with incomplete data** to ensure robustness
5. **Update queries** to include user profile joins

## Affected Screens

The following screens have been updated to use the normalization system:

- ✅ Home Feed (`app/(tabs)/(home)/index.tsx`)
- ✅ Stream Preview Card (`components/StreamPreviewCard.tsx`)
- 🔄 Explore Grid (needs update)
- 🔄 Profile Past Streams (needs update)
- 🔄 Multiguest Stream Lobby (needs update)
- 🔄 Replay Lists (needs update)
- 🔄 Recommended Creators (needs update)

## Future Improvements

1. Add caching layer for normalized streams
2. Implement real-time updates with normalization
3. Add validation for stream data
4. Create unit tests for normalization functions
5. Add performance monitoring
