#!/bin/bash

# Lula Backend Deployment Script
# This script handles the complete deployment process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="lula-backend"
DEPLOY_USER="deploy"
DEPLOY_HOST="${DEPLOY_HOST:-your-server.com}"
DEPLOY_PATH="/var/www/${PROJECT_NAME}"
BACKUP_PATH="/var/backups/${PROJECT_NAME}"

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Check if required environment variables are set
check_env() {
    log "Checking environment variables..."
    
    required_vars=(
        "MONGODB_URI"
        "JWT_SECRET"
        "AWS_ACCESS_KEY_ID"
        "AWS_SECRET_ACCESS_KEY"
        "S3_BUCKET_NAME"
        "STREAM_API_KEY"
        "STREAM_API_SECRET"
    )
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            error "Required environment variable $var is not set"
        fi
    done
    
    success "All required environment variables are set"
}

# Install dependencies
install_deps() {
    log "Installing dependencies..."
    
    # Update system packages
    sudo apt-get update -y
    
    # Install Node.js (if not already installed)
    if ! command -v node &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
    
    # Install PM2 globally
    if ! command -v pm2 &> /dev/null; then
        sudo npm install -g pm2
    fi
    
    # Install Docker (if not already installed)
    if ! command -v docker &> /dev/null; then
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker $USER
    fi
    
    # Install Docker Compose (if not already installed)
    if ! command -v docker-compose &> /dev/null; then
        sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
    fi
    
    success "Dependencies installed"
}

# Setup project directory
setup_project() {
    log "Setting up project directory..."
    
    # Create project directory
    sudo mkdir -p $DEPLOY_PATH
    sudo chown $USER:$USER $DEPLOY_PATH
    
    # Create logs directory
    mkdir -p $DEPLOY_PATH/logs
    
    # Create backup directory
    sudo mkdir -p $BACKUP_PATH
    sudo chown $USER:$USER $BACKUP_PATH
    
    success "Project directory setup complete"
}

# Deploy application
deploy_app() {
    log "Deploying application..."
    
    # Copy application files
    cp -r . $DEPLOY_PATH/
    cd $DEPLOY_PATH
    
    # Install production dependencies
    npm ci --only=production
    
    # Create production environment file
    cat > .env.production << EOF
NODE_ENV=production
PORT=5000
MONGODB_URI=${MONGODB_URI}
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRE=${JWT_EXPIRE:-7d}
AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
AWS_REGION=${AWS_REGION:-us-east-1}
S3_BUCKET_NAME=${S3_BUCKET_NAME}
COIN_RATE_PER_MINUTE=${COIN_RATE_PER_MINUTE:-49}
COMMISSION_PERCENTAGE=${COMMISSION_PERCENTAGE:-30}
MINIMUM_BALANCE=${MINIMUM_BALANCE:-49}
STREAM_API_KEY=${STREAM_API_KEY}
STREAM_API_SECRET=${STREAM_API_SECRET}
ALLOWED_ORIGINS=${ALLOWED_ORIGINS:-*}
EOF
    
    success "Application deployed"
}

# Setup SSL certificates
setup_ssl() {
    log "Setting up SSL certificates..."
    
    # Create SSL directory
    mkdir -p $DEPLOY_PATH/ssl
    
    # Check if certificates exist
    if [ ! -f "$DEPLOY_PATH/ssl/cert.pem" ] || [ ! -f "$DEPLOY_PATH/ssl/key.pem" ]; then
        warning "SSL certificates not found. Please add them to $DEPLOY_PATH/ssl/"
        warning "You can use Let's Encrypt: certbot certonly --standalone -d your-domain.com"
    else
        success "SSL certificates found"
    fi
}

# Start services with PM2
start_pm2() {
    log "Starting services with PM2..."
    
    cd $DEPLOY_PATH
    
    # Stop existing processes
    pm2 stop $PROJECT_NAME 2>/dev/null || true
    pm2 delete $PROJECT_NAME 2>/dev/null || true
    
    # Start application
    pm2 start ecosystem.config.js --env production
    
    # Save PM2 configuration
    pm2 save
    
    # Setup PM2 startup script
    pm2 startup
    
    success "Services started with PM2"
}

# Start services with Docker
start_docker() {
    log "Starting services with Docker..."
    
    cd $DEPLOY_PATH
    
    # Stop existing containers
    docker-compose down 2>/dev/null || true
    
    # Build and start services
    docker-compose up -d --build
    
    success "Services started with Docker"
}

# Run database migration
run_migration() {
    log "Running database migration..."
    
    cd $DEPLOY_PATH
    
    # Check if migration is needed
    if [ -f "src/migrations/run-migration.js" ]; then
        warning "Database migration script found. Please run it manually:"
        warning "cd $DEPLOY_PATH && npm run migrate"
    else
        success "No migration needed"
    fi
}

# Setup monitoring
setup_monitoring() {
    log "Setting up monitoring..."
    
    # Install monitoring tools
    if ! command -v htop &> /dev/null; then
        sudo apt-get install -y htop
    fi
    
    # Create monitoring script
    cat > $DEPLOY_PATH/monitor.sh << 'EOF'
#!/bin/bash
echo "=== Lula Backend Monitoring ==="
echo "Date: $(date)"
echo "Uptime: $(uptime)"
echo "Memory Usage:"
free -h
echo "Disk Usage:"
df -h
echo "PM2 Status:"
pm2 status
echo "Docker Status:"
docker ps
echo "API Health:"
curl -s http://localhost:5000/api/health | jq . || echo "API not responding"
EOF
    
    chmod +x $DEPLOY_PATH/monitor.sh
    
    success "Monitoring setup complete"
}

# Create backup
create_backup() {
    log "Creating backup..."
    
    timestamp=$(date +%Y%m%d_%H%M%S)
    backup_file="$BACKUP_PATH/backup_$timestamp.tar.gz"
    
    # Create backup
    tar -czf $backup_file -C $DEPLOY_PATH .
    
    # Keep only last 7 backups
    ls -t $BACKUP_PATH/backup_*.tar.gz | tail -n +8 | xargs -r rm
    
    success "Backup created: $backup_file"
}

# Main deployment function
deploy() {
    log "Starting Lula Backend deployment..."
    
    check_env
    install_deps
    setup_project
    deploy_app
    setup_ssl
    
    # Choose deployment method
    if [ "$DEPLOYMENT_METHOD" = "docker" ]; then
        start_docker
    else
        start_pm2
    fi
    
    run_migration
    setup_monitoring
    
    # Wait for services to start
    log "Waiting for services to start..."
    sleep 10
    
    # Test deployment
    if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
        success "Deployment successful! API is responding."
    else
        error "Deployment failed! API is not responding."
    fi
    
    success "Lula Backend deployment completed!"
    log "API URL: http://localhost:5000"
    log "Health Check: http://localhost:5000/api/health"
    log "Monitor: $DEPLOY_PATH/monitor.sh"
}

# Rollback function
rollback() {
    log "Rolling back deployment..."
    
    # Find latest backup
    latest_backup=$(ls -t $BACKUP_PATH/backup_*.tar.gz | head -n1)
    
    if [ -z "$latest_backup" ]; then
        error "No backup found for rollback"
    fi
    
    # Stop services
    pm2 stop $PROJECT_NAME 2>/dev/null || true
    docker-compose down 2>/dev/null || true
    
    # Restore from backup
    tar -xzf $latest_backup -C $DEPLOY_PATH
    
    # Restart services
    if [ "$DEPLOYMENT_METHOD" = "docker" ]; then
        docker-compose up -d
    else
        pm2 start ecosystem.config.js --env production
    fi
    
    success "Rollback completed from: $latest_backup"
}

# Main script
case "${1:-deploy}" in
    deploy)
        deploy
        ;;
    rollback)
        rollback
        ;;
    backup)
        create_backup
        ;;
    monitor)
        $DEPLOY_PATH/monitor.sh
        ;;
    *)
        echo "Usage: $0 {deploy|rollback|backup|monitor}"
        echo "  deploy   - Deploy the application"
        echo "  rollback - Rollback to previous version"
        echo "  backup   - Create a backup"
        echo "  monitor  - Show system status"
        exit 1
        ;;
esac
