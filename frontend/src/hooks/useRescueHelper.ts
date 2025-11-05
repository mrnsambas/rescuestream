import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { Address } from 'viem';

const RESCUE_HELPER_ABI = [
  {
    name: 'rescueTopUp',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'positionId', type: 'bytes32' },
      { name: 'owner', type: 'address' },
      { name: 'newCollateral', type: 'uint256' },
      { name: 'debt', type: 'uint256' },
    ],
    outputs: [],
  },
] as const;

export function useRescueHelper(contractAddress?: string) {
  const { address } = useAccount();
  const { writeContract, data: hash, error, isPending, reset } = useWriteContract();
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash,
  });

  const rescueTopUp = async (
    positionId: string,
    owner: string,
    newCollateral: bigint,
    debt: bigint
  ) => {
    if (!contractAddress) throw new Error('RescueHelper address not configured');
    if (!address) throw new Error('Wallet not connected');

    // Convert positionId string to bytes32
    // If it's already hex, use it; otherwise pad to 32 bytes
    let positionIdBytes: `0x${string}`;
    if (positionId.startsWith('0x')) {
      // Ensure it's exactly 66 chars (0x + 64 hex chars)
      const hex = positionId.slice(2);
      positionIdBytes = `0x${hex.padStart(64, '0').slice(0, 64)}` as `0x${string}`;
    } else {
      // Convert to hex and pad
      const hex = positionId.match(/^[0-9a-fA-F]+$/) ? positionId : Buffer.from(positionId).toString('hex');
      positionIdBytes = `0x${hex.padStart(64, '0').slice(0, 64)}` as `0x${string}`;
    }

    writeContract({
      address: contractAddress as Address,
      abi: RESCUE_HELPER_ABI,
      functionName: 'rescueTopUp',
      args: [
        positionIdBytes,
        owner as Address,
        newCollateral,
        debt,
      ],
    });
  };

  return {
    rescueTopUp,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error: error || receiptError,
    reset,
  };
}

