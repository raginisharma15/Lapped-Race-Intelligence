#!/bin/bash

# LAPPED Integration Test Script
# Verifies all components are properly set up

echo "🧪 LAPPED Integration Test"
echo "=========================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASS=0
FAIL=0

# Test function
test_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} $1 (missing)"
        ((FAIL++))
    fi
}

test_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $1/"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} $1/ (missing)"
        ((FAIL++))
    fi
}

echo "📂 Backend Files"
echo "----------------"
test_file "app/main.py"
test_file "config.py"
test_file "requirements.txt"
test_file ".env.example"
test_dir "app/routes"
test_dir "app/services"
test_dir "app/ai"
echo ""

echo "📂 Frontend Files"
echo "-----------------"
test_file "frontend/package.json"
test_file "frontend/src/App.tsx"
test_file "frontend/src/main.tsx"
test_file "frontend/src/pages/Landing.tsx"
test_file "frontend/src/pages/Dashboard.tsx"
test_file "frontend/src/api/client.ts"
test_file "frontend/public/landing.html"
test_dir "frontend/src/components"
test_dir "frontend/src/hooks"
test_dir "frontend/src/types"
echo ""

echo "📂 Landing Page Files"
echo "---------------------"
test_file "frontend/landing/index.html"
test_file "frontend/landing/src/main.js"
test_file "frontend/landing/src/style.css"
test_file "frontend/landing/package.json"
test_dir "frontend/landing/public/models"
echo ""

echo "📂 3D Models"
echo "------------"
test_file "frontend/public/models/mclaren_mp45__formula_1.glb"
test_file "frontend/landing/public/models/mclaren_mp45__formula_1.glb"
echo ""

echo "📂 Scripts & Documentation"
echo "--------------------------"
test_file "start.sh"
test_file "README.md"
test_file "QUICKSTART.md"
test_file "INTEGRATION.md"
test_file "FULLSTACK_COMPLETE.md"
test_file "FRONTEND_SUMMARY.md"
echo ""

echo "🔍 Configuration Checks"
echo "-----------------------"

# Check if .env exists
if [ -f ".env" ]; then
    echo -e "${GREEN}✓${NC} .env file exists"
    ((PASS++))
    
    # Check for GROQ_API_KEY
    if grep -q "GROQ_API_KEY=" .env && ! grep -q "GROQ_API_KEY=$" .env; then
        echo -e "${GREEN}✓${NC} GROQ_API_KEY is set"
        ((PASS++))
    else
        echo -e "${YELLOW}⚠${NC} GROQ_API_KEY not set in .env"
        ((FAIL++))
    fi
else
    echo -e "${YELLOW}⚠${NC} .env file not found (will be created on first run)"
fi

# Check if frontend/.env.local exists
if [ -f "frontend/.env.local" ]; then
    echo -e "${GREEN}✓${NC} frontend/.env.local exists"
    ((PASS++))
else
    echo -e "${YELLOW}⚠${NC} frontend/.env.local not found (will be created on first run)"
fi

echo ""
echo "🔧 Dependency Checks"
echo "--------------------"

# Check Python
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
    echo -e "${GREEN}✓${NC} Python 3 installed ($PYTHON_VERSION)"
    ((PASS++))
else
    echo -e "${RED}✗${NC} Python 3 not found"
    ((FAIL++))
fi

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓${NC} Node.js installed ($NODE_VERSION)"
    ((PASS++))
else
    echo -e "${RED}✗${NC} Node.js not found"
    ((FAIL++))
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✓${NC} npm installed ($NPM_VERSION)"
    ((PASS++))
else
    echo -e "${RED}✗${NC} npm not found"
    ((FAIL++))
fi

echo ""
echo "=========================="
echo "📊 Test Results"
echo "=========================="
echo -e "${GREEN}Passed: $PASS${NC}"
echo -e "${RED}Failed: $FAIL${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! You're ready to start.${NC}"
    echo ""
    echo "Run the application with:"
    echo "  ./start.sh"
    echo ""
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tests failed. Please review the output above.${NC}"
    echo ""
    exit 1
fi
