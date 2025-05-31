# KAI Authentication Setup Guide

## Overview
KAI now includes a complete authentication system using Supabase Auth with a custom user profile system.

## Features
- **Login/Signup Page**: Beautiful auth interface with the "Conquer" header
- **User Profiles**: Integrated with the existing Settings > Profile tab
- **Secure Authentication**: Powered by Supabase Auth
- **Automatic Redirects**: Protected routes and seamless navigation

## Setup Instructions

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be fully initialized

### 2. Set up the Users Table
Run this SQL in your Supabase SQL editor:

```sql
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text unique,
  phone text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  last_seen timestamptz,
  profile_image_url text,
  kai_persona jsonb,
  is_active boolean default true
);

-- Enable Row Level Security
alter table public.users enable row level security;

-- Create policies
create policy "Users can view own profile" on public.users
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.users
  for insert with check (auth.uid() = id);
```

### 3. Configure Environment Variables
Create a `.env` file in your project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these values in your Supabase project dashboard under Settings > API.

### 4. Configure Authentication
In your Supabase dashboard:
1. Go to Authentication > Settings
2. Configure your site URL (e.g., `http://localhost:5173` for development)
3. Enable email confirmation if desired
4. Configure any additional auth providers if needed

## How It Works

### Authentication Flow
1. **Unauthenticated users** are redirected to `/auth`
2. **Authenticated users** accessing `/auth` are redirected to home (`/`)
3. **Protected routes** (`/`, `/settings`) require authentication

### Profile Integration
- The existing Settings > Profile tab now saves to Supabase
- Fields are mapped as follows:
  - `firstName + lastName` → `full_name`
  - `biography` → `kai_persona.description`
  - `website` → `profile_image_url` (temporary mapping)
  - `username` → derived from email

### Data Flow
- **Sign Up**: Creates auth user + inserts profile record
- **Sign In**: Updates `last_seen` timestamp
- **Profile Updates**: Updates `updated_at` and `last_seen`

## Usage

### For Users
1. Visit the app - you'll be redirected to the auth page if not logged in
2. Sign up with email, password, full name, and optional phone
3. Check email for verification (if enabled)
4. Once logged in, you'll be redirected to the chat interface
5. Access Settings > Profile to update your information
6. Use the "Sign Out" button in the profile tab to log out

### For Developers
- Use `useAuth()` hook to access user state and auth functions
- User profile data is available via the `profile` property
- All routes are automatically protected via `AuthGuard` components

## Files Modified/Added

### New Files
- `client/src/lib/supabase.ts` - Supabase client and auth helpers
- `client/src/lib/auth-context.tsx` - Authentication context provider  
- `client/src/components/auth/AuthGuard.tsx` - Route protection component
- `client/src/pages/auth.tsx` - Login/signup page

### Modified Files
- `client/src/App.tsx` - Added AuthProvider and route guards
- `client/src/pages/settings.tsx` - Connected profile tab to Supabase
- `package.json` - Added @supabase/supabase-js dependency

## Security Notes
- Row Level Security (RLS) is enabled on the users table
- Users can only access their own profile data
- Authentication tokens are handled securely by Supabase
- No admin keys are exposed to the client 