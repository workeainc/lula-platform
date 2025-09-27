#!/usr/bin/env node

const FirebaseToMongoDBMigrator = require('./firebase-to-mongodb');
const FirebaseStorageToS3Migrator = require('./file-migration');
const mongoose = require('mongoose');
require('dotenv').config();

class CompleteMigrationRunner {
  constructor() {
    this.dataMigrator = null;
    this.fileMigrator = null;
    this.migrationLog = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, type, message };
    this.migrationLog.push(logEntry);
    
    const emoji = {
      'info': 'ℹ️',
      'success': '✅',
      'error': '❌',
      'warning': '⚠️',
      'progress': '🔄'
    };
    
    console.log(`${emoji[type]} [${timestamp}] ${message}`);
  }

  async validateEnvironment() {
    this.log('Validating environment configuration...', 'progress');
    
    const requiredEnvVars = [
      'MONGODB_URI',
      'FIREBASE_PROJECT_ID',
      'FIREBASE_SERVICE_ACCOUNT_KEY',
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY',
      'AWS_REGION',
      'S3_BUCKET_NAME'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      this.log(`Missing environment variables: ${missingVars.join(', ')}`, 'error');
      throw new Error('Missing required environment variables');
    }
    
    this.log('Environment validation passed', 'success');
  }

  async validateFirebaseAccess() {
    this.log('Validating Firebase access...', 'progress');
    
    try {
      const FirebaseToMongoDBMigrator = require('./firebase-to-mongodb');
      const migrator = new FirebaseToMongoDBMigrator();
      
      // Test Firebase connection
      const testCollection = migrator.db.collection('test');
      await testCollection.limit(1).get();
      
      this.log('Firebase access validated', 'success');
      return true;
    } catch (error) {
      this.log(`Firebase access validation failed: ${error.message}`, 'error');
      return false;
    }
  }

  async validateMongoDBAccess() {
    this.log('Validating MongoDB access...', 'progress');
    
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      
      // Test MongoDB connection
      await mongoose.connection.db.admin().ping();
      
      this.log('MongoDB access validated', 'success');
      return true;
    } catch (error) {
      this.log(`MongoDB access validation failed: ${error.message}`, 'error');
      return false;
    }
  }

  async validateS3Access() {
    this.log('Validating S3 access...', 'progress');
    
    try {
      const AWS = require('aws-sdk');
      AWS.config.update({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION
      });
      
      const s3 = new AWS.S3();
      
      // Test S3 access
      await s3.headBucket({ Bucket: process.env.S3_BUCKET_NAME }).promise();
      
      this.log('S3 access validated', 'success');
      return true;
    } catch (error) {
      this.log(`S3 access validation failed: ${error.message}`, 'error');
      return false;
    }
  }

  async runPreMigrationChecks() {
    this.log('Running pre-migration checks...', 'progress');
    
    const checks = [
      this.validateEnvironment(),
      this.validateFirebaseAccess(),
      this.validateMongoDBAccess(),
      this.validateS3Access()
    ];
    
    const results = await Promise.allSettled(checks);
    const failedChecks = results.filter(result => result.status === 'rejected');
    
    if (failedChecks.length > 0) {
      this.log(`${failedChecks.length} pre-migration checks failed`, 'error');
      throw new Error('Pre-migration checks failed');
    }
    
    this.log('All pre-migration checks passed', 'success');
  }

  async backupExistingData() {
    this.log('Creating backup of existing MongoDB data...', 'progress');
    
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupDir = `./backups/mongodb-backup-${timestamp}`;
      
      // Create backup directory
      const fs = require('fs');
      if (!fs.existsSync('./backups')) {
        fs.mkdirSync('./backups', { recursive: true });
      }
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      // Export collections
      const collections = ['users', 'calls', 'transactions', 'coins'];
      
      for (const collection of collections) {
        try {
          const data = await mongoose.connection.db.collection(collection).find({}).toArray();
          const filePath = `${backupDir}/${collection}.json`;
          fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
          this.log(`Backed up ${collection}: ${data.length} documents`, 'info');
        } catch (error) {
          this.log(`Failed to backup ${collection}: ${error.message}`, 'warning');
        }
      }
      
      this.log(`Backup completed: ${backupDir}`, 'success');
    } catch (error) {
      this.log(`Backup failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async runDataMigration() {
    this.log('Starting data migration...', 'progress');
    
    try {
      this.dataMigrator = new FirebaseToMongoDBMigrator();
      await this.dataMigrator.runMigration();
      this.log('Data migration completed successfully', 'success');
    } catch (error) {
      this.log(`Data migration failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async runFileMigration() {
    this.log('Starting file migration...', 'progress');
    
    try {
      this.fileMigrator = new FirebaseStorageToS3Migrator();
      await this.fileMigrator.migrateAllFiles();
      this.log('File migration completed successfully', 'success');
    } catch (error) {
      this.log(`File migration failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async updateFileReferences() {
    this.log('Updating file references in database...', 'progress');
    
    try {
      const User = require('../models/User');
      const users = await User.find({});
      
      let updatedCount = 0;
      
      for (const user of users) {
        let needsUpdate = false;
        
        // Update profile image
        if (user.profileImage && user.profileImage.includes('firebase')) {
          user.profileImage = user.profileImage.replace(
            /https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/.*?\/o\/(.*?)\?.*/,
            `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/migrated/$1`
          );
          needsUpdate = true;
        }
        
        // Update profile video
        if (user.profileVideo && user.profileVideo.includes('firebase')) {
          user.profileVideo = user.profileVideo.replace(
            /https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/.*?\/o\/(.*?)\?.*/,
            `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/migrated/$1`
          );
          needsUpdate = true;
        }
        
        // Update images array
        if (user.images && user.images.length > 0) {
          user.images = user.images.map(img => {
            if (img.url && img.url.includes('firebase')) {
              return {
                ...img,
                url: img.url.replace(
                  /https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/.*?\/o\/(.*?)\?.*/,
                  `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/migrated/$1`
                )
              };
            }
            return img;
          });
          needsUpdate = true;
        }
        
        // Update videos array
        if (user.videos && user.videos.length > 0) {
          user.videos = user.videos.map(vid => {
            if (vid.url && vid.url.includes('firebase')) {
              return {
                ...vid,
                url: vid.url.replace(
                  /https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/.*?\/o\/(.*?)\?.*/,
                  `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/migrated/$1`
                )
              };
            }
            return vid;
          });
          needsUpdate = true;
        }
        
        if (needsUpdate) {
          await user.save();
          updatedCount++;
        }
      }
      
      this.log(`Updated file references for ${updatedCount} users`, 'success');
    } catch (error) {
      this.log(`Failed to update file references: ${error.message}`, 'error');
      throw error;
    }
  }

  async generateMigrationReport() {
    this.log('Generating migration report...', 'progress');
    
    try {
      const report = {
        timestamp: new Date().toISOString(),
        environment: {
          mongodb_uri: process.env.MONGODB_URI,
          firebase_project_id: process.env.FIREBASE_PROJECT_ID,
          s3_bucket: process.env.S3_BUCKET_NAME,
          aws_region: process.env.AWS_REGION
        },
        migration_log: this.migrationLog,
        data_migration_stats: this.dataMigrator?.migrationStats || null,
        file_migration_stats: this.fileMigrator?.migrationStats || null
      };
      
      const fs = require('fs');
      const reportPath = `./migration-report-${Date.now()}.json`;
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      
      this.log(`Migration report generated: ${reportPath}`, 'success');
    } catch (error) {
      this.log(`Failed to generate migration report: ${error.message}`, 'error');
    }
  }

  async runCompleteMigration() {
    this.log('🚀 Starting complete Firebase to MongoDB migration...', 'progress');
    this.log('================================================', 'info');
    
    try {
      // Pre-migration checks
      await this.runPreMigrationChecks();
      
      // Backup existing data
      await this.backupExistingData();
      
      // Run data migration
      await this.runDataMigration();
      
      // Run file migration
      await this.runFileMigration();
      
      // Update file references
      await this.updateFileReferences();
      
      // Generate report
      await this.generateMigrationReport();
      
      this.log('================================================', 'info');
      this.log('🎉 Complete migration finished successfully!', 'success');
      this.log('📊 Check the migration report for detailed statistics', 'info');
      
    } catch (error) {
      this.log(`❌ Migration failed: ${error.message}`, 'error');
      this.log('Check the logs above for details', 'warning');
      throw error;
    } finally {
      await mongoose.disconnect();
      process.exit(0);
    }
  }
}

// Run migration if called directly
if (require.main === module) {
  const runner = new CompleteMigrationRunner();
  runner.runCompleteMigration().catch(console.error);
}

module.exports = CompleteMigrationRunner;
