import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Linking, Share } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';

const APKDownloadCard = ({ appType = 'streamer' }) => {
  const [showQR, setShowQR] = useState(false);
  
  const appName = appType === 'user' ? 'Lula User' : 'Lula Streamer';
  const packageName = appType === 'user' ? 'com.lula.user' : 'com.lula.streamer';
  
  // Actual APK URLs from EAS Build
  const apkDownloadUrl = appType === 'user' 
    ? 'https://expo.dev/artifacts/eas/6DDp9xQM3abySvZhmnq9f4.apk' // User app APK URL
    : 'https://expo.dev/artifacts/eas/QLsSDcxBRRoieVLWjEP9v.apk'; // Streamer app APK URL
  const qrCodeData = apkDownloadUrl;

  const handleDownloadAPK = async () => {
    try {
      const canOpen = await Linking.canOpenURL(apkDownloadUrl);
      if (canOpen) {
        await Linking.openURL(apkDownloadUrl);
      } else {
        Alert.alert('Error', 'Cannot open download link');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open download link');
    }
  };

  const handleShareAPK = async () => {
    try {
      await Share.share({
        message: `Download ${appName} APK: ${apkDownloadUrl}`,
        url: apkDownloadUrl,
        title: `Download ${appName}`
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share download link');
    }
  };

  const toggleQR = () => {
    setShowQR(!showQR);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.card}
      >
        <View style={styles.header}>
          <Ionicons name="download-outline" size={24} color="white" />
          <Text style={styles.title}>Download {appName}</Text>
        </View>
        
        <Text style={styles.subtitle}>
          Get the latest version of {appName} for Android
        </Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={handleDownloadAPK} style={styles.downloadButton}>
            <LinearGradient
              colors={['#4CAF50', '#45a049']}
              style={styles.buttonGradient}
            >
              <Ionicons name="download" size={20} color="white" />
              <Text style={styles.buttonText}>Download APK</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handleShareAPK} style={styles.shareButton}>
            <LinearGradient
              colors={['#2196F3', '#1976D2']}
              style={styles.buttonGradient}
            >
              <Ionicons name="share" size={20} color="white" />
              <Text style={styles.buttonText}>Share</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity onPress={toggleQR} style={styles.qrToggle}>
          <Text style={styles.qrToggleText}>
            {showQR ? 'Hide QR Code' : 'Show QR Code'}
          </Text>
          <Ionicons 
            name={showQR ? 'chevron-up' : 'chevron-down'} 
            size={16} 
            color="white" 
          />
        </TouchableOpacity>
        
        {showQR && (
          <View style={styles.qrContainer}>
            <Text style={styles.qrTitle}>Scan to Download</Text>
            <View style={styles.qrCodeWrapper}>
              <QRCode
                value={qrCodeData}
                size={150}
                color="black"
                backgroundColor="white"
              />
            </View>
            <Text style={styles.qrInstructions}>
              Scan this QR code with your phone's camera to download the APK
            </Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 12,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  downloadButton: {
    flex: 1,
    marginRight: 8,
  },
  shareButton: {
    flex: 1,
    marginLeft: 8,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  qrToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  qrToggleText: {
    color: 'white',
    fontSize: 14,
    marginRight: 4,
  },
  qrContainer: {
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  qrTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  qrCodeWrapper: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  qrInstructions: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default APKDownloadCard;
