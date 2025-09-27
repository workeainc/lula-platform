#!/bin/bash

# Firebase Credentials Setup Script for Lula Backend Migration
# This script helps you set up Firebase credentials for data migration

echo "🔥 Firebase Credentials Setup for Lula Backend Migration"
echo "========================================================"

# Project details from your mobile apps
PROJECT_ID="lula-app-e7bf5"
PROJECT_NUMBER="329013869298"
STORAGE_BUCKET="lula-app-e7bf5.firebasestorage.app"

echo "📱 Found Firebase Project Details:"
echo "   Project ID: $PROJECT_ID"
echo "   Project Number: $PROJECT_NUMBER"
echo "   Storage Bucket: $STORAGE_BUCKET"
echo ""

echo "📋 Next Steps:"
echo "1. Go to Firebase Console: https://console.firebase.google.com/"
echo "2. Select project: $PROJECT_ID"
echo "3. Go to Settings ⚙️ → Project settings"
echo "4. Click 'Service accounts' tab"
echo "5. Click 'Generate new private key'"
echo "6. Download the JSON file"
echo "7. Rename it to 'firebase-service-account.json'"
echo "8. Place it in the lula-backend directory"
echo ""

# Check if service account key exists
if [ -f "firebase-service-account.json" ]; then
    echo "✅ Firebase service account key found!"
    echo "   File: firebase-service-account.json"
    
    # Extract project ID from the key file
    EXTRACTED_PROJECT_ID=$(grep -o '"project_id": "[^"]*"' firebase-service-account.json | cut -d'"' -f4)
    echo "   Project ID in key: $EXTRACTED_PROJECT_ID"
    
    if [ "$EXTRACTED_PROJECT_ID" = "$PROJECT_ID" ]; then
        echo "✅ Project ID matches!"
    else
        echo "⚠️  Project ID mismatch! Expected: $PROJECT_ID, Found: $EXTRACTED_PROJECT_ID"
    fi
    
    echo ""
    echo "🔧 Update your .env file with:"
    echo "FIREBASE_PROJECT_ID=$PROJECT_ID"
    echo "FIREBASE_SERVICE_ACCOUNT_KEY=./firebase-service-account.json"
    echo ""
    echo "🚀 Ready to run migration:"
    echo "   npm run migrate"
    
else
    echo "❌ Firebase service account key not found!"
    echo "   Please follow the steps above to download and place the key file."
    echo ""
    echo "📁 Expected file location: $(pwd)/firebase-service-account.json"
fi

echo ""
echo "🔍 Your Firebase Collections (from mobile apps):"
echo "   - users (User profiles and data)"
echo "   - callLogs (Call history and tracking)"
echo "   - chats (Messages between users/streamers)"
echo "   - withdrawals (Payout requests)"
echo "   - posts (User posts/feeds)"
echo "   - transactions (Coin transactions)"
echo ""

echo "📊 Migration will transfer:"
echo "   ✅ User data (profiles, settings, balances)"
echo "   ✅ Call logs (history, duration, billing)"
echo "   ✅ Transaction history (purchases, deductions, commissions)"
echo "   ✅ Chat messages (conversations between users)"
echo "   ✅ File storage (profile images, videos → S3)"
echo ""

echo "🎯 After migration setup:"
echo "   1. Test the migration: npm run migrate"
echo "   2. Verify data integrity"
echo "   3. Update mobile apps to use new backend"
echo "   4. Deploy to production"
