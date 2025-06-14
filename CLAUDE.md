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
- **Thread-based conversations**: Stored in Supabase database with user isolation
- **Real-time streaming**: Word-by-word response streaming with typing indicators
- **Multi-model support**: OpenAI reasoning models (o1, o3-mini, o4-mini, gpt-4.1) and standard models
- **Responses API**: Uses OpenAI's latest responses API exclusively (never completions API)
- **Automatic model detection**: Intelligently handles reasoning vs standard models (temperature parameter handling)
- **Message persistence**: Full conversation history stored in `chat_messages` table
- **Thread management**: Create, delete, and switch between conversation threads

#### Advanced Memory System
Kai features a sophisticated dual-memory architecture that enables truly personalized conversations:

**Short-term Memory** (Thread-specific, temporary):
- **Conversation Context**: Current topics, recent questions, clarifications, working memory
- **Task Progress**: Active projects, decisions made, next steps  
- **Emotional Context**: Current mood, concerns raised in session
- **Session Metadata**: Temporary preferences, tools used this session
- **Storage**: Supabase `short_term_memory` table with thread-level isolation

**Long-term Memory** (User-specific, persistent):
- **Personal**: Identity (name, age, location), background, personality traits, health info
- **Professional**: Career details, expertise, work history, goals, company information  
- **Relationships**: Family, friends, colleagues, pets with names and details
- **Preferences**: Interests, lifestyle, technology preferences, communication style
- **Events**: Birthdays, anniversaries, important dates, recurring appointments
- **Context**: Financial constraints, time zones, availability, limitations
- **Storage**: Supabase `long_term_memory` table with vector embeddings for semantic search

**Memory Processing Pipeline**:
1. **Extraction**: AI analyzes each conversation for memorable information
2. **Categorization**: Automatic classification into structured categories with importance scoring
3. **Storage**: Short-term saved immediately, long-term converted to embeddings  
4. **Retrieval**: Semantic search finds relevant memories for context
5. **Context Building**: Memories formatted and provided to AI for personalized responses

**Key Features**:
- **Semantic Search**: Vector similarity matching for intelligent memory retrieval
- **Automatic Categorization**: AI-powered classification following comprehensive taxonomy
- **Importance Scoring**: 1-5 scale weighting for memory relevance
- **Privacy by Design**: All memories isolated by user_id with RLS security
- **Real-time Updates**: Memory notifications in UI when information is saved

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
- **Database Storage**: Threads stored in Supabase `chat_threads` table with user isolation
- **Message Persistence**: All messages saved to `chat_messages` table with metadata
- **Thread Utilities**: Use `chatThreads.ts` for client-side thread management
- **Memory Integration**: Each thread maintains its own short-term memory context
- **API Endpoints**: 
  - `GET /api/chat/threads` - List user's threads
  - `GET /api/chat/threads/{threadId}` - Get thread with messages
  - `POST /api/chat/threads` - Create new thread
  - `DELETE /api/chat/threads/{threadId}` - Delete thread and messages

#### Modifying UI Components
- Base components in `client/src/components/ui/`
- Follow existing patterns from Radix UI
- Maintain dark/light theme support

#### API Development
- **Main Routes**: Add routes in `server/routes.ts` for Express server
- **Vercel Functions**: Serverless functions in `/api` directory for production deployment
- **Memory APIs**: Dedicated endpoints for short-term and long-term memory operations
- **OpenAI Integration**: All AI requests use responses API with automatic model detection
- **Type Safety**: Use TypeScript types from `shared/` for request/response schemas
- **Error Handling**: Comprehensive error logging and user-friendly error messages
- **Key Endpoints**:
  - `POST /api/chat/stream` - Streaming chat with memory integration
  - `GET/POST /api/memory/short-term` - Short-term memory operations  
  - `GET/POST /api/memory/long-term` - Long-term memory with semantic search
  - `GET/POST /api/integrations` - Manage API keys and service integrations

### Important Security Considerations

#### Authentication Security
- AuthGuard NEVER shows protected content during loading
- All protected routes require both `authEnabled` AND `user` to exist
- Direct URL access to protected routes always redirects to `/auth` if not authenticated
- No mock users or data shown without proper authentication

#### Data Privacy
- **User Isolation**: All data isolated by user_id with Supabase Row Level Security (RLS)
- **Memory Privacy**: Both short-term and long-term memories are user-specific and encrypted
- **API Key Security**: User API keys stored securely in database, never logged or exposed
- **Anonymous Fallback**: When auth disabled, uses anonymous localStorage-based storage
- **Data Ownership**: Users own all their conversation and memory data
- **Secure Embeddings**: Vector embeddings generated client-side or with user's API key

### Testing Authentication

Run `npm run dev` and test:
1. **Without Supabase**: Should redirect all routes to `/auth` with setup instructions
2. **With Supabase (not logged in)**: Should redirect all routes to `/auth` login form
3. **Direct URL access**: Navigate directly to `/memory` or `/settings` - should redirect to `/auth`

### Recent Updates

- **Advanced Memory System**: Comprehensive dual-memory architecture with semantic search
- **OpenAI Responses API**: Migrated to responses API for all models, supporting reasoning models
- **Database Persistence**: Full conversation and memory storage in Supabase with RLS
- **Memory Categorization**: AI-powered classification of information into structured categories
- **Real-time Streaming**: Enhanced streaming with typing indicators and smooth UI transitions
- **Model Detection**: Automatic handling of reasoning vs standard models (temperature parameters)
- **Fast Authentication Flow**: Removed all artificial delays, instant redirects
- **Strict Security**: No protected content shown during auth checks, user data isolation
- **Error Handling**: Comprehensive error logging and recovery throughout the system

### Memory System Implementation

#### Memory Categories

**Long-term Memory Categories:**
- `personal`: identity, location, background, physical, personality
- `professional`: career, expertise, history, goals
- `relationships`: family, social, professional, pets  
- `preferences`: interests, lifestyle, technology, communication, learning
- `events`: recurring, upcoming, historical
- `context`: financial, constraints

**Short-term Memory Categories:**
- `conversation`: current_topic, recent_questions, clarifications, working_memory
- `task_progress`: active_projects, decisions_made, next_steps
- `emotional_context`: current_mood, concerns
- `session_metadata`: preferences_stated, tools_used

#### Implementation Details

**Memory Extraction Process:**
1. After each conversation exchange, AI analyzes content for memorable information
2. Information is categorized using comprehensive taxonomy with importance scoring
3. Short-term memories saved immediately to thread-specific storage
4. Long-term memories converted to vector embeddings for semantic search
5. Future conversations retrieve relevant memories as context

**Database Schema:**
- `chat_threads`: Thread metadata with user isolation
- `chat_messages`: Full message history with model and token metadata  
- `short_term_memory`: Thread-specific temporary context
- `long_term_memory`: User-specific persistent knowledge with embeddings
- `integrations`: User API keys and service configurations

**Key Functions:**
- `extractMemories()`: AI-powered memory extraction and categorization
- `fetchMemories()`: Semantic search and context retrieval
- `generateEmbedding()`: Vector embedding generation for long-term storage
- `buildMemoryContext()`: Format memories for AI context