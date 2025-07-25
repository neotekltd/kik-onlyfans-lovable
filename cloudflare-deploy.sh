#!/bin/bash

echo "🚀 KikStars Cloudflare Pages Deployment Script"
echo "=============================================="

# Check if Wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

# Build the client
echo "📦 Building client application..."
npm run build:client

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please check for errors above."
    exit 1
fi

echo "✅ Build successful!"

# Check if logged in to Cloudflare
echo "🔐 Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
    echo "❌ Not logged in to Cloudflare. Please run:"
    echo "   wrangler login"
    exit 1
fi

echo "✅ Authenticated with Cloudflare"

# Deploy to Pages
echo "🚀 Deploying to Cloudflare Pages..."
wrangler pages deploy dist/public --project-name kikstars-platform

if [ $? -eq 0 ]; then
    echo "🎉 Deployment successful!"
    echo ""
    echo "📝 Next steps:"
    echo "1. Update the API URL in _redirects file"
    echo "2. Configure environment variables in Cloudflare dashboard"
    echo "3. Deploy your backend API separately"
    echo "4. Update CORS settings on your backend"
else
    echo "❌ Deployment failed!"
    exit 1
fi