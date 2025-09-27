import { Audio } from 'expo-av';
import notifee from '@notifee/react-native';

let currentSound = null;
let isPlaying = false;
let startInProgress = false;

async function start() {
  try {
    if (isPlaying || startInProgress) return;
    startInProgress = true;

    // Defensive: stop any existing sound first
    await stop();

    // Do not pre-silence Notifee here, to allow OS ringtone to play where needed

    // Configure audio mode for ringtone playback
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (_) {}

    const { sound } = await Audio.Sound.createAsync(
      require('../assets/audio/iphone_15.mp3'),
      { shouldPlay: true, isLooping: true }
    );
    currentSound = sound;
    await sound.playAsync();
    isPlaying = true;
  } catch (error) {
    isPlaying = false;
  } finally {
    startInProgress = false;
  }
}

async function stop() {
  try {
    if (currentSound) {
      try { await currentSound.stopAsync(); } catch (_) {}
      try { await currentSound.unloadAsync(); } catch (_) {}
      currentSound = null;
    }
  } catch (_) {}
  isPlaying = false;
}

async function ensureNotifeeSilenced(callId) {
  try { await notifee.stopForegroundService(); } catch (_) {}
  if (callId) {
    try { await notifee.cancelNotification(`call_${callId}`); } catch (_) {}
  }
  // Defensively cancel any active call notifications (handles mismatched/missing ids)
  try {
    const displayed = await notifee.getDisplayedNotifications();
    const candidates = displayed.filter(n => (n?.id || '').startsWith('call_') || (n?.data?.type || '').toString().toLowerCase() === 'call');
    if (candidates.length) {
      await Promise.all(candidates.map(n => notifee.cancelNotification(n.id)));
    }
  } catch (_) {}
}

async function stopAll(callId) {
  await stop();
  await ensureNotifeeSilenced(callId);
}

export default {
  start,
  stop,
  stopAll,
  ensureNotifeeSilenced,
};


