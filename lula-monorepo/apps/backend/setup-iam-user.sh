#!/bin/bash

# 🔐 IAM User Setup Script for Lula Deployment
# This script helps you create a secure IAM user for deployment

echo "🔐 Setting up IAM User for Lula Deployment"
echo "=========================================="

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed!"
    echo "Please install AWS CLI first:"
    echo "Windows: winget install Amazon.AWSCLI"
    echo "Mac: brew install awscli"
    echo "Linux: curl 'https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip' -o 'awscliv2.zip' && unzip awscliv2.zip && sudo ./aws/install"
    exit 1
fi

# Check if user is logged in
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI is not configured!"
    echo "Please run: aws configure"
    echo "And enter your root credentials temporarily"
    exit 1
fi

echo "✅ AWS CLI is configured"

# Create IAM user
echo "👤 Creating IAM user: lula-deployment"
aws iam create-user --user-name lula-deployment

# Create access key
echo "🔑 Creating access key for lula-deployment"
ACCESS_KEY_OUTPUT=$(aws iam create-access-key --user-name lula-deployment)
ACCESS_KEY_ID=$(echo $ACCESS_KEY_OUTPUT | jq -r '.AccessKey.AccessKeyId')
SECRET_ACCESS_KEY=$(echo $ACCESS_KEY_OUTPUT | jq -r '.AccessKey.SecretAccessKey')

# Attach policies
echo "📋 Attaching policies to lula-deployment"
aws iam attach-user-policy --user-name lula-deployment --policy-arn arn:aws:iam::aws:policy/AmazonEC2FullAccess
aws iam attach-user-policy --user-name lula-deployment --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

# Create credentials file
echo "💾 Creating credentials file"
cat > lula-credentials.txt << EOF
# Lula Deployment Credentials
# Keep this file secure and never commit it to version control!

AWS_ACCESS_KEY_ID=$ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=$SECRET_ACCESS_KEY
AWS_DEFAULT_REGION=us-east-1
AWS_DEFAULT_OUTPUT=json

# To use these credentials:
# 1. Copy the values above
# 2. Run: aws configure
# 3. Enter the Access Key ID and Secret Access Key
# 4. Region: us-east-1
# 5. Output format: json
EOF

echo "✅ IAM user created successfully!"
echo "=========================================="
echo "📋 Credentials saved to: lula-credentials.txt"
echo ""
echo "🔑 Access Key ID: $ACCESS_KEY_ID"
echo "🔐 Secret Access Key: $SECRET_ACCESS_KEY"
echo ""
echo "⚠️  IMPORTANT SECURITY NOTES:"
echo "1. Save these credentials securely"
echo "2. Never share or commit them to version control"
echo "3. Delete this file after copying the credentials"
echo "4. Consider enabling MFA on your root account"
echo ""
echo "🚀 Next steps:"
echo "1. Run: aws configure"
echo "2. Enter the credentials above"
echo "3. Test with: aws ec2 describe-instances"
echo "4. Proceed with deployment!"
