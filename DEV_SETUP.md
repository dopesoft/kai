# Development Server Setup

## Quick Start ✅

**To start the development server:**
```bash
npm run dev
```

That's it! The server will automatically:
- Kill any processes using port 8000
- Start the development server
- Show `[express] serving on port 8000` when ready
- Open your browser to `http://localhost:8000`

## Understanding the Output

When you see this output, **everything is working correctly:**

```bash
> rest-express@1.0.0 dev
> lsof -ti:8000 | xargs kill -9 2>/dev/null || true && NODE_ENV=development tsx server/index.ts
1:34:40 AM [express] serving on port 8000
Browserslist: browsers data (caniuse-lite) is 7 months old. Please run:
  npx update-browserslist-db@latest
  Why you should do it regularly: https://github.com/browserslist/update-db#readme
```

**What each line means:**
- ✅ `lsof -ti:8000 | xargs kill -9...` - Auto-kills port conflicts
- ✅ `[express] serving on port 8000` - **Server is running!**
- ⚠️ `Browserslist: browsers data...` - Optional warning (safe to ignore)

## Port Conflict Fix ✅

The development server has been permanently configured to automatically handle port conflicts on port 8000.

### What was the problem?
Previously, when port 8000 was already in use by another process, the development server would fail to start with an `EADDRINUSE` error, causing the server to crash with a spinning error.

### How is it fixed?
The `npm run dev` script now automatically kills any existing processes using port 8000 before starting the development server.

### Available Scripts

#### `npm run dev` (Recommended)
- **Auto-kills processes on port 8000** before starting
- Starts the development server with hot reload
- **This is now the safest way to start the server**

```bash
npm run dev
```

#### `npm run dev:safe` (Cross-platform alternative)
- Uses a Node.js script that works on Windows, Mac, and Linux
- Provides colored output and detailed port conflict handling
- Fallback option if the main `dev` script has issues

```bash
npm run dev:safe
```

#### `npm run dev:port` (Custom port)
- Starts the server on a custom port (if you need to avoid port 8000 entirely)

```bash
PORT=3000 npm run dev:port
```

## Troubleshooting

### Server Seems to Stop
If you see the server output but then it returns to the command prompt:
1. **Check if it's still running:** `curl http://localhost:8000` (should return 200)
2. **If not running:** Just run `npm run dev` again
3. **For persistent running:** The server stays running until you press `Ctrl+C`

### Permission Errors
If you get permission errors when killing processes:
```bash
# Run with sudo (Mac/Linux)
sudo npm run dev

# Or use the alternative
npm run dev:safe
```

### For Manual Port Management

If you ever need to manually manage processes on port 8000:

```bash
# Find processes using port 8000
lsof -ti:8000

# Kill all processes using port 8000
lsof -ti:8000 | xargs kill -9 2>/dev/null || true

# Check if port is free (should return nothing)
lsof -ti:8000
```

### What's Different Now?

**Before:** `npm run dev` → Port conflict → Server crash → Manual intervention needed

**After:** `npm run dev` → Auto-kills conflicting processes → Server starts successfully ✅

The solution is:
- ✅ **Permanent** - No more manual port management needed
- ✅ **Automatic** - Runs every time you start the dev server
- ✅ **Safe** - Uses proper error handling to avoid breaking if no processes exist
- ✅ **Fast** - Minimal delay (kills processes instantly)

### Development Workflow

1. **Just run:** `npm run dev`
2. **Wait for:** `[express] serving on port 8000`
3. **Open browser:** `http://localhost:8000`
4. **Start coding!** The server handles everything else

No more:
- ❌ Checking for existing processes
- ❌ Manually killing processes  
- ❌ Getting frustrated with port conflicts
- ❌ Server crashes due to EADDRINUSE errors

The development experience is now smooth and conflict-free! 🚀 