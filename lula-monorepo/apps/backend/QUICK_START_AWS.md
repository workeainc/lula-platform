# 🚀 Quick Start: Deploy Lula to AWS

## 📋 What You Need to Provide

### 1. AWS Account Information
- **AWS Account ID** (12-digit number)
- **Access Key ID** and **Secret Access Key** (from IAM)
- **Preferred AWS Region** (e.g., us-east-1, us-west-2)

### 2. Domain Information (Optional)
- **Domain name** (e.g., lula.com, yourdomain.com)
- **DNS access** to point domain to your EC2 instance

### 3. Service Credentials
- **AWS S3 Bucket** name and credentials
- **Stream.io API Secret** (you already have the key)
- **Twilio credentials** for OTP (if using SMS)

## 🎯 Step-by-Step Deployment

### Step 1: Set Up AWS Account (5 minutes)

1. **Create AWS Account**
   - Go to https://aws.amazon.com
   - Click "Create an AWS Account"
   - Follow the signup process

2. **Create IAM User**
   - Go to IAM → Users → Create User
   - Username: `lula-deployment`
   - Attach policies: `AmazonEC2FullAccess`, `AmazonS3FullAccess`
   - Create access key and download credentials

3. **Install AWS CLI**
   ```bash
   # Windows (PowerShell as Administrator)
   winget install Amazon.AWSCLI
   
   # Configure
   aws configure
   # Enter your Access Key ID and Secret Access Key
   # Region: us-east-1
   # Output format: json
   ```

### Step 2: Launch EC2 Instance (10 minutes)

1. **Go to EC2 Console**
   - https://console.aws.amazon.com/ec2/

2. **Launch Instance**
   - Click "Launch Instance"
   - Name: `lula-production-server`
   - AMI: Ubuntu Server 22.04 LTS
   - Instance Type: t3.medium (2 vCPU, 4GB RAM)
   - Key Pair: Create new → `lula-keypair`
   - Security Group: Create new with these rules:
     - SSH (22): Your IP only
     - HTTP (80): 0.0.0.0/0
     - HTTPS (443): 0.0.0.0/0
     - Custom (5002): 0.0.0.0/0
     - Custom (19006): 0.0.0.0/0
     - Custom (19007): 0.0.0.0/0
     - Custom (19008): 0.0.0.0/0

3. **Launch and Connect**
   - Download the .pem key file
   - Connect via SSH or EC2 Instance Connect

### Step 3: Deploy Application (15 minutes)

1. **Connect to EC2**
   ```bash
   # Using SSH (replace with your key path and IP)
   ssh -i ~/.ssh/lula-keypair.pem ubuntu@YOUR_EC2_IP
   ```

2. **Install Docker**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker ubuntu
   
   # Install Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

3. **Upload Your Code**
   ```bash
   # Option 1: Clone from Git (if you have a repository)
   git clone https://github.com/yourusername/lula-backend.git
   cd lula-backend
   
   # Option 2: Upload via SCP (from your local machine)
   # scp -i ~/.ssh/lula-keypair.pem -r ./lula-backend ubuntu@YOUR_EC2_IP:/home/ubuntu/
   ```

4. **Configure Environment**
   ```bash
   # Create production environment file
   nano .env.production
   
   # Add your production variables (see template below)
   ```

5. **Deploy**
   ```bash
   # Make deployment script executable
   chmod +x deploy-aws.sh
   
   # Run deployment
   ./deploy-aws.sh
   ```

### Step 4: Configure Domain (5 minutes)

1. **Point Domain to EC2**
   - Go to your domain registrar
   - Update DNS A record to point to your EC2 public IP
   - Add CNAME records:
     - `api.yourdomain.com` → `yourdomain.com`
     - `admin.yourdomain.com` → `yourdomain.com`

2. **Set up SSL**
   ```bash
   # Install Certbot
   sudo apt install certbot python3-certbot-nginx -y
   
   # Get SSL certificate
   sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com -d admin.yourdomain.com
   ```

## 📝 Environment Variables Template

Create `.env.production` with these variables:

```bash
# Environment
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb://admin:YOUR_SECURE_PASSWORD@mongodb:27017/lula?authSource=admin
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=YOUR_SECURE_PASSWORD
MONGO_DATABASE=lula

# JWT
JWT_SECRET=YOUR_SUPER_SECURE_JWT_SECRET_FOR_PRODUCTION
JWT_EXPIRE=7d

# AWS S3
AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_KEY
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-lula-media-storage

# Stream.io
STREAM_API_KEY=d9haf5vcbwwp
STREAM_API_SECRET=YOUR_STREAM_API_SECRET

# Coin System
COIN_RATE_PER_MINUTE=49
COMMISSION_PERCENTAGE=30
MINIMUM_BALANCE=49

# CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://admin.yourdomain.com,https://api.yourdomain.com

# Twilio (for OTP)
TWILIO_ACCOUNT_SID=YOUR_TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN=YOUR_TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER=YOUR_TWILIO_PHONE_NUMBER
```

## 🎉 After Deployment

### Your Application URLs:
- **Main App:** https://yourdomain.com
- **API:** https://api.yourdomain.com
- **Admin Panel:** https://admin.yourdomain.com

### Management Commands:
```bash
# Check status
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs -f

# Restart services
docker-compose -f docker-compose.production.yml restart

# Health check
./health-check.sh

# Monitor system
./monitor.sh

# Backup data
./backup.sh
```

## 💰 Estimated Costs

- **EC2 t3.medium:** ~$30/month
- **EBS Storage (50GB):** ~$5/month
- **Data Transfer:** ~$5-10/month
- **Route 53:** ~$1/month
- **Total:** ~$40-50/month

## 🆘 Need Help?

If you get stuck at any step, just let me know:
1. **Which step** you're on
2. **What error** you're seeing
3. **Screenshot** of the issue (if possible)

I'll guide you through it step by step! 🚀

## 🔐 Security Checklist

- [ ] Enable MFA on AWS account
- [ ] Use IAM roles instead of root access
- [ ] Configure security groups properly
- [ ] Set up SSL certificates
- [ ] Enable VPC for network isolation
- [ ] Regular security updates
- [ ] Database encryption at rest
- [ ] SSL/TLS encryption in transit

---

**Ready to deploy? Let's get your Lula application live! 🚀**
