#!/bin/bash

# Minecraft Bot Startup Script
# Скрипт запуска Minecraft бота

echo "🤖 Starting Minecraft Bot System..."
echo "=================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️ .env file not found. Creating from template..."
    cp .env.example .env
    echo "✅ Please edit .env file with your server settings"
    echo "📝 Required: MINECRAFT_HOST, BOT_USERNAME"
    echo "🔑 Optional: OPENAI_API_KEY for AI chat"
    exit 1
fi

# Create logs directory
mkdir -p logs

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ All checks passed!"
echo "🚀 Starting bot..."
echo ""

# Start the bot
npm start