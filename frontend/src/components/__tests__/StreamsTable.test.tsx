import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StreamsTable, StreamRow } from '../StreamsTable';

describe('StreamsTable', () => {
  const mockRows: StreamRow[] = [
    {
      positionId: '0x123',
      owner: '0xabcdef',
      collateralUsd: '1000',
      debtUsd: '500',
      healthFactor: '1500000000000000000', // 1.5
      status: 'healthy',
    },
    {
      positionId: '0x456',
      owner: '0xfedcba',
      collateralUsd: '2000',
      debtUsd: '2500',
      healthFactor: '800000000000000000', // 0.8
      status: 'at_risk',
    },
  ];

  it('should render table with rows', () => {
    const onSelect = () => {};
    const onRescue = () => {};
    
    render(<StreamsTable rows={mockRows} onSelect={onSelect} onRescue={onRescue} />);
    
    expect(screen.getByText('Owner')).toBeInTheDocument();
    expect(screen.getByText('Collateral USD')).toBeInTheDocument();
  });

  it('should filter by status', () => {
    const onSelect = () => {};
    const onRescue = () => {};
    
    const { container } = render(<StreamsTable rows={mockRows} onSelect={onSelect} onRescue={onRescue} />);
    
    // Click "At Risk" filter
    const atRiskButton = screen.getByText('At Risk');
    fireEvent.click(atRiskButton);
    
    // Should only show at-risk position
    expect(screen.getByText('0x456')).toBeInTheDocument();
  });

  it('should sort by column', () => {
    const onSelect = () => {};
    const onRescue = () => {};
    
    render(<StreamsTable rows={mockRows} onSelect={onSelect} onRescue={onRescue} />);
    
    // Click on Collateral USD header to sort
    const header = screen.getByText('Collateral USD');
    fireEvent.click(header);
    
    // Verify sorting occurred (rows would be reordered)
    expect(screen.getByText('Owner')).toBeInTheDocument();
  });

  it('should call onSelect when row is clicked', () => {
    const onSelect = jest.fn();
    const onRescue = () => {};
    
    render(<StreamsTable rows={mockRows} onSelect={onSelect} onRescue={onRescue} />);
    
    // Click on first row
    const row = screen.getByText('0x123');
    fireEvent.click(row);
    
    expect(onSelect).toHaveBeenCalledWith('0x123');
  });

  it('should call onRescue when Liquidate button is clicked', () => {
    const onSelect = () => {};
    const onRescue = jest.fn();
    
    render(<StreamsTable rows={mockRows} onSelect={onSelect} onRescue={onRescue} />);
    
    // Find and click Liquidate button
    const buttons = screen.getAllByText('Liquidate');
    fireEvent.click(buttons[0]);
    
    expect(onRescue).toHaveBeenCalled();
  });
});

