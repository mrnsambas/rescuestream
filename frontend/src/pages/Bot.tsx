import React from 'react';

type BotStatus = {
  enabled: boolean;
  lastCheck: number | null;
  rescuesExecuted: number;
  lastRescueTime: number | null;
  errors: number;
  lastError: string | null;
};

export function Bot() {
  const [enabled, setEnabled] = React.useState(false);
  const [botStatus, setBotStatus] = React.useState<BotStatus | null>(null);
  const [config, setConfig] = React.useState({
    autoRescue: false,
    minHealthFactor: '1.0',
    maxTopUp: '100',
  });
  const [saving, setSaving] = React.useState(false);
  const [saveMessage, setSaveMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const relayerUrl = React.useMemo(() => {
    const url = (import.meta as any).env?.VITE_RELAYER_URL;
    if (!url) {
      console.warn('VITE_RELAYER_URL not set, bot features will be unavailable');
    }
    return url;
  }, []);

  const saveBotConfig = React.useCallback(async (cfg: typeof config) => {
    if (!enabled || !relayerUrl) return;
    
    setSaving(true);
    setSaveMessage(null);
    
    try {
      const maxTopUpWei = BigInt(Math.floor(parseFloat(cfg.maxTopUp) * 1e18));
      const res = await fetch(`${relayerUrl}/bot/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: true,
          autoRescue: cfg.autoRescue,
          minHealthFactor: cfg.minHealthFactor,
          maxTopUpAmount: maxTopUpWei.toString(),
        }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save configuration');
      }
      
      setSaveMessage({ type: 'success', text: 'Configuration saved successfully' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      console.error('Failed to save bot config:', err);
      setSaveMessage({ type: 'error', text: (err as Error).message || 'Failed to save configuration' });
      setTimeout(() => setSaveMessage(null), 5000);
    } finally {
      setSaving(false);
    }
  }, [relayerUrl, enabled]);

  React.useEffect(() => {
    if (!relayerUrl) return;
    
    const fetchBotStatus = async () => {
      try {
        const res = await fetch(`${relayerUrl}/bot/status`).catch(() => null);
        if (res) {
          const status = await res.json();
          setBotStatus(status);
          setEnabled(status.enabled || false);
          // Update local config if backend has different values
          if (status.config) {
            setConfig({
              autoRescue: status.config.autoRescue || false,
              minHealthFactor: status.config.minHealthFactor || '1.0',
              maxTopUp: status.config.maxTopUpAmount ? (Number(status.config.maxTopUpAmount) / 1e18).toString() : '100',
            });
          }
        }
      } catch (e) {
        console.error('Failed to fetch bot status:', e);
      }
    };

    fetchBotStatus();
    const interval = setInterval(fetchBotStatus, 5000);
    return () => clearInterval(interval);
  }, [relayerUrl]);

  const cardStyle: React.CSSProperties = {
    padding: 20,
    borderRadius: 12,
    background: 'var(--card-bg)',
    border: '1px solid var(--border)',
    marginBottom: 16,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>Rescue Bot</h1>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={enabled} 
            onChange={async (e) => {
              setEnabled(e.target.checked);
              // Update backend config
              try {
                const res = await fetch(`${relayerUrl}/bot/config`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ enabled: e.target.checked }),
                });
                if (!res.ok) {
                  const error = await res.json();
                  alert(`Failed to update bot: ${error.error || 'Unknown error'}`);
                  setEnabled(!e.target.checked); // Revert
                }
              } catch (err) {
                console.error('Failed to update bot config:', err);
                alert('Failed to connect to relayer');
                setEnabled(!e.target.checked); // Revert
              }
            }} 
          />
          <span>Enable Bot</span>
        </label>
      </div>

      <div style={cardStyle}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}>Configuration</h2>
        {saveMessage && (
          <div style={{
            padding: 12,
            borderRadius: 8,
            marginBottom: 16,
            background: saveMessage.type === 'success' ? '#dcfce7' : '#fee2e2',
            color: saveMessage.type === 'success' ? '#166534' : '#b91c1c',
            fontSize: 14,
          }}>
            {saveMessage.text}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={config.autoRescue} 
              onChange={(e) => {
                const newConfig = { ...config, autoRescue: e.target.checked };
                setConfig(newConfig);
                saveBotConfig(newConfig);
              }} 
              disabled={!enabled} 
            />
            <span>Auto-rescue positions when health factor drops below threshold</span>
          </label>
          
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: 'var(--sub)' }}>
              Minimum Health Factor
            </label>
            <input
              type="number"
              step="0.1"
              value={config.minHealthFactor}
              onChange={(e) => setConfig({ ...config, minHealthFactor: e.target.value })}
              onBlur={() => saveBotConfig(config)}
              disabled={!enabled}
              style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: 'var(--sub)' }}>
              Max Top-Up Amount (ETH)
            </label>
            <input
              type="number"
              value={config.maxTopUp}
              onChange={(e) => setConfig({ ...config, maxTopUp: e.target.value })}
              onBlur={() => saveBotConfig(config)}
              disabled={!enabled}
              style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)' }}
            />
          </div>
          
          <div style={{ marginTop: 16 }}>
            <button 
              className="btn" 
              onClick={() => saveBotConfig(config)}
              disabled={!enabled || saving}
            >
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}>Bot Status</h2>
        {!botStatus ? (
          <div style={{ color: 'var(--sub)', fontSize: 14 }}>Connecting to relayer...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--sub)' }}>Status</span>
              <span style={{ fontWeight: 500, color: botStatus.enabled ? '#166534' : '#6b7280' }}>
                {botStatus.enabled ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--sub)' }}>Rescues Executed</span>
              <span style={{ fontWeight: 500 }}>{botStatus.rescuesExecuted}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--sub)' }}>Last Check</span>
              <span style={{ fontWeight: 500 }}>
                {botStatus.lastCheck ? new Date(botStatus.lastCheck * 1000).toLocaleTimeString() : '—'}
              </span>
            </div>
            {botStatus.lastRescueTime && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--sub)' }}>Last Rescue</span>
                <span style={{ fontWeight: 500 }}>
                  {new Date(botStatus.lastRescueTime).toLocaleString()}
                </span>
              </div>
            )}
            {botStatus.errors > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--sub)' }}>Errors</span>
                <span style={{ fontWeight: 500, color: '#b91c1c' }}>{botStatus.errors}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {enabled && (
        <div style={{ padding: 16, borderRadius: 12, background: '#fef3c7', border: '1px solid #fbbf24', color: '#92400e' }}>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>⚠️ Bot is Active</div>
          <div style={{ fontSize: 14 }}>The rescue bot will automatically monitor positions and execute rescues according to your configuration.</div>
        </div>
      )}
    </div>
  );
}

