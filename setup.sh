#!/bin/bash

# KinéVerse Setup Script

echo "🌀 Setting up KinéVerse..."
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Backend setup
echo ""
echo "📦 Setting up backend..."
cd backend

if [ ! -f ".env" ]; then
    echo "Creating backend .env file..."
    cp .env.example .env
    echo "⚠️  Please edit backend/.env with your credentials"
fi

echo "Installing backend dependencies..."
npm install

echo ""
read -p "Do you want to seed the database now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm run seed
fi

cd ..

# Frontend setup
echo ""
echo "📦 Setting up frontend..."
cd frontend

if [ ! -f ".env" ]; then
    echo "Creating frontend .env file..."
    cp .env.example .env
fi

echo "Installing frontend dependencies..."
npm install

cd ..

# Done
echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the app:"
echo "  1. Backend:  cd backend && npm run dev"
echo "  2. Frontend: cd frontend && npm run dev"
echo ""
echo "Then open http://localhost:5173"
echo ""
echo "📚 Check README.md for more information"
