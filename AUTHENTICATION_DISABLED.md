# 🚨 Authentication Disabled for Development

## Overview
Authentication has been temporarily disabled to allow development without Supabase credentials. The app now uses a mock admin user and bypasses all authentication checks.

## What Was Changed

### 1. **useAuth Hook** (`src/hooks/useAuth.tsx`)
- Added `AUTH_DISABLED = true` flag at the top of the file
- Modified `useEffect` to return a mock admin user when `AUTH_DISABLED` is true
- Mock user details:
  - **ID**: `dev-admin-123`
  - **Email**: `admin@blkout.dev`
  - **Role**: `admin`
  - **Name**: `Dev Admin`
- Updated `signIn`, `signUp`, and `signOut` methods to bypass Supabase when disabled
- Set `isAdmin` and `isEditor` to always return `true` in development mode
- **All original Supabase authentication code is preserved**

### 2. **ProtectedRoute Component** (`src/components/shared/ProtectedRoute.tsx`)
- Added `AUTH_DISABLED = true` flag at the top of the file
- Modified to immediately render children when `AUTH_DISABLED` is true
- Bypasses all authentication checks and redirects
- **All original authentication logic is preserved**

## Current Behavior

✅ **Admin pages are directly accessible** - No login required  
✅ **Mock admin user is always authenticated** - Full admin privileges  
✅ **No Supabase connection needed** - Works offline for frontend development  
✅ **Build succeeds** - Application compiles without errors  

## How to Access Admin Pages

Simply navigate to any admin route:
- `/admin` - Dashboard
- `/admin/calendar` - Content Calendar
- `/admin/drafts` - Drafts
- `/admin/agents` - Agents
- `/admin/analytics` - Analytics
- `/admin/settings` - Settings

No login or credentials required!

## How to Re-Enable Authentication

When you're ready to restore full authentication:

### Step 1: Update useAuth Hook
```typescript
// In src/hooks/useAuth.tsx
const AUTH_DISABLED = false; // Change from true to false
```

### Step 2: Update ProtectedRoute Component
```typescript
// In src/components/shared/ProtectedRoute.tsx
const AUTH_DISABLED = false; // Change from true to false
```

### Step 3: Set Up Supabase
Make sure your `.env` file has valid Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

That's it! The app will automatically revert to using real Supabase authentication.

## Development Notes

- ⚠️ **Do not deploy with AUTH_DISABLED = true** - This is for development only
- 📝 All authentication code remains intact for easy re-enabling
- 🔍 Console logs show "🚨 DEV MODE" messages when auth is bypassed
- 🎨 Mock user data can be customized in `useAuth.tsx` if needed

## Git History

Changes are committed with the message:
```
Initial commit: Disable authentication for development

- Modified useAuth hook to return mock authenticated admin user
- Updated ProtectedRoute to bypass authentication checks
- All auth code kept in place with AUTH_DISABLED flag for easy re-enabling
- Mock admin user: admin@blkout.dev with full admin privileges
- Clear comments added indicating development mode
```

## Questions?

If you need to modify the mock user's permissions or data, edit the `mockUser` object in `src/hooks/useAuth.tsx`.
