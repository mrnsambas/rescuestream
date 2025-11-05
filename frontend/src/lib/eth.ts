// Legacy ethers.js functions (kept for backward compatibility)
export async function getSigner() {
  const { ethers } = await import('ethers');
  if (!(window as any).ethereum) throw new Error('No wallet');
  const provider = new ethers.BrowserProvider((window as any).ethereum);
  await provider.send('eth_requestAccounts', []);
  return provider.getSigner();
}

export async function getRescueHelper(address: string) {
  const { ethers } = await import('ethers');
  const abi = [
    'function rescueTopUp(bytes32 positionId, address owner, uint256 newCollateral, uint256 debt) external'
  ];
  const signer = await getSigner();
  return new ethers.Contract(address, abi, await signer);
}

// Wagmi/Viem helpers (preferred for new code)
export function formatAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatAddressLong(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 10)}...${address.slice(-8)}`;
}


