# Authentication Test Instructions

## Test Scenario 1: Without Supabase Configuration

1. Ensure your `.env` file does NOT have valid Supabase credentials (or they are commented out)
2. Start the app: `npm run dev`
3. Try to access ANY protected route:
   - `http://localhost:8000` (home/chat)
   - `http://localhost:8000/memory`
   - `http://localhost:8000/settings`
4. **Expected behavior**: You should ALWAYS see "Checking authentication..." followed by redirect to `/auth`
5. **Expected behavior**: You should NEVER see any app content without authentication
6. **Expected behavior**: The auth page should show "Authentication Required" message

## Test Scenario 2: With Supabase Configuration (Not Logged In)

1. Add valid Supabase credentials to your `.env` file:
   ```
   VITE_SUPABASE_URL=your-actual-supabase-url
   VITE_SUPABASE_ANON_KEY=your-actual-anon-key
   ```
2. Restart the app: `npm run dev`
3. Try to access ANY protected route (same URLs as above)
4. **Expected behavior**: You should see "Checking authentication..." then redirect to `/auth`
5. **Expected behavior**: NEVER see any app content without being logged in
6. **Expected behavior**: The auth page shows login/signup forms

## Test Scenario 3: Direct URL Access (Critical Security Test)

1. Close your browser completely
2. Open a new browser window
3. Directly navigate to `http://localhost:8000/memory`
4. **Expected behavior**: Should see "Checking authentication..." then redirect to `/auth`
5. **Expected behavior**: Should NEVER see the memory page content

## What Was Fixed (Security Update)

1. **AuthGuard Component**: 
   - Now ALWAYS shows loading state during auth check
   - NEVER renders protected content until auth is confirmed
   - Uses strict checks: both `authEnabled` AND `user` must exist

2. **Auth Context**:
   - Always starts with `loading=true` to prevent flash of content
   - Gives AuthGuard time to redirect before showing anything

3. **Protected Pages**:
   - Added double-check authentication guards
   - Return null if auth check fails

## Previous Security Issue

The app was showing protected content during the authentication check, allowing users to see private data before being redirected. This created a serious data privacy issue where:
- Users could see memory page with mock data
- Chat threads from localStorage were visible
- Settings page was accessible

This has been completely fixed - NO protected content is ever shown without proper authentication.