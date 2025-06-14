# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev` - Start development server on port 8000 (auto-kills port conflicts)
- `npm run dev:safe` - Cross-platform alternative with colored output
- `npm run dev:port` - Start on custom port (use `PORT=3000 npm run dev:port`)

### Build & Production
- `npm run build` - Build client (Vite) and server (esbuild)
- `npm run start` - Start production server
- `npm run check` - Run TypeScript type checking

### Database
- `npm run db:push` - Push database schema changes (Drizzle)

### Testing & Linting
- `npm run check` - Run TypeScript type checking
- `npm run lint` - Run linter (command to be configured)
- `npm run typecheck` - Run TypeScript type checking (command to be configured)

## Architecture

### Stack Overview
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Express.js with TypeScript
- **Database**: Supabase (PostgreSQL) with Drizzle ORM
- **Authentication**: Supabase Auth with custom user profiles
- **State Management**: React Query + Context API
- **Routing**: Wouter (client), Express (server)

### Directory Structure
```
kai/
├── client/src/
│   ├── components/     # Reusable UI components
│   │   ├── auth/      # Authentication components (AuthGuard)
│   │   ├── chat/      # Chat interface components
│   │   └── ui/        # Base UI components (Radix UI based)
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Core utilities
│   │   ├── auth-context.tsx  # Auth state management
│   │   ├── supabase.ts      # Database/auth client
│   │   ├── chatThreads.ts   # Chat thread management
│   │   └── theme.tsx        # Theme management
│   ├── pages/         # Page components
│   └── App.tsx       # Root component with routing
├── server/
│   ├── index.ts      # Express server entry
│   └── routes.ts     # API route registration
└── shared/           # Shared types between client/server
```

### Key Architectural Patterns

#### Authentication Flow
1. All routes are protected by `AuthGuard` component
2. Unauthenticated users redirect to `/auth` immediately (no loading screens)
3. Auth state managed by `AuthContext` using Supabase
4. When auth is disabled (no Supabase config), shows configuration instructions
5. Sign out is instant - clears state immediately and redirects
6. Session checks are fast with no artificial delays

#### Chat System
- Thread-based conversations stored in localStorage
- Messages include user/assistant roles with timestamps
- Streaming support for AI responses
- Integrations verified through localStorage

#### Memory System
- Short-term memory: Current conversation context
- Long-term memory: Persistent knowledge across sessions
- Vector storage prepared for semantic search

#### Component Hierarchy
- **Page Components**: Orchestrate and fetch data
- **Feature Components**: Business logic and local state
- **UI Components**: Pure presentation (Radix UI based)

### Important Conventions

#### From Cursor Rules (kai.mdc):
1. **Small, Safe Steps**: Implement narrowly scoped changes
2. **Module Mindset**: Design for isolation, reuse, and lazy loading
3. **State Management**: Local state → Context → External store
4. **Naming**: PascalCase components, camelCase functions, kebab-case files
5. **Performance**: First paint <1.8s, payload ≤200kB per route
6. **Security**: Escape user content, use env vars for secrets

#### Authentication Setup
- Requires Supabase project with users table (see AUTHENTICATION_SETUP.md)
- Environment variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Row Level Security enabled on users table

#### Development Notes
- Server runs on port 8000 by default
- Auto-kills port conflicts on startup
- Hot reload in development via Vite
- TypeScript path aliases: `@/` → `client/src/`, `@shared/` → `shared/`

### Common Tasks

#### Adding a New Page
1. Create component in `client/src/pages/`
2. Add route in `client/src/App.tsx` with appropriate `AuthGuard`
3. Update navigation components if needed

#### Working with Chat Threads
- Use `chatThreads.ts` utilities for thread management
- Threads stored in localStorage with unique IDs
- Messages include role, content, and timestamp

#### Modifying UI Components
- Base components in `client/src/components/ui/`
- Follow existing patterns from Radix UI
- Maintain dark/light theme support

#### API Development
- Add routes in `server/routes.ts`
- Use TypeScript types from `shared/`
- Follow Express middleware patterns

### Important Security Considerations

#### Authentication Security
- AuthGuard NEVER shows protected content during loading
- All protected routes require both `authEnabled` AND `user` to exist
- Direct URL access to protected routes always redirects to `/auth` if not authenticated
- No mock users or data shown without proper authentication

#### Data Privacy
- User data only accessible after authentication
- Chat threads tied to localStorage (consider user-specific storage)
- Memory system requires authenticated user context

### Testing Authentication

Run `npm run dev` and test:
1. **Without Supabase**: Should redirect all routes to `/auth` with setup instructions
2. **With Supabase (not logged in)**: Should redirect all routes to `/auth` login form
3. **Direct URL access**: Navigate directly to `/memory` or `/settings` - should redirect to `/auth`

### Recent Updates

- **Fast Authentication Flow**: Removed all artificial delays, instant redirects
- **Strict Security**: No protected content shown during auth checks
- **Improved Sign Out**: Instant state clearing and redirect