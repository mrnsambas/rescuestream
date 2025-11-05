import React from 'react';
import { WalletStatus } from '../components/WalletStatus';
import { useAudioAlerts } from '../hooks/useAudioAlerts';

export function Settings() {
  const [settings, setSettings] = React.useState({
    rpcUrl: ((import.meta as any).env?.VITE_SOMNIA_RPC_URL as string) || '',
    rescueHelper: ((import.meta as any).env?.VITE_RESCUE_HELPER_ADDRESS as string) || '',
    schemaId: ((import.meta as any).env?.VITE_POSITION_SCHEMA_ID as string) || '',
    publisher: ((import.meta as any).env?.VITE_POSITION_PUBLISHER as string) || '',
    walletConnectId: ((import.meta as any).env?.VITE_WALLETCONNECT_ID as string) || '',
  });

  const { settings: alertSettings, updateSettings: updateAlertSettings, muted, toggleMute } = useAudioAlerts();

  const cardStyle: React.CSSProperties = {
    padding: 20,
    borderRadius: 12,
    background: 'var(--card-bg)',
    border: '1px solid var(--border)',
    marginBottom: 16,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: 8,
    borderRadius: 6,
    border: '1px solid var(--border)',
    background: 'var(--bg)',
    color: 'var(--text)',
    fontFamily: 'inherit',
    fontSize: 14,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1 style={{ margin: 0 }}>Settings</h1>
      <WalletStatus />

      <div style={cardStyle}>
        <h2 style={{ marginTop: 0, fontSize: 18, marginBottom: 16 }}>Network Configuration</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: 'var(--sub)' }}>
              RPC URL
            </label>
            <input
              type="text"
              value={settings.rpcUrl}
              onChange={(e) => setSettings({ ...settings, rpcUrl: e.target.value })}
              style={inputStyle}
              placeholder="https://rpc.somnia.network"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: 'var(--sub)' }}>
              Rescue Helper Address
            </label>
            <input
              type="text"
              value={settings.rescueHelper}
              onChange={(e) => setSettings({ ...settings, rescueHelper: e.target.value })}
              style={inputStyle}
              placeholder="0x..."
            />
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <h2 style={{ marginTop: 0, fontSize: 18, marginBottom: 16 }}>Streams Configuration</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: 'var(--sub)' }}>
              Position Schema ID
            </label>
            <input
              type="text"
              value={settings.schemaId}
              onChange={(e) => setSettings({ ...settings, schemaId: e.target.value })}
              style={inputStyle}
              placeholder="0x..."
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: 'var(--sub)' }}>
              Publisher Address
            </label>
            <input
              type="text"
              value={settings.publisher}
              onChange={(e) => setSettings({ ...settings, publisher: e.target.value })}
              style={inputStyle}
              placeholder="0x..."
            />
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <h2 style={{ marginTop: 0, fontSize: 18, marginBottom: 16 }}>Wallet Configuration</h2>
        <div>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: 'var(--sub)' }}>
            WalletConnect Project ID (optional)
          </label>
          <input
            type="text"
            value={settings.walletConnectId}
            onChange={(e) => setSettings({ ...settings, walletConnectId: e.target.value })}
            style={inputStyle}
            placeholder="Your WalletConnect project ID"
          />
        </div>
      </div>

      <div style={cardStyle}>
        <h2 style={{ marginTop: 0, fontSize: 18, marginBottom: 16 }}>Alert Settings</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={alertSettings.audioEnabled}
              onChange={(e) => updateAlertSettings({ audioEnabled: e.target.checked })}
            />
            <span>Enable Audio Alerts</span>
          </label>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={alertSettings.notificationEnabled}
              onChange={(e) => updateAlertSettings({ notificationEnabled: e.target.checked })}
            />
            <span>Enable Browser Notifications</span>
          </label>

          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: 'var(--sub)' }}>
              Alert Volume: {Math.round(alertSettings.volume * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={alertSettings.volume}
              onChange={(e) => updateAlertSettings({ volume: parseFloat(e.target.value) })}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: 'var(--sub)' }}>
              Cooldown (seconds): {alertSettings.cooldown}
            </label>
            <input
              type="range"
              min="60"
              max="3600"
              step="60"
              value={alertSettings.cooldown}
              onChange={(e) => updateAlertSettings({ cooldown: parseInt(e.target.value, 10) })}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <button className={muted ? 'btn muted' : 'btn'} onClick={toggleMute}>
              {muted ? '🔇 Unmute Alerts' : '🔊 Mute Alerts'}
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button
          className="btn"
          onClick={() => {
            // Save settings (in a real app, this would persist to localStorage or backend)
            alert('Settings saved (note: this is a demo - settings persist in localStorage in production)');
            localStorage.setItem('rescuestream_settings', JSON.stringify(settings));
          }}
        >
          Save Settings
        </button>
        <button
          className="btn muted"
          onClick={() => {
            const saved = localStorage.getItem('rescuestream_settings');
            if (saved) {
              setSettings(JSON.parse(saved));
            }
          }}
        >
          Load Saved
        </button>
      </div>
    </div>
  );
}

