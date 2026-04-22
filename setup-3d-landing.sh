#!/bin/bash

echo "🏎️  Setting up 3D Landing Page"
echo "=============================="
echo ""

# Install Three.js
echo "📦 Installing Three.js..."
cd frontend
npm install three@^0.160.0 @types/three@^0.160.0
cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "Now start the application:"
echo "  ./start.sh"
echo ""
echo "Visit: http://localhost:5173"
echo ""
echo "Sequence:"
echo "  1. Initializing screen (2 seconds)"
echo "  2. 3D Landing page with car"
echo "  3. Click 'Enter Dashboard' button"
echo "  4. Dashboard loads"
