@echo off
REM Lula Backend Docker Deployment Script for Windows
REM This script deploys the Lula backend using Docker Compose

echo 🚀 Starting Lula Backend Docker Deployment...
echo ==============================================

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not running. Please start Docker first.
    exit /b 1
)

echo [INFO] Docker is running ✅

REM Check if Docker Compose is available
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker Compose is not installed. Please install Docker Compose first.
    exit /b 1
)

echo [INFO] Docker Compose is available ✅

REM Check if environment file exists
if not exist "env.docker" (
    echo [ERROR] Environment file 'env.docker' not found. Please create it first.
    exit /b 1
)

echo [INFO] Environment file found ✅

REM Check if Firebase service account key exists
if not exist "firebase-service-account.json" (
    echo [WARNING] Firebase service account key not found. Migration features will be disabled.
    echo [WARNING] To enable migration, place 'firebase-service-account.json' in the project root.
)

REM Stop existing containers if running
echo [STEP] Stopping existing containers...
docker-compose down --remove-orphans

REM Build the Docker image
echo [STEP] Building Docker image...
docker-compose build --no-cache

REM Start the services
echo [STEP] Starting services...
docker-compose up -d

REM Wait for services to be ready
echo [STEP] Waiting for services to be ready...
timeout /t 10 /nobreak >nul

REM Check service health
echo [STEP] Checking service health...

REM Check MongoDB
docker-compose exec -T mongodb mongosh --eval "db.runCommand('ping')" >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] MongoDB is healthy ✅
) else (
    echo [ERROR] MongoDB is not responding
    docker-compose logs mongodb
    exit /b 1
)

REM Check Redis
docker-compose exec -T redis redis-cli ping >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Redis is healthy ✅
) else (
    echo [ERROR] Redis is not responding
    docker-compose logs redis
    exit /b 1
)

REM Check Backend
timeout /t 5 /nobreak >nul
curl -f http://localhost:5002/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Backend API is healthy ✅
) else (
    echo [WARNING] Backend API is not responding yet. Checking logs...
    docker-compose logs backend
    echo [WARNING] Backend might still be starting up. Please wait a moment and check again.
)

REM Display service information
echo.
echo ==============================================
echo 🎉 Lula Backend Deployment Complete!
echo ==============================================
echo.
echo 📊 Service Information:
echo   • Backend API: http://localhost:5002
echo   • MongoDB: localhost:27019
echo   • Redis: localhost:6380
echo   • Nginx: http://localhost:8080 (HTTP), https://localhost:8443 (HTTPS)
echo.
echo 🔍 Useful Commands:
echo   • View logs: docker-compose logs -f
echo   • Stop services: docker-compose down
echo   • Restart services: docker-compose restart
echo   • Check status: docker-compose ps
echo.
echo 📋 API Endpoints:
echo   • Health Check: http://localhost:5002/api/health
echo   • API Documentation: http://localhost:5002/api/docs
echo   • Admin Panel: http://localhost:5002/api/admin
echo.
echo 🚀 Your Lula Backend is now running on Docker!
echo.

REM Optional: Run migration if Firebase key exists
if exist "firebase-service-account.json" (
    echo 🔄 Firebase migration key found. Would you like to run data migration? (y/n)
    set /p response=
    if /i "%response%"=="y" (
        echo [STEP] Running Firebase to MongoDB migration...
        docker-compose exec backend npm run migrate
        echo [INFO] Migration completed ✅
    )
)

echo [INFO] Deployment completed successfully! 🎉
pause
