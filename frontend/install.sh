#!/bin/bash

echo "🏎️  LAPPED Frontend Setup"
echo "=========================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "✅ Dependencies installed successfully!"
echo ""

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    echo "VITE_API_BASE_URL=http://localhost:8000" > .env.local
    echo "✅ .env.local created"
else
    echo "✅ .env.local already exists"
fi

echo ""
echo "=========================="
echo "🎉 Setup Complete!"
echo "=========================="
echo ""
echo "To start the development server:"
echo "  npm run dev"
echo ""
echo "Frontend will run on: http://localhost:5173"
echo "Backend should run on: http://localhost:8000"
echo ""
echo "Happy coding! 🚀"
