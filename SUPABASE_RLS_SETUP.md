
# Supabase RLS Setup Guide

## Problem
Client-side insert fails with:
```
code 42501 "new row violates row-level security policy"
```

## Solution

### Step 1: Enable RLS

Run the following SQL in Supabase SQL Editor:

```sql
-- Enable Row Level Security on notification_preferences table
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
```

### Step 2: Create RLS Policies

```sql
-- Policy: Allow authenticated users to SELECT their own preferences
CREATE POLICY "Users can view their own notification preferences"
ON public.notification_preferences
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Allow authenticated users to INSERT their own preferences
CREATE POLICY "Users can insert their own notification preferences"
ON public.notification_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Allow authenticated users to UPDATE their own preferences
CREATE POLICY "Users can update their own notification preferences"
ON public.notification_preferences
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Allow authenticated users to DELETE their own preferences
CREATE POLICY "Users can delete their own notification preferences"
ON public.notification_preferences
FOR DELETE
USING (auth.uid() = user_id);
```

### Step 3: Verify Policies

Check that policies were created successfully:

```sql
SELECT * FROM pg_policies WHERE tablename = 'notification_preferences';
```

### Step 4: Safe Client-Side Insert

Use this pattern for inserting notification preferences:

```typescript
import { supabase } from '@/integrations/supabase/client';

async function insertNotificationPreference(preferenceData: any) {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('User not authenticated:', userError);
      return { success: false, error: 'User not authenticated' };
    }

    // Insert with user_id from auth
    const { data, error } = await supabase
      .from('notification_preferences')
      .insert([
        {
          ...preferenceData,
          user_id: user.id, // CRITICAL: Use auth.uid()
        },
      ])
      .select();

    if (error) {
      console.error('Error inserting notification preference:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Inserted notification preference:', data);
    return { success: true, data };
  } catch (err) {
    console.error('Exception inserting notification preference:', err);
    return { success: false, error: 'Failed to insert notification preference' };
  }
}
```

## Admin Access Options

### Option 1: Edge Function with Service Role (RECOMMENDED)

**Pros:**
- Service role key never exposed to client
- Full control over admin logic
- Can add additional validation
- Audit logging built-in

**Cons:**
- Requires deploying Edge Function
- Slightly more complex setup

**Implementation:**

```typescript
// supabase/functions/admin-manage-preferences/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    // Create Supabase client with SERVICE ROLE key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verify admin user (check custom claims or admin table)
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if user is admin
    const { data: adminCheck } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (adminCheck?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const { action, userId, preferenceData } = await req.json();

    // Perform admin action (bypasses RLS)
    let result;
    switch (action) {
      case 'update':
        result = await supabaseAdmin
          .from('notification_preferences')
          .update(preferenceData)
          .eq('user_id', userId);
        break;
      case 'delete':
        result = await supabaseAdmin
          .from('notification_preferences')
          .delete()
          .eq('user_id', userId);
        break;
      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify({ success: true, data: result.data }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
```

### Option 2: RLS Admin Policy (LESS SECURE)

**Pros:**
- Simpler setup
- No Edge Function needed

**Cons:**
- Admin check happens at database level
- Less flexible
- Harder to audit

**Implementation:**

```sql
-- Create admin policy
CREATE POLICY "Admins can manage all notification preferences"
ON public.notification_preferences
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);
```

## Recommendation

**Use Option 1 (Edge Function with Service Role)** for admin access because:
1. Service role key is never exposed to client
2. You can add custom validation logic
3. You can log all admin actions for audit trail
4. More secure and flexible

## Testing

### Test User Insert

```typescript
// This should work
const result = await insertNotificationPreference({
  email_notifications: true,
  push_notifications: true,
  sms_notifications: false,
});
```

### Test Admin Access (Edge Function)

```typescript
// Call admin Edge Function
const { data, error } = await supabase.functions.invoke('admin-manage-preferences', {
  body: {
    action: 'update',
    userId: 'target-user-id',
    preferenceData: {
      email_notifications: false,
    },
  },
});
```

## Troubleshooting

### Error: "new row violates row-level security policy"
- **Solution:** Make sure `user_id` matches `auth.uid()`
- **Solution:** Verify RLS policies are created correctly

### Error: "permission denied for table notification_preferences"
- **Solution:** Enable RLS with `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`

### Admin can't access other users' data
- **Solution:** Use Edge Function with service role key
- **Solution:** Or create admin RLS policy (less secure)
