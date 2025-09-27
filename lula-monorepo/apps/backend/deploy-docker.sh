#!/bin/bash

# Lula Backend Docker Deployment Script
# This script deploys the Lula backend using Docker Compose

set -e

echo "🚀 Starting Lula Backend Docker Deployment..."
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

print_status "Docker is running ✅"

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

print_status "Docker Compose is available ✅"

# Check if environment file exists
if [ ! -f "env.docker" ]; then
    print_error "Environment file 'env.docker' not found. Please create it first."
    exit 1
fi

print_status "Environment file found ✅"

# Check if Firebase service account key exists
if [ ! -f "firebase-service-account.json" ]; then
    print_warning "Firebase service account key not found. Migration features will be disabled."
    print_warning "To enable migration, place 'firebase-service-account.json' in the project root."
fi

# Stop existing containers if running
print_header "Stopping existing containers..."
docker-compose down --remove-orphans || true

# Build the Docker image
print_header "Building Docker image..."
docker-compose build --no-cache

# Start the services
print_header "Starting services..."
docker-compose up -d

# Wait for services to be ready
print_header "Waiting for services to be ready..."
sleep 10

# Check service health
print_header "Checking service health..."

# Check MongoDB
if docker-compose exec -T mongodb mongosh --eval "db.runCommand('ping')" > /dev/null 2>&1; then
    print_status "MongoDB is healthy ✅"
else
    print_error "MongoDB is not responding"
    docker-compose logs mongodb
    exit 1
fi

# Check Redis
if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    print_status "Redis is healthy ✅"
else
    print_error "Redis is not responding"
    docker-compose logs redis
    exit 1
fi

# Check Backend
sleep 5
if curl -f http://localhost:5002/api/health > /dev/null 2>&1; then
    print_status "Backend API is healthy ✅"
else
    print_warning "Backend API is not responding yet. Checking logs..."
    docker-compose logs backend
    print_warning "Backend might still be starting up. Please wait a moment and check again."
fi

# Display service information
echo ""
echo "=============================================="
echo "🎉 Lula Backend Deployment Complete!"
echo "=============================================="
echo ""
echo "📊 Service Information:"
echo "  • Backend API: http://localhost:5002"
echo "  • MongoDB: localhost:27019"
echo "  • Redis: localhost:6380"
echo "  • Nginx: http://localhost:8080 (HTTP), https://localhost:8443 (HTTPS)"
echo ""
echo "🔍 Useful Commands:"
echo "  • View logs: docker-compose logs -f"
echo "  • Stop services: docker-compose down"
echo "  • Restart services: docker-compose restart"
echo "  • Check status: docker-compose ps"
echo ""
echo "📋 API Endpoints:"
echo "  • Health Check: http://localhost:5002/api/health"
echo "  • API Documentation: http://localhost:5002/api/docs"
echo "  • Admin Panel: http://localhost:5002/api/admin"
echo ""
echo "🚀 Your Lula Backend is now running on Docker!"
echo ""

# Optional: Run migration if Firebase key exists
if [ -f "firebase-service-account.json" ]; then
    echo "🔄 Firebase migration key found. Would you like to run data migration? (y/n)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        print_header "Running Firebase to MongoDB migration..."
        docker-compose exec backend npm run migrate
        print_status "Migration completed ✅"
    fi
fi

print_status "Deployment completed successfully! 🎉"
