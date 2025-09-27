# 🚀 AWS EC2 Deployment Guide for Lula Platform

This guide will help you deploy the Lula platform (Backend, Admin Panel, User App, and Streamer App) to AWS EC2.

## 📋 Prerequisites

### 1. AWS Account Setup
- AWS account with EC2 permissions
- AWS CLI installed and configured
- SSH key pair created in AWS (named `lula-key`)

### 2. Local Requirements
- Docker installed
- PowerShell (Windows) or Bash (Linux/Mac)
- Git

### 3. AWS CLI Configuration
```bash
aws configure
# Enter your AWS Access Key ID, Secret Access Key, and region (us-east-1)
```

## 🏗️ Infrastructure Overview

The deployment creates:
- **EC2 Instance**: t3.medium (2 vCPU, 4GB RAM)
- **Security Group**: Opens ports 22, 80, 443, 3001, 3002, 19006, 19007
- **Docker Containers**: Backend, Admin, User App, Streamer App, MongoDB, Nginx

## 🚀 Quick Deployment

### Option 1: PowerShell (Windows)
```powershell
# Setup infrastructure and launch instance
.\deploy-aws.ps1 setup

# Deploy application
.\deploy-aws.ps1 deploy

# Check status
.\deploy-aws.ps1 status
```

### Option 2: Bash (Linux/Mac)
```bash
# Make script executable
chmod +x deploy-aws.sh

# Setup infrastructure and launch instance
./deploy-aws.sh setup

# Deploy application
./deploy-aws.sh deploy

# Check status
./deploy-aws.sh status
```

## 📱 Application URLs

After deployment, your applications will be available at:

- **Admin Panel**: `http://YOUR_EC2_IP/admin/`
- **User App**: `http://YOUR_EC2_IP/user/`
- **Streamer App**: `http://YOUR_EC2_IP/streamer/`
- **Backend API**: `http://YOUR_EC2_IP/api/`
- **Health Check**: `http://YOUR_EC2_IP/health`

## 🔧 Manual Deployment Steps

If you prefer manual deployment:

### 1. Launch EC2 Instance
```bash
# Create security group
aws ec2 create-security-group \
    --group-name lula-sg \
    --description "Lula platform security group"

# Add inbound rules
aws ec2 authorize-security-group-ingress \
    --group-name lula-sg \
    --protocol tcp \
    --port 22 \
    --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
    --group-name lula-sg \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0

# Launch instance
aws ec2 run-instances \
    --image-id ami-0c02fb55956c7d316 \
    --count 1 \
    --instance-type t3.medium \
    --key-name lula-key \
    --security-groups lula-sg
```

### 2. Connect to Instance
```bash
# Get public IP
aws ec2 describe-instances --query 'Reservations[0].Instances[0].PublicIpAddress' --output text

# SSH to instance
ssh -i ~/.ssh/lula-key.pem ec2-user@YOUR_EC2_IP
```

### 3. Install Dependencies
```bash
# Update system
sudo yum update -y

# Install Docker
sudo yum install -y docker git
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -a -G docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
```

### 4. Deploy Application
```bash
# Create application directory
mkdir -p /home/ec2-user/lula
cd /home/ec2-user/lula

# Clone or upload your code
# (Upload your lula-monorepo files here)

# Create environment files
cp apps/backend/env.example apps/backend/.env
echo "VITE_BACKEND_URL=http://localhost:3002" > apps/admin-web/.env

# Build and start services
docker-compose -f docker-compose.aws.yml build
docker-compose -f docker-compose.aws.yml up -d
```

## 🔒 SSL/HTTPS Setup (Optional)

For production with HTTPS:

### 1. Get SSL Certificate
```bash
# Install Certbot
sudo yum install -y certbot

# Get certificate (replace with your domain)
sudo certbot certonly --standalone -d yourdomain.com
```

### 2. Update Nginx Configuration
```bash
# Copy certificates
sudo mkdir -p /home/ec2-user/lula/tools/docker/ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /home/ec2-user/lula/tools/docker/ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem /home/ec2-user/lula/tools/docker/ssl/key.pem

# Update nginx-aws.conf to enable HTTPS
# Uncomment the HTTPS server block
```

## 📊 Monitoring and Logs

### View Logs
```bash
# All services
docker-compose -f docker-compose.aws.yml logs

# Specific service
docker-compose -f docker-compose.aws.yml logs backend
docker-compose -f docker-compose.aws.yml logs admin-web
```

### Check Status
```bash
# Service status
docker-compose -f docker-compose.aws.yml ps

# Health checks
curl http://localhost/health
curl http://localhost/api/health
```

## 🔄 Updates and Maintenance

### Update Application
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.aws.yml down
docker-compose -f docker-compose.aws.yml build
docker-compose -f docker-compose.aws.yml up -d
```

### Backup Database
```bash
# Create backup
docker-compose -f docker-compose.aws.yml exec mongo mongodump --out /data/backup

# Copy backup to local
docker cp $(docker-compose -f docker-compose.aws.yml ps -q mongo):/data/backup ./mongodb-backup
```

## 💰 Cost Optimization

### Instance Types
- **Development**: t3.micro (1 vCPU, 1GB RAM) - ~$8/month
- **Production**: t3.medium (2 vCPU, 4GB RAM) - ~$30/month
- **High Traffic**: t3.large (2 vCPU, 8GB RAM) - ~$60/month

### Auto Scaling (Advanced)
```bash
# Create launch template
aws ec2 create-launch-template \
    --launch-template-name lula-template \
    --launch-template-data '{"ImageId":"ami-0c02fb55956c7d316","InstanceType":"t3.medium","KeyName":"lula-key","SecurityGroupIds":["sg-xxxxxxxxx"]}'

# Create auto scaling group
aws autoscaling create-auto-scaling-group \
    --auto-scaling-group-name lula-asg \
    --launch-template LaunchTemplateName=lula-template \
    --min-size 1 \
    --max-size 3 \
    --desired-capacity 1
```

## 🛠️ Troubleshooting

### Common Issues

**1. Port Already in Use**
```bash
# Check what's using the port
sudo netstat -tulpn | grep :80

# Kill process
sudo kill -9 PID
```

**2. Docker Build Fails**
```bash
# Check Docker logs
docker-compose -f docker-compose.aws.yml logs backend

# Rebuild without cache
docker-compose -f docker-compose.aws.yml build --no-cache
```

**3. Database Connection Issues**
```bash
# Check MongoDB status
docker-compose -f docker-compose.aws.yml exec mongo mongosh --eval "db.adminCommand('ping')"

# Check network connectivity
docker-compose -f docker-compose.aws.yml exec backend ping mongo
```

**4. SSL Certificate Issues**
```bash
# Renew certificate
sudo certbot renew

# Check certificate
openssl x509 -in /etc/letsencrypt/live/yourdomain.com/cert.pem -text -noout
```

## 📞 Support

For issues or questions:
1. Check the logs: `docker-compose -f docker-compose.aws.yml logs`
2. Verify all services are running: `docker-compose -f docker-compose.aws.yml ps`
3. Test connectivity: `curl http://localhost/health`

## 🎯 Next Steps

After successful deployment:
1. **Configure Domain**: Point your domain to the EC2 IP
2. **Set up SSL**: Enable HTTPS with Let's Encrypt
3. **Monitor**: Set up CloudWatch monitoring
4. **Backup**: Configure automated database backups
5. **Scale**: Consider load balancer for high traffic

**Your Lula platform is now live on AWS! 🎉**
