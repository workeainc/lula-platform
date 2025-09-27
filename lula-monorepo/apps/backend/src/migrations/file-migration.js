const admin = require('firebase-admin');
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

class FirebaseStorageToS3Migrator {
  constructor() {
    this.initializeFirebase();
    this.initializeS3();
    this.migrationStats = {
      files: { total: 0, migrated: 0, errors: 0 },
      totalSize: 0
    };
  }

  initializeFirebase() {
    try {
      const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      
      if (!serviceAccountPath || !fs.existsSync(serviceAccountPath)) {
        throw new Error('Firebase service account key file not found');
      }

      const serviceAccount = require('../../firebase-service-account.json');
      
      try {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`
        });
      } catch (error) {
        if (error.code === 'app/duplicate-app') {
          // App already initialized, get existing app
          admin.app();
        } else {
          throw error;
        }
      }

      this.storage = admin.storage();
      this.bucket = this.storage.bucket();
      console.log('✅ Firebase Storage initialized');
    } catch (error) {
      console.error('❌ Firebase Storage initialization failed:', error.message);
      throw error;
    }
  }

  initializeS3() {
    try {
      AWS.config.update({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION
      });

      this.s3 = new AWS.S3();
      this.bucketName = process.env.S3_BUCKET_NAME;
      console.log('✅ AWS S3 initialized');
    } catch (error) {
      console.error('❌ AWS S3 initialization failed:', error.message);
      throw error;
    }
  }

  // Download file from Firebase Storage
  async downloadFirebaseFile(filePath) {
    try {
      const file = this.bucket.file(filePath);
      const [exists] = await file.exists();
      
      if (!exists) {
        throw new Error(`File ${filePath} does not exist in Firebase Storage`);
      }

      const tempPath = path.join(__dirname, 'temp', path.basename(filePath));
      
      // Ensure temp directory exists
      const tempDir = path.dirname(tempPath);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      await file.download({ destination: tempPath });
      return tempPath;
    } catch (error) {
      console.error(`❌ Error downloading ${filePath}:`, error.message);
      throw error;
    }
  }

  // Upload file to S3
  async uploadToS3(localPath, s3Key, contentType) {
    try {
      const fileContent = fs.readFileSync(localPath);
      
      const params = {
        Bucket: this.bucketName,
        Key: s3Key,
        Body: fileContent,
        ContentType: contentType,
        ACL: 'public-read' // Make files publicly accessible
      };

      const result = await this.s3.upload(params).promise();
      
      // Clean up local file
      fs.unlinkSync(localPath);
      
      return result.Location;
    } catch (error) {
      console.error(`❌ Error uploading to S3:`, error.message);
      throw error;
    }
  }

  // Get content type based on file extension
  getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.mp4': 'video/mp4',
      '.avi': 'video/x-msvideo',
      '.mov': 'video/quicktime',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };
    
    return contentTypes[ext] || 'application/octet-stream';
  }

  // Migrate single file
  async migrateFile(firebasePath, s3Path) {
    try {
      console.log(`🔄 Migrating: ${firebasePath} -> ${s3Path}`);
      
      // Download from Firebase
      const localPath = await this.downloadFirebaseFile(firebasePath);
      
      // Get file size
      const stats = fs.statSync(localPath);
      this.migrationStats.totalSize += stats.size;
      
      // Get content type
      const contentType = this.getContentType(firebasePath);
      
      // Upload to S3
      const s3Url = await this.uploadToS3(localPath, s3Path, contentType);
      
      this.migrationStats.files.migrated++;
      console.log(`✅ Migrated: ${firebasePath} -> ${s3Url}`);
      
      return s3Url;
    } catch (error) {
      console.error(`❌ Failed to migrate ${firebasePath}:`, error.message);
      this.migrationStats.files.errors++;
      throw error;
    }
  }

  // List all files in Firebase Storage
  async listFirebaseFiles(prefix = '') {
    try {
      const [files] = await this.bucket.getFiles({ prefix });
      return files.map(file => file.name);
    } catch (error) {
      console.error('❌ Error listing Firebase files:', error.message);
      throw error;
    }
  }

  // Migrate all files from Firebase Storage to S3
  async migrateAllFiles() {
    console.log('🔄 Starting file migration from Firebase Storage to S3...');
    
    try {
      const firebaseFiles = await this.listFirebaseFiles();
      this.migrationStats.files.total = firebaseFiles.length;
      
      console.log(`📁 Found ${firebaseFiles.length} files to migrate`);
      
      for (const firebasePath of firebaseFiles) {
        try {
          // Convert Firebase path to S3 path
          const s3Path = `migrated/${firebasePath}`;
          await this.migrateFile(firebasePath, s3Path);
        } catch (error) {
          console.error(`❌ Skipping file ${firebasePath}:`, error.message);
        }
      }
      
      console.log('=====================================');
      console.log('🎉 File migration completed!');
      console.log('📊 Migration Statistics:');
      console.log(`   Files migrated: ${this.migrationStats.files.migrated}/${this.migrationStats.files.total}`);
      console.log(`   Total size: ${(this.migrationStats.totalSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   Errors: ${this.migrationStats.files.errors}`);
      
    } catch (error) {
      console.error('❌ File migration failed:', error.message);
      throw error;
    }
  }

  // Migrate specific file types
  async migrateFileType(fileType, firebasePrefix = '') {
    console.log(`🔄 Migrating ${fileType} files...`);
    
    try {
      const firebaseFiles = await this.listFirebaseFiles(firebasePrefix);
      const filteredFiles = firebaseFiles.filter(file => 
        file.toLowerCase().includes(fileType.toLowerCase())
      );
      
      console.log(`📁 Found ${filteredFiles.length} ${fileType} files to migrate`);
      
      for (const firebasePath of filteredFiles) {
        try {
          const s3Path = `migrated/${fileType}/${path.basename(firebasePath)}`;
          await this.migrateFile(firebasePath, s3Path);
        } catch (error) {
          console.error(`❌ Skipping ${fileType} file ${firebasePath}:`, error.message);
        }
      }
      
    } catch (error) {
      console.error(`❌ ${fileType} file migration failed:`, error.message);
      throw error;
    }
  }
}

// Run migration if called directly
if (require.main === module) {
  const migrator = new FirebaseStorageToS3Migrator();
  
  // Check command line arguments
  const args = process.argv.slice(2);
  
  if (args.includes('--all')) {
    migrator.migrateAllFiles().catch(console.error);
  } else if (args.includes('--images')) {
    migrator.migrateFileType('images', 'images/').catch(console.error);
  } else if (args.includes('--videos')) {
    migrator.migrateFileType('videos', 'videos/').catch(console.error);
  } else {
    console.log('Usage:');
    console.log('  node file-migration.js --all     # Migrate all files');
    console.log('  node file-migration.js --images # Migrate only images');
    console.log('  node file-migration.js --videos # Migrate only videos');
  }
}

module.exports = FirebaseStorageToS3Migrator;
