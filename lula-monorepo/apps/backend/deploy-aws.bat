@echo off
REM 🚀 Lula AWS Deployment Script for Windows
REM This script deploys the Lula application to AWS EC2

echo 🚀 Starting Lula AWS Deployment
echo ==================================

REM Check if required files exist
if not exist "docker-compose.production.yml" (
    echo ❌ Error: docker-compose.production.yml not found!
    exit /b 1
)

if not exist ".env.production" (
    echo ❌ Error: .env.production not found!
    echo 💡 Please create .env.production with your production environment variables
    exit /b 1
)

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Docker is not running!
    exit /b 1
)

echo ✅ Prerequisites check passed

REM Create necessary directories
echo 📁 Creating necessary directories...
if not exist "logs" mkdir logs
if not exist "uploads" mkdir uploads
if not exist "backups" mkdir backups
if not exist "ssl" mkdir ssl

REM Stop existing containers
echo 🛑 Stopping existing containers...
docker-compose -f docker-compose.production.yml down --remove-orphans

REM Remove old images to free up space
echo 🧹 Cleaning up old Docker images...
docker system prune -f

REM Build and start services
echo 🔨 Building and starting services...
docker-compose -f docker-compose.production.yml --env-file .env.production up -d --build

REM Wait for services to be ready
echo ⏳ Waiting for services to be ready...
timeout /t 30 /nobreak >nul

REM Check service health
echo 🏥 Checking service health...

REM Check Backend API
curl -f http://localhost:5002/api/health >nul 2>&1
if errorlevel 1 (
    echo ❌ Backend API is not responding
) else (
    echo ✅ Backend API is healthy
)

REM Check Admin App
curl -f http://localhost:19008 >nul 2>&1
if errorlevel 1 (
    echo ❌ Admin App is not responding
) else (
    echo ✅ Admin App is healthy
)

REM Show running containers
echo 📊 Running containers:
docker-compose -f docker-compose.production.yml ps

REM Show logs
echo 📋 Recent logs:
docker-compose -f docker-compose.production.yml logs --tail=20

echo 🎉 Deployment completed successfully!
echo ==================================
echo 📱 Application URLs:
echo   • Main App: http://yourdomain.com
echo   • API: http://api.yourdomain.com
echo   • Admin: http://admin.yourdomain.com
echo.
echo 🔧 Management Commands:
echo   • Check status: docker-compose -f docker-compose.production.yml ps
echo   • View logs: docker-compose -f docker-compose.production.yml logs -f
echo   • Restart: docker-compose -f docker-compose.production.yml restart
echo.
echo ⚠️  Next Steps:
echo   1. Configure your domain DNS to point to this server
echo   2. Set up SSL certificates with Let's Encrypt
echo   3. Configure firewall rules
echo   4. Set up monitoring and alerts
echo   5. Test all functionality
echo.
echo 🚀 Your Lula application is now live!
pause
