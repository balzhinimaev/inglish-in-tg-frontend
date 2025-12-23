#!/bin/bash

# Debug script for deployment issues
# Run this on VPS to diagnose deployment problems

echo "🔍 Deployment Debug Script"
echo "=========================="

# Check Docker status
echo "🐳 Docker Status:"
docker --version
docker info | head -5

# Check current container
echo ""
echo "📦 Current Container Status:"
docker ps -a | grep telegram-frontend || echo "No telegram-frontend container found"

# Check images
echo ""
echo "🖼️ Available Images:"
docker images | grep ghcr.io | head -5

# Check static files
echo ""
echo "📁 Static Files Status:"
NGINX_STATIC_PATH="/var/www/englishintg.ru/webapp"
if [ -d "$NGINX_STATIC_PATH" ]; then
    echo "Directory exists: $NGINX_STATIC_PATH"
    ls -la "$NGINX_STATIC_PATH" | head -10
    echo "File count: $(find "$NGINX_STATIC_PATH" -type f | wc -l)"
else
    echo "Directory does not exist: $NGINX_STATIC_PATH"
fi

# Check nginx status
echo ""
echo "🌐 Nginx Status:"
sudo systemctl status nginx --no-pager -l | head -10

# Check recent logs
echo ""
echo "📋 Recent Container Logs:"
docker logs telegram-frontend --tail 20 2>/dev/null || echo "No logs available"

# Check disk space
echo ""
echo "💾 Disk Space:"
df -h | grep -E "(Filesystem|/dev/)"

# Check memory usage
echo ""
echo "🧠 Memory Usage:"
free -h

echo ""
echo "✅ Debug complete!"
