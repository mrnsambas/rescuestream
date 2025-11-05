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


