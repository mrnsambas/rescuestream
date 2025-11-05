import { useEffect, useRef, useState } from 'react';

export type AlertThreshold = {
  healthFactor: number; // Below this value, trigger alert
  enabled: boolean;
};

export type AlertSettings = {
  audioEnabled: boolean;
  notificationEnabled: boolean;
  thresholds: AlertThreshold[];
  volume: number; // 0-1
  cooldown: number; // seconds between alerts for same position
};

const DEFAULT_SETTINGS: AlertSettings = {
  audioEnabled: true,
  notificationEnabled: true,
  thresholds: [
    { healthFactor: 1.0, enabled: true }, // At risk
    { healthFactor: 1.5, enabled: true }, // Watch
  ],
  volume: 0.5,
  cooldown: 300, // 5 minutes
};

// Load settings from localStorage
function loadSettings(): AlertSettings {
  const saved = localStorage.getItem('audioAlerts_settings');
  if (saved) {
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch (e) {
      console.error('Failed to load alert settings:', e);
    }
  }
  return DEFAULT_SETTINGS;
}

// Save settings to localStorage
function saveSettings(settings: AlertSettings): void {
  localStorage.setItem('audioAlerts_settings', JSON.stringify(settings));
}

// Create audio context for playing sounds
function createAudioContext(): AudioContext | null {
  try {
    return new (window.AudioContext || (window as any).webkitAudioContext)();
  } catch (e) {
    console.warn('AudioContext not supported:', e);
    return null;
  }
}

// Play alert sound
function playAlertSound(volume: number = 0.5): void {
  const audioContext = createAudioContext();
  if (!audioContext) return;

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  // Alert tone: 800Hz for 200ms
  oscillator.frequency.value = 800;
  oscillator.type = 'sine';
  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01);
  gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.2);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.2);
}

// Request notification permission
async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('Browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

// Show browser notification
async function showNotification(title: string, body: string, icon?: string): Promise<void> {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  try {
    const notification = new Notification(title, {
      body,
      icon: icon || '/favicon.ico',
      tag: 'rescuestream-alert',
      requireInteraction: false,
    });

    // Auto-close after 5 seconds
    setTimeout(() => notification.close(), 5000);
  } catch (e) {
    console.error('Failed to show notification:', e);
  }
}

export function useAudioAlerts() {
  const [settings, setSettings] = useState<AlertSettings>(loadSettings);
  const [muted, setMuted] = useState(false);
  const lastAlertTime = useRef<Map<string, number>>(new Map());

  // Save settings when they change
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const triggerAlert = (
    positionId: string,
    healthFactor: number,
    message: string
  ): void => {
    // Check cooldown
    const lastTime = lastAlertTime.current.get(positionId);
    const now = Date.now();
    if (lastTime && (now - lastTime) < settings.cooldown * 1000) {
      return; // Still in cooldown
    }

    // Check if any threshold is met
    const shouldAlert = settings.thresholds.some(
      (threshold) => threshold.enabled && healthFactor < threshold.healthFactor
    );

    if (!shouldAlert || muted) return;

    // Update last alert time
    lastAlertTime.current.set(positionId, now);

    // Play audio
    if (settings.audioEnabled) {
      playAlertSound(settings.volume);
    }

    // Show notification
    if (settings.notificationEnabled) {
      showNotification('Position Alert', message).catch(console.error);
    }
  };

  const updateSettings = (newSettings: Partial<AlertSettings>): void => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const toggleMute = (): void => {
    setMuted((prev) => !prev);
  };

  return {
    settings,
    muted,
    triggerAlert,
    updateSettings,
    toggleMute,
  };
}

