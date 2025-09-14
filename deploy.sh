#!/bin/bash

# Deploy script for application
# This script should be run on the VPS server

set -e  # Exit on any error

# Configuration with environment variable defaults
APP_NAME=${APP_NAME:-"telegram-frontend"}
IMAGE_NAME="ghcr.io/$(echo ${GITHUB_REPOSITORY} | tr '[:upper:]' '[:lower:]')"
APP_PORT=${APP_PORT:-"8004"}
DEPLOY_PATH=${DEPLOY_PATH:-"/opt/telegram-frontend"}
CONTAINER_RESTART_POLICY=${CONTAINER_RESTART_POLICY:-"unless-stopped"}

# Application environment variables with defaults
VITE_API_BASE_URL=${VITE_API_BASE_URL:-"https://api.example.com"}
VITE_ENABLE_ANALYTICS=${VITE_ENABLE_ANALYTICS:-"true"}
VITE_ENABLE_DEBUG_LOGGING=${VITE_ENABLE_DEBUG_LOGGING:-"false"}
NODE_ENV=${NODE_ENV:-"production"}

# Deployment settings
STARTUP_WAIT_TIME=${STARTUP_WAIT_TIME:-"10"}
CLEANUP_OLD_IMAGES=${CLEANUP_OLD_IMAGES:-"true"}

echo "🚀 Starting deployment..."
echo "📦 App: $APP_NAME"
echo "🔌 Port: $APP_PORT"
echo "📁 Path: $DEPLOY_PATH"
echo "📡 API URL: $VITE_API_BASE_URL"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Create deployment directory
echo "📁 Creating deployment directory: $DEPLOY_PATH"
mkdir -p $DEPLOY_PATH
cd $DEPLOY_PATH

# Login to GitHub Container Registry if token is provided
if [ -n "$GITHUB_TOKEN" ]; then
    echo "🔐 Logging in to GitHub Container Registry..."
    echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_ACTOR --password-stdin
fi

# Pull the latest image
echo "📥 Pulling latest image: $IMAGE_NAME:latest"
docker pull $IMAGE_NAME:latest

# Stop and remove existing container if it exists
if docker ps -q -f name=$APP_NAME | grep -q .; then
    echo "🛑 Stopping existing container..."
    docker stop $APP_NAME
fi

if docker ps -aq -f name=$APP_NAME | grep -q .; then
    echo "🗑️  Removing existing container..."
    docker rm $APP_NAME
fi

# Run new container
echo "🏃 Starting new container..."
docker run -d \
    --name $APP_NAME \
    --restart $CONTAINER_RESTART_POLICY \
    -p $APP_PORT:$APP_PORT \
    -e NODE_ENV=$NODE_ENV \
    -e APP_PORT=$APP_PORT \
    $IMAGE_NAME:latest

# Wait for container to be healthy
echo "⏳ Waiting for container to be ready..."
sleep $STARTUP_WAIT_TIME

# Check if container is running
if docker ps -q -f name=$APP_NAME | grep -q .; then
    echo "✅ Container is running!"
    
    # Test the application
    if curl -f http://localhost:$APP_PORT/ > /dev/null 2>&1; then
        echo "✅ Application is responding on port $APP_PORT"
    else
        echo "⚠️  Application might not be ready yet, check logs: docker logs $APP_NAME"
    fi
else
    echo "❌ Container failed to start. Checking logs..."
    docker logs $APP_NAME
    exit 1
fi

# Clean up old images if enabled
if [ "$CLEANUP_OLD_IMAGES" = "true" ]; then
    echo "🧹 Cleaning up old images..."
    docker image prune -f
fi

# Show deployment info
echo ""
echo "📋 Deployment Configuration:"
echo "   App Name: $APP_NAME"
echo "   Port: $APP_PORT"  
echo "   Path: $DEPLOY_PATH"
echo "   API URL: $VITE_API_BASE_URL"
echo "   Analytics: $VITE_ENABLE_ANALYTICS" 
echo "   Debug logging: $VITE_ENABLE_DEBUG_LOGGING"
echo "   Environment: $NODE_ENV"
echo ""
echo "🎉 Deployment completed successfully!"
echo "📱 Your app should be available at http://your-domain:$APP_PORT/"
echo "📊 Monitor with: docker logs -f $APP_NAME"

# Optional: Build local image with environment variables (if not using registry)
if [ "$BUILD_LOCAL" = "true" ]; then
    echo ""
    echo "🔨 Building local image with environment variables..."
    docker build \
        --build-arg VITE_API_BASE_URL=$VITE_API_BASE_URL \
        --build-arg VITE_ENABLE_ANALYTICS=$VITE_ENABLE_ANALYTICS \
        --build-arg VITE_ENABLE_DEBUG_LOGGING=$VITE_ENABLE_DEBUG_LOGGING \
        --build-arg NODE_ENV=$NODE_ENV \
        --build-arg APP_PORT=$APP_PORT \
        -t $APP_NAME:latest .
    
    echo "✅ Local build completed!"
fi
