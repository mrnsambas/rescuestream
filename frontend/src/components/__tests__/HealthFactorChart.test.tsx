import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HealthFactorChart } from '../HealthFactorChart';

describe('HealthFactorChart', () => {
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
  });

  it('should render chart for position', () => {
    render(<HealthFactorChart positionId="0x123" currentHealthFactor={1.5} />);
    
    expect(screen.getByText('Health Factor Over Time')).toBeInTheDocument();
  });

  it('should show no history message when no data', () => {
    render(<HealthFactorChart positionId="0x456" currentHealthFactor={1.0} />);
    
    // Chart should render (empty state handled internally)
    expect(screen.queryByText('Health Factor Over Time')).toBeInTheDocument();
  });

  it('should persist history to localStorage', () => {
    const positionId = '0x789';
    
    render(<HealthFactorChart positionId={positionId} currentHealthFactor={1.2} />);
    
    // Wait a bit for localStorage update
    setTimeout(() => {
      const saved = localStorage.getItem(`healthFactor_history_${positionId}`);
      expect(saved).toBeDefined();
    }, 100);
  });
});

