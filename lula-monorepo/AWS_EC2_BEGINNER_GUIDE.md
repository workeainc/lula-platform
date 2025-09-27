# 🚀 Complete AWS EC2 Setup Guide for Beginners

This guide will walk you through creating your first AWS EC2 instance from scratch, even if you have zero AWS experience.

## 📋 Prerequisites

- Computer with internet connection
- Credit card (for AWS account)
- Basic computer skills

## 🎯 What We'll Build

- AWS account setup
- EC2 instance (virtual server)
- Deploy your Lula platform
- Access your applications online

---

## Step 1: Create AWS Account

### 1.1 Go to AWS Website
1. Open your web browser
2. Go to: https://aws.amazon.com
3. Click **"Create an AWS Account"** (top right)

### 1.2 Account Information
1. **Email address**: Use your email
2. **Password**: Create a strong password
3. **AWS account name**: "My Lula Project" (or any name)
4. Click **"Continue"**

### 1.3 Contact Information
1. **Full name**: Your name
2. **Phone number**: Your phone number
3. **Country/Region**: Select your country
4. **Address**: Your address
5. Click **"Create Account and Continue"**

### 1.4 Payment Information
1. **Credit card**: Enter your card details
2. **Billing address**: Same as above
3. Click **"Secure Submit"**

### 1.5 Identity Verification
1. AWS will call your phone number
2. Enter the verification code when prompted
3. Click **"Continue"**

### 1.6 Support Plan
1. Select **"Basic Plan"** (Free)
2. Click **"Complete sign up"**

### 1.7 Account Activation
- Wait 5-10 minutes for account activation
- You'll receive a confirmation email

---

## Step 2: Access AWS Console

### 2.1 Login to AWS
1. Go to: https://console.aws.amazon.com
2. Click **"Sign in to the Console"**
3. Enter your email and password
4. Click **"Sign in"**

### 2.2 Select Region
1. In the top-right corner, click the region dropdown
2. Select **"US East (N. Virginia) us-east-1"**
3. This is important for our deployment

---

## Step 3: Create SSH Key Pair

### 3.1 Go to EC2 Service
1. In the AWS Console, search for **"EC2"**
2. Click on **"EC2"** service
3. You'll see the EC2 Dashboard

### 3.2 Create Key Pair
1. In the left sidebar, click **"Key Pairs"**
2. Click **"Create key pair"**
3. **Name**: `lula-key`
4. **Key pair type**: RSA
5. **Private key file format**: .pem
6. Click **"Create key pair"**

### 3.3 Download Key
1. The key will automatically download
2. Save it to: `C:\Users\YourName\.ssh\lula-key.pem`
3. **Important**: Keep this file safe! You'll need it to connect to your server

---

## Step 4: Install AWS CLI

### 4.1 Download AWS CLI
1. Go to: https://aws.amazon.com/cli/
2. Click **"Download the AWS CLI MSI installer for Windows"**
3. Run the downloaded file
4. Follow the installation wizard
5. Click **"Next"** through all steps
6. Click **"Install"**

### 4.2 Verify Installation
1. Open **Command Prompt** (Press Windows + R, type `cmd`, press Enter)
2. Type: `aws --version`
3. You should see: `aws-cli/2.x.x`

### 4.3 Configure AWS CLI
1. In Command Prompt, type: `aws configure`
2. **AWS Access Key ID**: (We'll get this next)
3. **AWS Secret Access Key**: (We'll get this next)
4. **Default region name**: `us-east-1`
5. **Default output format**: `json`

---

## Step 5: Get AWS Credentials

### 5.1 Create Access Key
1. In AWS Console, click your name (top right)
2. Click **"Security credentials"**
3. Scroll down to **"Access keys"**
4. Click **"Create access key"**
5. Select **"Command Line Interface (CLI)"**
6. Check the confirmation box
7. Click **"Next"**
8. Click **"Create access key"**

### 5.2 Copy Credentials
1. **Access Key ID**: Copy this value
2. **Secret Access Key**: Copy this value
3. **Important**: Save these somewhere safe!

### 5.3 Configure AWS CLI Again
1. Open Command Prompt
2. Type: `aws configure`
3. Enter your Access Key ID
4. Enter your Secret Access Key
5. Region: `us-east-1`
6. Output format: `json`

---

## Step 6: Launch EC2 Instance

### 6.1 Go to EC2 Dashboard
1. In AWS Console, search for **"EC2"**
2. Click **"EC2"** service
3. Click **"Launch instance"**

### 6.2 Choose Instance Name
1. **Name**: `Lula Server`
2. Click **"Next"**

### 6.3 Choose Application and OS Image
1. **Application and OS Images**: Amazon Linux
2. **Architecture**: 64-bit (x86)
3. Click **"Next"**

### 6.4 Choose Instance Type
1. **Instance type**: t3.medium
2. This gives you 2 vCPU and 4GB RAM
3. Click **"Next"**

### 6.5 Create or Select Key Pair
1. **Key pair name**: Select `lula-key` (the one we created)
2. Click **"Next"**

### 6.6 Configure Network Settings
1. **VPC**: Default VPC
2. **Subnet**: Default subnet
3. **Auto-assign public IP**: Enable
4. **Security group**: Create new security group
5. **Security group name**: `lula-sg`
6. **Description**: `Security group for Lula platform`

### 6.7 Add Security Group Rules
Click **"Add security group rule"** for each port:

1. **Port 22** (SSH):
   - Type: SSH
   - Port: 22
   - Source: Anywhere (0.0.0.0/0)

2. **Port 80** (HTTP):
   - Type: HTTP
   - Port: 80
   - Source: Anywhere (0.0.0.0/0)

3. **Port 443** (HTTPS):
   - Type: HTTPS
   - Port: 443
   - Source: Anywhere (0.0.0.0/0)

4. **Port 3001** (Admin):
   - Type: Custom TCP
   - Port: 3001
   - Source: Anywhere (0.0.0.0/0)

5. **Port 3002** (API):
   - Type: Custom TCP
   - Port: 3002
   - Source: Anywhere (0.0.0.0/0)

6. **Port 19006** (User App):
   - Type: Custom TCP
   - Port: 19006
   - Source: Anywhere (0.0.0.0/0)

7. **Port 19007** (Streamer App):
   - Type: Custom TCP
   - Port: 19007
   - Source: Anywhere (0.0.0.0/0)

### 6.8 Configure Storage
1. **Volume size**: 20 GB
2. **Volume type**: gp3
3. Click **"Next"**

### 6.9 Advanced Details
1. **User data**: Copy and paste this script:

```bash
#!/bin/bash
yum update -y
yum install -y docker git
systemctl start docker
systemctl enable docker
usermod -a -G docker ec2-user

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# Create application directory
mkdir -p /home/ec2-user/lula
chown ec2-user:ec2-user /home/ec2-user/lula
```

### 6.10 Launch Instance
1. Click **"Launch instance"**
2. Wait for the instance to be "Running"
3. Note the **Public IPv4 address** (you'll need this)

---

## Step 7: Connect to Your Server

### 7.1 Get Your Server IP
1. In EC2 Dashboard, click **"Instances"**
2. Find your instance
3. Copy the **Public IPv4 address** (e.g., 54.123.45.67)

### 7.2 Connect via SSH
1. Open **Command Prompt**
2. Navigate to your SSH key folder:
   ```
   cd C:\Users\YourName\.ssh
   ```

3. Connect to your server:
   ```
   ssh -i lula-key.pem ec2-user@YOUR_SERVER_IP
   ```
   (Replace YOUR_SERVER_IP with your actual IP)

4. Type **"yes"** when asked about host key verification

### 7.3 Verify Connection
You should see something like:
```
[ec2-user@ip-172-31-xx-xx ~]$
```

---

## Step 8: Deploy Your Lula Application

### 8.1 Upload Your Code
1. **Option A - Using SCP (Recommended)**:
   ```bash
   # From your local computer (Command Prompt)
   scp -i C:\Users\YourName\.ssh\lula-key.pem -r "F:\Freelancer Work\backend redesing\lula-monorepo" ec2-user@YOUR_SERVER_IP:/home/ec2-user/
   ```

2. **Option B - Using Git**:
   ```bash
   # On your server (SSH session)
   cd /home/ec2-user
   git clone YOUR_GIT_REPOSITORY_URL
   ```

### 8.2 Set Up Environment
1. On your server (SSH session):
   ```bash
   cd /home/ec2-user/lula-monorepo
   
   # Create environment files
   cp apps/backend/env.example apps/backend/.env
   echo "VITE_BACKEND_URL=http://localhost:3002" > apps/admin-web/.env
   ```

### 8.3 Deploy with Docker
1. Build and start all services:
   ```bash
   docker-compose -f docker-compose.aws.yml build
   docker-compose -f docker-compose.aws.yml up -d
   ```

2. Check if everything is running:
   ```bash
   docker-compose -f docker-compose.aws.yml ps
   ```

---

## Step 9: Access Your Applications

### 9.1 Get Your Server IP
- From EC2 Dashboard, copy your **Public IPv4 address**

### 9.2 Open Your Applications
Open these URLs in your browser:

- **Admin Panel**: `http://YOUR_SERVER_IP/admin/`
- **User App**: `http://YOUR_SERVER_IP/user/`
- **Streamer App**: `http://YOUR_SERVER_IP/streamer/`
- **API**: `http://YOUR_SERVER_IP/api/`

---

## Step 10: Monitor Your Server

### 10.1 Check Logs
```bash
# View all service logs
docker-compose -f docker-compose.aws.yml logs

# View specific service logs
docker-compose -f docker-compose.aws.yml logs backend
```

### 10.2 Check Status
```bash
# Check if services are running
docker-compose -f docker-compose.aws.yml ps

# Check server resources
top
```

---

## 💰 Cost Management

### Free Tier
- **t3.micro**: Free for 12 months (750 hours/month)
- **Storage**: 30 GB free
- **Data transfer**: 1 GB free

### Estimated Costs (After Free Tier)
- **t3.medium**: ~$30/month
- **Storage**: ~$2/month
- **Data transfer**: ~$1/month
- **Total**: ~$33/month

### Cost Optimization Tips
1. Use **t3.micro** for development
2. **Stop** your instance when not using it
3. **Terminate** when done (saves storage costs)

---

## 🛠️ Troubleshooting

### Common Issues

**1. Can't connect via SSH**
- Check security group allows port 22
- Verify key file permissions
- Ensure instance is running

**2. Applications not loading**
- Check security group allows ports 80, 3001, 3002, 19006, 19007
- Verify Docker containers are running
- Check logs: `docker-compose logs`

**3. Out of memory**
- Upgrade to t3.large or t3.xlarge
- Or optimize your application

**4. High costs**
- Stop instance when not using
- Use smaller instance type
- Monitor usage in AWS Console

---

## 🎉 Congratulations!

You now have:
- ✅ AWS account set up
- ✅ EC2 instance running
- ✅ Lula platform deployed
- ✅ Applications accessible online

### Next Steps
1. **Domain setup**: Point your domain to the server IP
2. **SSL certificate**: Enable HTTPS
3. **Monitoring**: Set up alerts
4. **Backup**: Configure automated backups

### Support
- **AWS Documentation**: https://docs.aws.amazon.com/
- **EC2 User Guide**: https://docs.aws.amazon.com/ec2/
- **Docker Documentation**: https://docs.docker.com/

**Your Lula platform is now live on AWS! 🚀**
