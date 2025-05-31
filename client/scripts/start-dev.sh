#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Starting development server...${NC}"

# Check if port 8000 is in use
PORT_IN_USE=$(lsof -ti:8000)

if [ ! -z "$PORT_IN_USE" ]; then
    echo -e "${YELLOW}⚠️  Port 8000 is in use by process(es): $PORT_IN_USE${NC}"
    echo -e "${YELLOW}🔧 Killing existing processes...${NC}"
    
    # Kill processes using port 8000
    lsof -ti:8000 | xargs kill -9 2>/dev/null || true
    
    # Wait a moment for processes to die
    sleep 1
    
    # Check if port is now free
    STILL_IN_USE=$(lsof -ti:8000)
    if [ ! -z "$STILL_IN_USE" ]; then
        echo -e "${RED}❌ Failed to free port 8000. Please manually kill processes: $STILL_IN_USE${NC}"
        exit 1
    else
        echo -e "${GREEN}✅ Port 8000 is now free${NC}"
    fi
else
    echo -e "${GREEN}✅ Port 8000 is available${NC}"
fi

echo -e "${GREEN}🚀 Starting development server on port 8000...${NC}"

# Start the development server
NODE_ENV=development tsx server/index.ts 