#!/bin/bash

# ZapFlow Local Testing Script
# This script starts the services and runs integration tests

echo "🚀 Starting ZapFlow Local Test"
echo "================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose not found. Please install Docker Compose."
    exit 1
fi

# Check for GEMINI_API_KEY
if [ -z "$GEMINI_API_KEY" ]; then
    echo "⚠️  GEMINI_API_KEY not set. AI Service tests will be skipped."
    echo "   To test AI functionality, set: export GEMINI_API_KEY=your_key"
fi

echo ""
echo "📦 Building and starting services..."
docker-compose up --build -d

echo ""
echo "⏳ Waiting for services to start..."
sleep 30

echo ""
echo "🧪 Running integration tests..."
node test-integration.js

# Get test result
TEST_RESULT=$?

echo ""
echo "🛑 Stopping services..."
docker-compose down

if [ $TEST_RESULT -eq 0 ]; then
    echo ""
    echo "🎉 All tests passed! ZapFlow is ready for deployment."
    echo ""
    echo "Next steps:"
    echo "1. Set up your GEMINI_API_KEY environment variable"
    echo "2. Deploy to Render using the instructions in RENDER_DEPLOYMENT.md"
    echo "3. Test the WhatsApp integration end-to-end"
else
    echo ""
    echo "❌ Some tests failed. Please check the logs above."
    echo ""
    echo "Common issues:"
    echo "- Services taking too long to start (try increasing wait time)"
    echo "- Missing environment variables"
    echo "- Port conflicts (check if ports 8081-8083, 9002, 5432 are free)"
fi

exit $TEST_RESULT