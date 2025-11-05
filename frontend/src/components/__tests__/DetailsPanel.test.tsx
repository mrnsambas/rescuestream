import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DetailsPanel } from '../DetailsPanel';

describe('DetailsPanel', () => {
  it('should show placeholder when no position selected', () => {
    const onRescue = () => {};
    render(<DetailsPanel positionId={undefined} owner={undefined} onRescue={onRescue} />);
    
    expect(screen.getByText('Select a position to view details')).toBeInTheDocument();
  });

  it('should display position analytics when position is selected', () => {
    const onRescue = () => {};
    render(<DetailsPanel positionId="0x123" owner="0xabc" onRescue={onRescue} />);
    
    expect(screen.getByText('Position Analytics')).toBeInTheDocument();
  });

  it('should show liquidation price when available', () => {
    const onRescue = () => {};
    // This would require mocking the position stream
    render(<DetailsPanel positionId="0x123" owner="0xabc" onRescue={onRescue} />);
    
    // Would verify liquidation price is displayed
    expect(screen.getByText('Liquidation Price:')).toBeInTheDocument();
  });
});

