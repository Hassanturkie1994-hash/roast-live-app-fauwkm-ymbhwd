
# Agora Integration Quick Reference

## 🚀 Quick Start

### 1. Set Environment Variables

In Supabase Dashboard → Edge Functions → Secrets:

```bash
AGORA_APP_ID=your_agora_app_id_here
AGORA_APP_CERTIFICATE=your_agora_certificate_here
```

### 2. Start a Stream

```typescript
// Frontend automatically calls this via useAgoraEngine hook
const { data } = await supabase.functions.invoke('start-live', {
  body: {
    title: 'My Roast Stream',
    user_id: 'user-uuid',
    channelName: 'optional-custom-channel', // Optional
    uid: 0, // Optional, 0 = auto-assign
  },
});

// Response:
{
  success: true,
  stream: {
    id: 'agora_roast_user123_1234567890',
    channel_name: 'roast_user123_1234567890',
    ...
  },
  agora: {
    token: '...',
    channelName: 'roast_user123_1234567890',
    uid: 0,
    appId: 'your_app_id',
  }
}
```

### 3. Join as Viewer

```typescript
// Viewers need to fetch the channel_name from the stream
const { data: stream } = await supabase
  .from('streams')
  .select('channel_name, agora_channel')
  .eq('id', streamId)
  .single();

// Then generate a viewer token (role = 2 = SUBSCRIBER)
// This should be done via a separate edge function
```

### 4. End Stream

```typescript
await supabase.functions.invoke('stop-live', {
  body: { stream_id: 'stream-id' },
});
```

## 📱 Frontend Usage

### Using the Hook

```tsx
import { useAgoraEngine } from '@/hooks/useAgoraEngine';

function BroadcastScreen() {
  const {
    engine,           // Agora RTC Engine instance
    isInitialized,    // Engine ready?
    isJoined,         // Joined channel?
    remoteUid,        // Guest UID (null if no guest)
    error,            // Error message
    streamId,         // Database stream ID
    channelName,      // Agora channel name
    leaveChannel,     // Function to leave channel
  } = useAgoraEngine({
    streamTitle: 'My Stream',
    userId: user.id,
    onStreamReady: (id) => console.log('Ready:', id),
    onStreamError: (err) => console.error('Error:', err),
  });

  // Render video
  return (
    <RtcSurfaceView
      canvas={{
        uid: 0,
        sourceType: VideoSourceType.VideoSourceCamera,
      }}
    />
  );
}
```

### Split-Screen for 1v1 Battles

```tsx
{remoteUid ? (
  // 1v1 Mode
  <View style={{ flex: 1 }}>
    {/* Host - Top */}
    <View style={{ flex: 1 }}>
      <RtcSurfaceView
        canvas={{ uid: 0, sourceType: VideoSourceType.VideoSourceCamera }}
      />
    </View>
    
    {/* Guest - Bottom */}
    <View style={{ flex: 1 }}>
      <RtcSurfaceView
        canvas={{ uid: remoteUid, sourceType: VideoSourceType.VideoSourceRemote }}
      />
    </View>
  </View>
) : (
  // Solo Mode
  <RtcSurfaceView
    canvas={{ uid: 0, sourceType: VideoSourceType.VideoSourceCamera }}
  />
)}
```

## 🔧 Common Operations

### Switch Camera

```typescript
engine?.switchCamera();
```

### Mute/Unmute Audio

```typescript
engine?.muteLocalAudioStream(true);  // Mute
engine?.muteLocalAudioStream(false); // Unmute
```

### Enable/Disable Video

```typescript
engine?.muteLocalVideoStream(true);  // Disable
engine?.muteLocalVideoStream(false); // Enable
```

### Leave Channel

```typescript
await leaveChannel();
```

## 🎯 Event Handlers

The hook automatically registers these events:

```typescript
{
  onJoinChannelSuccess: (connection, elapsed) => {
    // Called when successfully joined
  },
  onUserJoined: (connection, remoteUid, elapsed) => {
    // Called when guest joins (1v1 battle starts)
  },
  onUserOffline: (connection, remoteUid, reason) => {
    // Called when guest leaves
  },
  onError: (err, msg) => {
    // Called on errors
  },
}
```

## 🗄️ Database Schema

### streams Table

```sql
CREATE TABLE streams (
  id TEXT PRIMARY KEY,
  broadcaster_id UUID REFERENCES profiles(id),
  channel_name TEXT,        -- For audience to join
  agora_channel TEXT,       -- Agora RTC channel
  agora_uid INTEGER,        -- Broadcaster's UID
  title TEXT,
  status TEXT,              -- 'live' | 'ended'
  viewer_count INTEGER,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ
);
```

## 🔐 Token Generation

### Current Implementation (Simplified)

```typescript
// In start-live edge function
const token = generateAgoraToken(
  appId,
  appCertificate,
  channelName,
  uid,
  role,              // 1 = PUBLISHER, 2 = SUBSCRIBER
  expirationTimeInSeconds
);
```

### Production Implementation (TODO)

```typescript
// Install: npm install agora-access-token
import { RtcTokenBuilder, RtcRole } from 'agora-access-token';

const token = RtcTokenBuilder.buildTokenWithUid(
  appId,
  appCertificate,
  channelName,
  uid,
  RtcRole.PUBLISHER,
  privilegeExpiredTs
);
```

## ⚠️ Important Notes

1. **Token Expiration**: Tokens expire after 1 hour. Implement refresh for longer streams.
2. **Channel Names**: Case-sensitive. Use consistent naming.
3. **UID 0**: Means Agora auto-assigns. Use specific UIDs for tracking.
4. **Web Platform**: Native camera not supported on web. Use platform checks.
5. **Permissions**: Camera and microphone permissions required.

## 🐛 Troubleshooting

### "Failed to join channel"
- Check Agora App ID and Certificate
- Verify token is valid and not expired
- Ensure channel name matches exactly

### "requireNativeComponent error"
- Fixed in ARView.tsx with platform checks
- Don't use native components on web

### "No video showing"
- Check camera permissions
- Verify `enableVideo()` was called
- Check `RtcSurfaceView` canvas UID

### "Guest not appearing"
- Check `remoteUid` state
- Verify guest joined same channel
- Check guest has PUBLISHER role

## 📚 Resources

- [Agora Docs](https://docs.agora.io)
- [React Native SDK](https://github.com/AgoraIO-Extensions/react-native-agora)
- [API Reference](https://api-ref.agora.io/en/voice-sdk/react-native/4.x/API/rtc_api_overview.html)

## 🎨 AR Filters

AR filters are still supported and wrap the local video feed:

```tsx
import ARView from '@/modules/ar-filter-engine';

<ARView
  style={styles.camera}
  onFilterEngineReady={(engine) => {
    engine.applyFilter('big_eyes');
  }}
/>
```

## 🚦 Status Indicators

```tsx
// Connection status
{isInitialized && isJoined ? '🟢 Live' : '🔴 Connecting'}

// Guest status
{remoteUid ? '👥 1v1 Battle' : '👤 Solo'}
```

---

**Last Updated**: 2024-01-XX

**Version**: 1.0.0

**Status**: ✅ Production Ready (after testing)
