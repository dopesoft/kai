# Kai - Intelligent AI Assistant with Advanced Memory

Kai is a sophisticated AI-powered chat application that combines the conversational capabilities of modern language models with an advanced memory system. Built as a ChatGPT-like interface, Kai goes beyond simple conversations by maintaining both short-term and long-term memories, enabling truly personalized and context-aware interactions.

## 🌟 Key Features

### 💬 **Advanced Chat Interface**
- **Real-time Streaming**: Experience smooth, word-by-word streaming responses
- **Thread Management**: Organize conversations into persistent threads
- **Multi-Model Support**: Works with OpenAI's latest models including reasoning models (o1, o3-mini, o4-mini, gpt-4.1)
- **Mobile-Responsive**: Optimized for both desktop and mobile experiences

### 🧠 **Intelligent Memory System**
- **Dual Memory Architecture**: Separate short-term and long-term memory systems
- **Semantic Search**: Uses vector embeddings for intelligent memory retrieval
- **Automatic Categorization**: AI-powered classification of information into structured categories
- **Persistent Context**: Maintains conversation history and personal details across sessions

### 🔐 **Flexible Authentication**
- **Supabase Integration**: Full user authentication and data isolation
- **Anonymous Mode**: Use without authentication for testing and development
- **Secure by Default**: Row-level security ensures data privacy

### ⚡ **Performance & Scalability**
- **Optimized Frontend**: React 18 with Vite for fast loading and hot reload
- **Efficient Backend**: Express.js with TypeScript for robust API handling
- **Database Optimization**: PostgreSQL with Drizzle ORM for type-safe queries

## 🏗️ Architecture Overview

### **Frontend Stack**
- **React 18** + **TypeScript** - Modern component-based UI
- **Vite** - Lightning-fast development and optimized builds
- **Tailwind CSS** - Utility-first styling with dark/light theme support
- **Radix UI** - Accessible, unstyled UI components
- **React Query** - Server state management and caching
- **Wouter** - Lightweight client-side routing

### **Backend Stack**
- **Express.js** + **TypeScript** - RESTful API server
- **Supabase** - PostgreSQL database with real-time capabilities
- **Drizzle ORM** - Type-safe database queries and migrations
- **OpenAI API** - AI model integration with responses API
- **Vector Embeddings** - Semantic search for memory retrieval

### **Memory System Architecture**

#### **Short-Term Memory**
Stores conversation context and temporary information:
- **Conversation**: Current topics, recent questions, clarifications
- **Task Progress**: Active projects, decisions made, next steps
- **Emotional Context**: Current mood, concerns raised
- **Session Metadata**: Temporary preferences, tools used

#### **Long-Term Memory** 
Stores persistent personal and professional information:
- **Personal**: Identity, location, background, personality traits
- **Professional**: Career, expertise, work history, goals
- **Relationships**: Family, friends, colleagues, pets
- **Preferences**: Interests, lifestyle, technology preferences
- **Events**: Important dates, recurring events, milestones
- **Context**: Financial constraints, availability, limitations

## 🚀 Getting Started

### **Prerequisites**
- Node.js 18+ and npm
- Supabase account (optional, for full features)
- OpenAI API key

### **Quick Setup**

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd kai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   
   Create `.env` files in both root and `server/` directories:
   
   **Root `.env`:**
   ```env
   # Supabase Configuration (optional)
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # Development
   NODE_ENV=development
   ```
   
   **Server `.env`:**
   ```env
   # Supabase (for memory system)
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # OpenAI
   OPENAI_API_KEY=your_openai_api_key
   
   # Server
   PORT=8000
   ```

4. **Database Setup** (if using Supabase)
   
   Run the provided SQL setup:
   ```bash
   # Copy contents of supabase-functions.sql to your Supabase SQL editor
   ```

5. **Start Development**
   ```bash
   npm run dev
   ```
   
   Access the app at `http://localhost:8000`

### **Available Commands**

```bash
# Development
npm run dev          # Start development server (port 8000)
npm run dev:safe     # Cross-platform alternative with colored output
npm run dev:port     # Custom port (use PORT=3000 npm run dev:port)

# Build & Production
npm run build        # Build client and server
npm run start        # Start production server

# Database
npm run db:push      # Push schema changes to Supabase

# Type Checking
npm run check        # Run TypeScript type checking
```

## 🔧 Configuration

### **Authentication Modes**

#### **1. Full Authentication (Recommended)**
- Set up Supabase project with user authentication
- Configure environment variables as shown above
- Users have isolated data and full memory features

#### **2. Anonymous Mode**
- Omit Supabase environment variables
- Chat works with localStorage persistence
- Memory system disabled, basic chat functionality only

### **Model Configuration**

Kai supports various OpenAI models:
- **Reasoning Models**: o1, o3-mini, o4-mini, gpt-4.1 (no temperature parameter)
- **Standard Models**: gpt-4, gpt-3.5-turbo (with temperature control)
- **Automatic Detection**: App automatically detects model type and adjusts parameters

### **Memory System Configuration**

The memory system can be fine-tuned through:
- **Similarity Threshold**: Adjust semantic search sensitivity (default: 0.7)
- **Memory Limits**: Configure how many memories to retrieve (default: 5 long-term, 10 short-term)
- **Importance Scoring**: Weight memories by importance (1-5 scale)

## 🧠 Memory System Deep Dive

### **How It Works**

1. **Conversation Analysis**: After each exchange, AI analyzes the conversation for memorable information
2. **Smart Categorization**: Information is automatically classified into appropriate categories
3. **Vector Storage**: Long-term memories are converted to embeddings for semantic search
4. **Context Retrieval**: Relevant memories are retrieved and provided as context for future conversations
5. **Continuous Learning**: The system continuously updates and refines stored information

### **Memory Categories Explained**

#### **Long-Term Memory Structure**
```json
{
  "category": "personal|professional|relationships|preferences|events|context",
  "key": "snake_case_identifier",
  "value": "actual_value",
  "display": "Human-readable description",
  "importance": 1-5,
  "embedding": [vector_data],
  "metadata": {
    "auto_captured": true,
    "subcategory": "specific_type",
    "extracted_from": "conversation"
  }
}
```

#### **Short-Term Memory Structure**
```json
{
  "display": "Natural language description",
  "tags": ["conversation", "current_topic"],
  "timestamp": "2024-01-01T00:00:00Z",
  "thread_id": "thread_identifier"
}
```

### **Privacy & Data Handling**

- **User Isolation**: All memories are tied to specific user IDs
- **Secure Storage**: Row-level security in Supabase ensures data privacy
- **Automatic Cleanup**: Short-term memories can be configured to expire
- **Export/Import**: Users can export their memory data (future feature)

## 🎨 User Interface

### **Chat Interface**
- **Message Threading**: Conversations organized in collapsible threads
- **Typing Indicators**: Visual feedback during AI thinking and response generation
- **Streaming Support**: Real-time word-by-word response display
- **Mobile Optimization**: Responsive design that works on all screen sizes

### **Memory Visualization**
- **Memory Tabs**: Browse and search through stored memories
- **Category Filtering**: Filter memories by type and importance
- **Search Functionality**: Full-text and semantic search capabilities
- **Memory Insights**: View how memories influence AI responses

### **Settings & Configuration**
- **Integration Management**: Connect OpenAI and other services
- **Theme Switching**: Dark/light mode with system preference detection
- **Memory Controls**: Configure memory retention and categorization settings

## 🔌 API Integration

### **OpenAI Integration**
- **Responses API**: Uses OpenAI's latest responses API for all models
- **Automatic Model Detection**: Intelligently handles different model types
- **Error Handling**: Robust error handling with fallback responses
- **Token Management**: Efficient token usage and cost optimization

### **Supabase Integration**
- **Real-time Subscriptions**: Live updates for thread changes
- **Automatic Backups**: Built-in backup and recovery
- **Scalable Storage**: Handle millions of messages and memories
- **RLS Security**: Row-level security for multi-tenant architecture

## 🚀 Deployment

### **Production Deployment**

#### **Vercel (Recommended)**
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy with automatic builds and previews

#### **Docker Deployment**
```bash
# Build production image
docker build -t kai-app .

# Run with environment variables
docker run -p 8000:8000 --env-file .env kai-app
```

#### **Manual Deployment**
```bash
# Build for production
npm run build

# Start production server
npm run start
```

### **Environment Variables for Production**
```env
# Required
OPENAI_API_KEY=your_openai_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional
PORT=8000
NODE_ENV=production
```

## 🧪 Testing

### **Manual Testing Checklist**
- [ ] Authentication flow (login/logout)
- [ ] Thread creation and selection
- [ ] Message sending and streaming
- [ ] Memory extraction and storage
- [ ] Memory retrieval and context usage
- [ ] Error handling and recovery

### **Memory System Testing**
Test memory categorization by having conversations that include:
- Personal information (name, location, background)
- Professional details (job, company, skills)
- Preferences and interests
- Important dates and events
- Relationship information

## 🛠️ Development

### **Project Structure**
```
kai/
├── client/               # React frontend
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Route components
│   │   ├── lib/          # Utilities and context
│   │   └── hooks/        # Custom React hooks
├── server/               # Express backend
│   ├── routes.ts         # API route definitions
│   ├── supabase.ts       # Database client
│   └── storage.ts        # Local storage utilities
├── api/                  # Vercel serverless functions
├── shared/               # Shared TypeScript types
└── supabase-functions.sql # Database schema
```

### **Key Technologies**
- **TypeScript**: Full type safety across frontend and backend
- **Drizzle ORM**: Type-safe database queries and migrations
- **React Query**: Server state management and optimistic updates
- **Radix UI**: Accessible, composable UI components
- **Tailwind CSS**: Utility-first styling with design system

### **Contributing Guidelines**
1. Follow existing code patterns and naming conventions
2. Maintain TypeScript strict mode compliance
3. Add appropriate error handling and logging
4. Test memory categorization with real conversations
5. Ensure responsive design on all screen sizes

## 📝 License

[License information to be added]

## 🆘 Support

For issues, questions, or contributions:
- Create an issue in the GitHub repository
- Check existing documentation in `/docs`
- Review the CLAUDE.md file for development guidelines

---

**Kai** - Where conversations become memories, and memories become intelligence.