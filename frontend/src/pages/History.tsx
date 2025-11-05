import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { formatAddressLong } from '../lib/eth';

type Transaction = {
  txHash: string;
  positionId: string;
  owner: string;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
};

export function History() {
  const { address } = useAccount();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'failed'>('all');

  const relayerUrl = React.useMemo(() => {
    return (import.meta as any).env?.VITE_RELAYER_URL;
  }, []);

  useEffect(() => {
    const loadTransactions = async () => {
      setLoading(true);
      try {
        if (relayerUrl) {
          // Try to fetch from relayer API first
          const res = await fetch(`${relayerUrl}/transactions?limit=100`).catch(() => null);
          if (res && res.ok) {
            const data = await res.json();
            setTransactions(data.transactions || []);
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.warn('Failed to fetch from relayer, using localStorage:', e);
      }

      // Fallback to localStorage
      const saved = localStorage.getItem('rescuestream_transactions');
      if (saved) {
        try {
          setTransactions(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to load transactions:', e);
        }
      }
      setLoading(false);
    };

    loadTransactions();

    // Poll for updates every 10 seconds
    const interval = setInterval(() => {
      loadTransactions();
    }, 10000);

    // Listen for new transactions (from RescueModal)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'rescuestream_transactions') {
        loadTransactions();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [relayerUrl]);

  // Update transaction status from blockchain
  useEffect(() => {
    const updateTransactionStatuses = async () => {
      const pendingTxs = transactions.filter((tx) => tx.status === 'pending');
      if (pendingTxs.length === 0 || !relayerUrl) return;

      for (const tx of pendingTxs) {
        try {
          const res = await fetch(`${relayerUrl}/transactions/${tx.txHash}/update`, {
            method: 'POST',
          });
          if (res.ok) {
            const data = await res.json();
            setTransactions((prev) =>
              prev.map((t) => (t.txHash === tx.txHash ? data.transaction : t))
            );
          }
        } catch (e) {
          console.error(`Failed to update transaction ${tx.txHash}:`, e);
        }
      }
    };

    if (transactions.length > 0) {
      updateTransactionStatuses();
      const interval = setInterval(updateTransactionStatuses, 30000); // Every 30 seconds
      return () => clearInterval(interval);
    }
  }, [transactions, relayerUrl]);

  const cardStyle: React.CSSProperties = {
    padding: 16,
    borderRadius: 12,
    background: 'var(--card-bg)',
    border: '1px solid var(--border)',
    marginBottom: 12,
  };

  const filteredTransactions = React.useMemo(() => {
    if (filter === 'all') return transactions;
    return transactions.filter((tx) => tx.status === filter);
  }, [transactions, filter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>Transaction History</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ fontSize: 14, color: 'var(--sub)' }}>
            {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {['all', 'pending', 'confirmed', 'failed'].map((f) => (
              <button
                key={f}
                className={filter === f ? 'btn' : 'btn muted'}
                style={{ fontSize: 12, padding: '4px 8px' }}
                onClick={() => setFilter(f as typeof filter)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--sub)' }}>
          Loading transactions...
        </div>
      )}

      {!loading && filteredTransactions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--sub)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <div>No transactions yet. Rescue operations will appear here.</div>
        </div>
      ) : (
        !loading && filteredTransactions
          .sort((a, b) => b.timestamp - a.timestamp)
          .map((tx) => (
            <div key={tx.txHash} style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    Position {tx.positionId.slice(0, 10)}...
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--sub)' }}>
                    Owner: {formatAddressLong(tx.owner)}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--sub)', marginTop: 4 }}>
                    {new Date(tx.timestamp).toLocaleString()}
                  </div>
                </div>
                <div
                  style={{
                    padding: '4px 12px',
                    borderRadius: 6,
                    background:
                      tx.status === 'confirmed'
                        ? '#dcfce7'
                        : tx.status === 'failed'
                        ? '#fee2e2'
                        : '#fef3c7',
                    color:
                      tx.status === 'confirmed'
                        ? '#166534'
                        : tx.status === 'failed'
                        ? '#b91c1c'
                        : '#92400e',
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  {tx.status}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 12 }}>
                <div style={{ color: 'var(--sub)' }}>TX:</div>
                <a
                  href={`https://explorer.somnia.network/tx/${tx.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--teal)', textDecoration: 'none', fontFamily: 'monospace' }}
                >
                  {tx.txHash.slice(0, 10)}...{tx.txHash.slice(-8)}
                </a>
                {tx.blockNumber && (
                  <>
                    <span style={{ color: 'var(--sub)' }}>•</span>
                    <span style={{ color: 'var(--sub)' }}>Block: {tx.blockNumber}</span>
                  </>
                )}
              </div>
            </div>
          ))
      )}
    </div>
  );
}

// Helper function to save transaction to history
export function saveTransactionToHistory(txHash: string, positionId: string, owner: string, status: Transaction['status'] = 'confirmed') {
  const tx: Transaction = {
    txHash,
    positionId,
    owner,
    timestamp: Date.now(),
    status,
  };

  const existing = localStorage.getItem('rescuestream_transactions');
  const transactions: Transaction[] = existing ? JSON.parse(existing) : [];
  transactions.unshift(tx);
  
  // Keep only last 100 transactions
  if (transactions.length > 100) {
    transactions.splice(100);
  }

  localStorage.setItem('rescuestream_transactions', JSON.stringify(transactions));
  
  // Trigger storage event for other tabs
  window.dispatchEvent(new StorageEvent('storage', {
    key: 'rescuestream_transactions',
    newValue: JSON.stringify(transactions),
  }));
}

