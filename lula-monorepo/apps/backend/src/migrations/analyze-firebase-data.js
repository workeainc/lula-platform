const admin = require('firebase-admin');
const fs = require('fs');
require('dotenv').config();

class FirebaseDataAnalyzer {
  constructor() {
    this.initializeFirebase();
    this.analysisResults = {
      collections: {},
      totalDocuments: 0,
      totalSize: 0,
      users: { count: 0, roles: {} },
      calls: { count: 0, statuses: {} },
      transactions: { count: 0, types: {} }
    };
  }

  initializeFirebase() {
    try {
      const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      
      if (!serviceAccountPath || !fs.existsSync(serviceAccountPath)) {
        throw new Error('Firebase service account key file not found');
      }

      const serviceAccount = require('../../firebase-service-account.json');
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`
      });

      this.db = admin.firestore();
      this.storage = admin.storage();
      console.log('✅ Firebase Admin SDK initialized');
    } catch (error) {
      console.error('❌ Firebase initialization failed:', error.message);
      throw error;
    }
  }

  async analyzeCollection(collectionName) {
    try {
      console.log(`🔍 Analyzing collection: ${collectionName}`);
      
      const snapshot = await this.db.collection(collectionName).get();
      const documents = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        documents.push({
          id: doc.id,
          ...data
        });
      });

      const analysis = {
        count: documents.length,
        sampleDocuments: documents.slice(0, 3), // First 3 documents as samples
        fields: this.analyzeFields(documents),
        size: JSON.stringify(documents).length
      };

      this.analysisResults.collections[collectionName] = analysis;
      this.analysisResults.totalDocuments += documents.length;
      this.analysisResults.totalSize += analysis.size;

      // Special analysis for specific collections
      if (collectionName === 'users') {
        this.analyzeUsers(documents);
      } else if (collectionName === 'callLogs') {
        this.analyzeCalls(documents);
      } else if (collectionName === 'transactions') {
        this.analyzeTransactions(documents);
      }

      console.log(`✅ Analyzed ${collectionName}: ${documents.length} documents`);
      return analysis;
    } catch (error) {
      console.error(`❌ Error analyzing ${collectionName}:`, error.message);
      return null;
    }
  }

  analyzeFields(documents) {
    const fieldCounts = {};
    
    documents.forEach(doc => {
      Object.keys(doc).forEach(field => {
        if (field !== 'id') {
          fieldCounts[field] = (fieldCounts[field] || 0) + 1;
        }
      });
    });

    return fieldCounts;
  }

  analyzeUsers(documents) {
    this.analysisResults.users.count = documents.length;
    
    documents.forEach(user => {
      const role = user.role || 'unknown';
      this.analysisResults.users.roles[role] = (this.analysisResults.users.roles[role] || 0) + 1;
    });
  }

  analyzeCalls(documents) {
    this.analysisResults.calls.count = documents.length;
    
    documents.forEach(call => {
      const status = call.status || 'unknown';
      this.analysisResults.calls.statuses[status] = (this.analysisResults.calls.statuses[status] || 0) + 1;
    });
  }

  analyzeTransactions(documents) {
    this.analysisResults.transactions.count = documents.length;
    
    documents.forEach(transaction => {
      const type = transaction.type || 'unknown';
      this.analysisResults.transactions.types[type] = (this.analysisResults.transactions.types[type] || 0) + 1;
    });
  }

  async analyzeStorage() {
    try {
      console.log('🔍 Analyzing Firebase Storage...');
      
      const bucket = this.storage.bucket();
      const [files] = await bucket.getFiles();
      
      const storageAnalysis = {
        totalFiles: files.length,
        totalSize: 0,
        fileTypes: {},
        folders: {}
      };

      files.forEach(file => {
        const size = parseInt(file.metadata.size || 0);
        storageAnalysis.totalSize += size;
        
        const extension = file.name.split('.').pop() || 'no-extension';
        storageAnalysis.fileTypes[extension] = (storageAnalysis.fileTypes[extension] || 0) + 1;
        
        const folder = file.name.split('/')[0] || 'root';
        storageAnalysis.folders[folder] = (storageAnalysis.folders[folder] || 0) + 1;
      });

      this.analysisResults.storage = storageAnalysis;
      console.log(`✅ Analyzed storage: ${files.length} files, ${(storageAnalysis.totalSize / 1024 / 1024).toFixed(2)} MB`);
      
      return storageAnalysis;
    } catch (error) {
      console.error('❌ Error analyzing storage:', error.message);
      return null;
    }
  }

  async runCompleteAnalysis() {
    console.log('🚀 Starting Firebase Data Analysis...');
    console.log('=====================================');
    
    try {
      // Analyze main collections
      const collections = ['users', 'callLogs', 'chats', 'withdrawals', 'posts', 'transactions'];
      
      for (const collection of collections) {
        await this.analyzeCollection(collection);
      }
      
      // Analyze storage
      await this.analyzeStorage();
      
      // Generate report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Analysis failed:', error.message);
    } finally {
      process.exit(0);
    }
  }

  generateReport() {
    console.log('\n📊 FIREBASE DATA ANALYSIS REPORT');
    console.log('=====================================');
    
    console.log(`\n📈 OVERVIEW:`);
    console.log(`   Total Collections: ${Object.keys(this.analysisResults.collections).length}`);
    console.log(`   Total Documents: ${this.analysisResults.totalDocuments}`);
    console.log(`   Total Data Size: ${(this.analysisResults.totalSize / 1024 / 1024).toFixed(2)} MB`);
    
    if (this.analysisResults.storage) {
      console.log(`   Total Files: ${this.analysisResults.storage.totalFiles}`);
      console.log(`   Storage Size: ${(this.analysisResults.storage.totalSize / 1024 / 1024).toFixed(2)} MB`);
    }
    
    console.log(`\n👥 USERS:`);
    console.log(`   Total Users: ${this.analysisResults.users.count}`);
    Object.entries(this.analysisResults.users.roles).forEach(([role, count]) => {
      console.log(`   ${role}: ${count}`);
    });
    
    console.log(`\n📞 CALLS:`);
    console.log(`   Total Calls: ${this.analysisResults.calls.count}`);
    Object.entries(this.analysisResults.calls.statuses).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });
    
    console.log(`\n💰 TRANSACTIONS:`);
    console.log(`   Total Transactions: ${this.analysisResults.transactions.count}`);
    Object.entries(this.analysisResults.transactions.types).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });
    
    console.log(`\n📁 COLLECTIONS DETAILS:`);
    Object.entries(this.analysisResults.collections).forEach(([name, data]) => {
      console.log(`\n   ${name.toUpperCase()}:`);
      console.log(`     Documents: ${data.count}`);
      console.log(`     Size: ${(data.size / 1024).toFixed(2)} KB`);
      console.log(`     Fields: ${Object.keys(data.fields).length}`);
      
      // Show sample fields
      const topFields = Object.entries(data.fields)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([field]) => field);
      console.log(`     Top Fields: ${topFields.join(', ')}`);
    });
    
    if (this.analysisResults.storage) {
      console.log(`\n📦 STORAGE DETAILS:`);
      console.log(`   Total Files: ${this.analysisResults.storage.totalFiles}`);
      console.log(`   Total Size: ${(this.analysisResults.storage.totalSize / 1024 / 1024).toFixed(2)} MB`);
      
      console.log(`\n   File Types:`);
      Object.entries(this.analysisResults.storage.fileTypes)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .forEach(([type, count]) => {
          console.log(`     ${type}: ${count} files`);
        });
      
      console.log(`\n   Folders:`);
      Object.entries(this.analysisResults.storage.folders)
        .sort(([,a], [,b]) => b - a)
        .forEach(([folder, count]) => {
          console.log(`     ${folder}: ${count} files`);
        });
    }
    
    console.log(`\n🎯 MIGRATION RECOMMENDATIONS:`);
    console.log(`   1. Users collection: ${this.analysisResults.users.count} users to migrate`);
    console.log(`   2. Call logs: ${this.analysisResults.calls.count} calls to migrate`);
    console.log(`   3. Transactions: ${this.analysisResults.transactions.count} transactions to migrate`);
    console.log(`   4. Storage files: ${this.analysisResults.storage?.totalFiles || 0} files to migrate to S3`);
    console.log(`   5. Estimated migration time: ${Math.ceil(this.analysisResults.totalDocuments / 1000)} minutes`);
    
    // Save detailed report
    const reportPath = `firebase-analysis-report-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(this.analysisResults, null, 2));
    console.log(`\n📄 Detailed report saved: ${reportPath}`);
  }
}

// Run analysis if called directly
if (require.main === module) {
  const analyzer = new FirebaseDataAnalyzer();
  analyzer.runCompleteAnalysis().catch(console.error);
}

module.exports = FirebaseDataAnalyzer;
