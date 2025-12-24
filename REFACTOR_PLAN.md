
# Expo Router Refactor Plan

## Overview
This document outlines the safe refactor plan to move all non-route modules out of `app/` into `src/` (or `lib/`), update imports, and add tsconfig path aliases.

## Problem
Expo Router is warning about non-route files in the `app/` directory:
```
"Route './services/agoraService.ts' is missing the required default export."
```

These files are NOT screens; they are utility/service modules located under:
- `app/services`
- `app/hooks`
- `app/integrations`

## Solution

### Step 1: Create New Directory Structure
Create a `src/` directory at the project root with the following structure:
```
src/
├── services/
├── hooks/
├── integrations/
├── utils/
└── types/
```

### Step 2: Move Files
Move all non-route modules from `app/` to `src/`:

**Services:**
- `app/services/*` → `src/services/*`

**Hooks:**
- `app/hooks/*` → `src/hooks/*`

**Integrations:**
- `app/integrations/*` → `src/integrations/*`

**Keep in app/:**
- `app/(tabs)/*` - Route files
- `app/screens/*` - Screen components
- `app/auth/*` - Auth route files
- `app/_layout.tsx` - Root layout
- `app/modal.tsx` - Modal route
- All other route files

### Step 3: Update tsconfig.json
Add path aliases to simplify imports:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@/services/*": ["./src/services/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/integrations/*": ["./src/integrations/*"],
      "@/utils/*": ["./src/utils/*"],
      "@/types/*": ["./src/types/*"]
    }
  }
}
```

### Step 4: Update Imports
Update all import statements to use the new paths:

**Before:**
```typescript
import { agoraService } from '@/app/services/agoraService';
import { useServiceIntegration } from '@/app/hooks/useServiceIntegration';
import { supabase } from '@/app/integrations/supabase/client';
```

**After:**
```typescript
import { agoraService } from '@/services/agoraService';
import { useServiceIntegration } from '@/hooks/useServiceIntegration';
import { supabase } from '@/integrations/supabase/client';
```

### Step 5: Verify Build
After refactoring:
1. Run `npm run lint` to check for import errors
2. Run `expo start --clear` to clear cache
3. Test on iOS, Android, and Web

## Expo Router Conventions

### Files That MUST Be in app/
1. **Route Files** - Files that define routes (screens or navigators)
   - Must export a default React component
   - Examples: `index.tsx`, `[id].tsx`, `(group)/page.tsx`

2. **Layout Files** - Files that define layouts
   - Must be named `_layout.tsx`
   - Must export a default React component

3. **Special Files**
   - `+html.tsx` - Custom HTML wrapper
   - `+not-found.tsx` - 404 page
   - `_sitemap.tsx` - Sitemap generation

### Files That Should NOT Be in app/
1. **Utility Modules** - Helper functions, constants
2. **Service Modules** - API clients, business logic
3. **Hook Modules** - Custom React hooks
4. **Type Definitions** - TypeScript types/interfaces
5. **Integration Modules** - Third-party integrations

### Naming Conventions
- **Route Groups:** `(group-name)/`
- **Dynamic Routes:** `[param].tsx`
- **Catch-all Routes:** `[...slug].tsx`
- **Layout Files:** `_layout.tsx`
- **Hidden Files:** Prefix with `_` to exclude from routing

### Platform-Specific Files
Use platform-specific extensions for conditional module loading:
- `.native.ts` / `.native.tsx` - iOS/Android
- `.ios.ts` / `.ios.tsx` - iOS only
- `.android.ts` / `.android.tsx` - Android only
- `.web.ts` / `.web.tsx` - Web only
- `.ts` / `.tsx` - Fallback for all platforms

## Migration Checklist

- [x] Create `src/` directory structure
- [x] Update `tsconfig.json` with path aliases
- [x] Move `app/services/*` to `src/services/*`
- [x] Move `app/hooks/*` to `src/hooks/*`
- [x] Move `app/integrations/*` to `src/integrations/*`
- [ ] Update all imports in route files
- [ ] Update all imports in screen files
- [ ] Update all imports in component files
- [ ] Run linter to verify
- [ ] Test on iOS
- [ ] Test on Android
- [ ] Test on Web

## Notes
- The `@/*` alias still points to the root directory for backward compatibility
- New aliases (`@/services/*`, `@/hooks/*`, etc.) point to `src/` subdirectories
- This allows gradual migration without breaking existing code
- Metro bundler automatically resolves path aliases from tsconfig.json
