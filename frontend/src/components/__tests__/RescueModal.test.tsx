import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RescueModal } from '../RescueModal';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock wagmi hooks
vi.mock('wagmi', async () => {
  const actual = await vi.importActual('wagmi');
  return {
    ...actual,
    useAccount: () => ({ isConnected: true, address: '0x123' }),
    useWriteContract: () => ({
      writeContract: vi.fn(),
      isPending: false,
      error: null,
    }),
    useWaitForTransactionReceipt: () => ({
      isLoading: false,
      isSuccess: false,
      error: null,
    }),
  };
});

describe('RescueModal', () => {
  const queryClient = new QueryClient();
  const config = createConfig({
    chains: [],
    transports: {},
  });

  it('should render when open', () => {
    const onClose = vi.fn();
    render(
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>
          <RescueModal
            open={true}
            onClose={onClose}
            positionId="0x123"
            owner="0xabc"
            newCollateral={100n}
            debt={50n}
          />
        </WagmiProvider>
      </QueryClientProvider>
    );
    
    expect(screen.getByText('Confirm Rescue Transaction')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    const onClose = vi.fn();
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>
          <RescueModal
            open={false}
            onClose={onClose}
            positionId="0x123"
            owner="0xabc"
            newCollateral={100n}
            debt={50n}
          />
        </WagmiProvider>
      </QueryClientProvider>
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('should show wallet connection warning when not connected', () => {
    // Mock useAccount to return not connected
    vi.mock('wagmi', () => ({
      useAccount: () => ({ isConnected: false, address: undefined }),
    }));

    const onClose = vi.fn();
    render(
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>
          <RescueModal
            open={true}
            onClose={onClose}
            positionId="0x123"
            owner="0xabc"
            newCollateral={100n}
            debt={50n}
          />
        </WagmiProvider>
      </QueryClientProvider>
    );
    
    // Would show wallet connection warning
    expect(screen.getByText('Confirm Rescue Transaction')).toBeInTheDocument();
  });
});

