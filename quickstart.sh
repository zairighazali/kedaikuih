#!/bin/bash

# Biskut Raya - Quick Start Script
# This script helps you get the full-stack project running

echo "🌙 Biskut Raya - Full Stack Setup"
echo "=================================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Node.js not found. Please install Node.js 18+"
  exit 1
fi

echo "✅ Node.js: $(node --version)"
echo ""

# Check if in correct directory
if [ ! -f "package.json" ]; then
  echo "❌ package.json not found. Please run this from the project root."
  exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
  echo "❌ npm install failed"
  exit 1
fi

echo ""
echo "✅ Dependencies installed"
echo ""

# Check .env files
if [ ! -f ".env" ]; then
  echo "⚠️  .env file missing - using defaults"
fi

if [ ! -f ".env.server" ]; then
  echo "⚠️  .env.server file missing - update with your Neon credentials"
fi

echo ""
echo "🚀 Ready to start!"
echo ""
echo "Available commands:"
echo "  npm run dev          - Start frontend only (http://localhost:5173)"
echo "  npm run dev:server   - Start backend only (http://localhost:4000)"
echo "  npm run dev:all      - Start both frontend + backend"
echo "  npm run build        - Build frontend for production"
echo ""
echo "Quick start: npm run dev:all"
echo ""
