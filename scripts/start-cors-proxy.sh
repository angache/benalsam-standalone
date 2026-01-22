#!/bin/bash

# Start Local CORS Proxy for Benalsam Development
# This proxy allows local development to connect to VPS services

echo "🚀 Starting Local CORS Proxy for Benalsam..."
echo "📡 This will proxy API requests from localhost:3000 to https://api.benalsam.com"
echo "🔗 Debug logs will be collected at http://127.0.0.1:7242/ingest/..."
echo ""

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed or not in PATH"
    exit 1
fi

# Check if proxy script exists
PROXY_SCRIPT="$(dirname "$0")/local-cors-proxy.js"
if [ ! -f "$PROXY_SCRIPT" ]; then
    echo "❌ Proxy script not found: $PROXY_SCRIPT"
    exit 1
fi

echo "📍 Proxy script: $PROXY_SCRIPT"
echo "🌐 Target: https://api.benalsam.com"
echo "🏠 Local port: 7242"
echo ""

# Function to check if port is already in use
check_port() {
    if lsof -Pi :7242 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port 7242 already in use. CORS proxy may already be running."
        echo "   If you want to restart, kill the existing process first:"
        echo "   pkill -f 'local-cors-proxy'"
        exit 1
    fi
}

# Check if port is free
check_port

echo "▶️  Starting CORS proxy server..."
echo ""

# Start the proxy in background
node "$PROXY_SCRIPT" &
PROXY_PID=$!

echo "✅ CORS Proxy started with PID: $PROXY_PID"
echo "🔄 Running in background..."
echo ""
echo "📋 Useful commands:"
echo "   • Stop proxy: kill $PROXY_PID"
echo "   • Check status: curl http://127.0.0.1:7242/health"
echo "   • View logs: This terminal will show proxy logs"
echo ""
echo "🎯 Ready! Now start your Next.js dev server:"
echo "   cd benalsam-web-next && npm run dev"
echo ""

# Wait for the proxy process
wait $PROXY_PID

echo ""
echo "✅ CORS Proxy stopped"