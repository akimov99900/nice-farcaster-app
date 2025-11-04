#!/bin/bash

# Nice Mini-App Deployment Script
# This script helps deploy the nice mini-app to Vercel

echo "🌟 Nice Mini-App Deployment Script"
echo "=================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Run build to check for errors
echo "🔨 Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix the errors before deploying."
    exit 1
fi

echo "✅ Build successful!"
echo ""
echo "🚀 Ready for deployment!"
echo ""
echo "To deploy to Vercel, run:"
echo "  vercel"
echo ""
echo "To deploy to production, run:"
echo "  vercel --prod"
echo ""
echo "After deployment:"
echo "1. Update your Farcaster mini-app registration with the new URL"
echo "2. Test the app in the Farcaster client"
echo "3. Share with users! 🎉"