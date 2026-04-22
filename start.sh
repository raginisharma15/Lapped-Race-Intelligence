#!/bin/bash

# LAPPED Full Stack Startup Script
# Starts both backend (FastAPI) and frontend (React) servers

set -e

echo "🏎️  LAPPED - Starting Full Stack Application"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 is not installed${NC}"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Copying from .env.example...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Please edit .env and add your GROQ_API_KEY${NC}"
fi

# Check if frontend/.env.local exists
if [ ! -f frontend/.env.local ]; then
    echo -e "${YELLOW}⚠️  frontend/.env.local not found. Creating...${NC}"
    echo "VITE_API_BASE_URL=http://localhost:8000" > frontend/.env.local
fi

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Shutting down servers...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start Backend
echo -e "${GREEN}🚀 Starting Backend (FastAPI)...${NC}"
echo "   Port: 8000"
echo "   Docs: http://localhost:8000/docs"
echo ""

python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Check if backend is running
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${RED}❌ Backend failed to start${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Backend running (PID: $BACKEND_PID)${NC}"
echo ""

# Start Frontend
echo -e "${GREEN}🚀 Starting Frontend (React + Vite)...${NC}"
echo "   Port: 5173"
echo "   URL: http://localhost:5173"
echo ""

cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
sleep 3

# Check if frontend is running
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo -e "${RED}❌ Frontend failed to start${NC}"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo -e "${GREEN}✅ Frontend running (PID: $FRONTEND_PID)${NC}"
echo ""
echo "=============================================="
echo -e "${GREEN}🎉 LAPPED is ready!${NC}"
echo ""
echo "📍 Access Points:"
echo "   Landing Page:  http://localhost:5173"
echo "   Dashboard:     http://localhost:5173/dashboard"
echo "   Backend API:   http://localhost:8000"
echo "   API Docs:      http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all servers"
echo "=============================================="

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
