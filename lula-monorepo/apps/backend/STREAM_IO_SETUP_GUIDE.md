# 🔑 **STREAM.IO API SECRET SETUP GUIDE**

## **Current Status**
- ✅ **API Key Found:** `d9haf5vcbwwp` (already configured in apps)
- ❌ **API Secret Missing:** Need to get from Stream.io dashboard

## **How to Get Stream.io API Secret**

### **Step 1: Access Stream.io Dashboard**
1. Go to [https://dashboard.stream.io/](https://dashboard.stream.io/)
2. Sign in with your account (or create one if needed)

### **Step 2: Find Your Project**
1. Look for project with API Key: `d9haf5vcbwwp`
2. If you can't find it, you may need to:
   - Check if you have access to the account that created the project
   - Contact the original developer who set up Stream.io
   - Create a new project (will require updating API key in apps)

### **Step 3: Get API Secret**
1. Click on your project
2. Go to **"API Keys"** section
3. Copy the **"API Secret"** (it looks like: `abc123def456ghi789...`)

### **Step 4: Update Backend Configuration**
1. Copy the API secret
2. Update your `.env` file:
   ```bash
   STREAM_API_SECRET=your-actual-api-secret-here
   ```

## **Alternative: Create New Stream.io Project**

If you can't access the existing project:

### **Step 1: Create New Project**
1. Go to [https://dashboard.stream.io/](https://dashboard.stream.io/)
2. Click **"Create App"**
3. Choose **"Video & Audio"** or **"Chat"**
4. Fill in app details:
   - **App Name:** Lula App
   - **Environment:** Production
   - **Region:** Choose closest to your users

### **Step 2: Get New Credentials**
1. Copy the new **API Key**
2. Copy the new **API Secret**

### **Step 3: Update All Configurations**
1. **Backend `.env` file:**
   ```bash
   STREAM_API_KEY=your-new-api-key
   STREAM_API_SECRET=your-new-api-secret
   ```

2. **User App (`user-app/utils/CallManager.js`):**
   ```javascript
   this.client = new StreamVideoClient({
       apiKey: 'your-new-api-key', // Update this
       user,
       tokenProvider: token,
       // ... rest of config
   });
   ```

3. **Streamer App (`streamer-app/utils/CallManager.js`):**
   ```javascript
   this.client = new StreamVideoClient({
       apiKey: 'your-new-api-key', // Update this
       user,
       tokenProvider: token,
       // ... rest of config
   });
   ```

## **Testing the Integration**

Once you have the API secret:

### **Step 1: Test Token Generation**
```bash
curl -X POST http://localhost:5000/api/stream/token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"userData": {}}'
```

### **Step 2: Test Configuration Status**
```bash
curl -X GET http://localhost:5000/api/stream/config \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## **Expected Response**

With proper configuration:
```json
{
  "error": false,
  "message": "Stream.io configuration status retrieved",
  "config": {
    "apiKey": "d9haf5vcbwwp",
    "hasApiSecret": true,
    "isConfigured": true,
    "clientInitialized": true
  }
}
```

## **Troubleshooting**

### **Issue: "Stream.io API secret not configured"**
- **Solution:** Add `STREAM_API_SECRET` to your `.env` file
- **Check:** Make sure there are no extra spaces or quotes

### **Issue: "User not found"**
- **Solution:** Ensure user exists in MongoDB before generating token
- **Check:** User must be authenticated and have valid JWT token

### **Issue: Token generation fails**
- **Solution:** Check Stream.io dashboard for any API limits or restrictions
- **Check:** Verify API secret is correct and not expired

## **Next Steps After Setup**

1. **Update Apps:** Change token provider URL from Vercel to your backend
2. **Test Calls:** Verify video/audio calls work end-to-end
3. **Monitor Quality:** Use call quality endpoints for monitoring
4. **Enable Chat:** Test messaging functionality

## **Security Notes**

- ⚠️ **Never commit API secret to version control**
- ⚠️ **Use environment variables for all secrets**
- ⚠️ **Rotate API secrets regularly**
- ⚠️ **Monitor API usage in Stream.io dashboard**

---

## **Quick Setup Commands**

```bash
# 1. Add API secret to .env file
echo "STREAM_API_SECRET=your-secret-here" >> .env

# 2. Restart backend
npm run dev

# 3. Test configuration
curl -X GET http://localhost:5000/api/stream/config \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Once you have the API secret, the Stream.io integration will be fully functional!** 🚀
