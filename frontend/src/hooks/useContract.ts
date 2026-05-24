"use client";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/config";

export function useSlotPrice() {
  return useReadContract({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: "slotPrice" });
}

export function useAllSlots() {
  return useReadContract({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: "getAllSlots", query: { refetchInterval: 10000 } });
}

export function useClaimedCount() {
  return useReadContract({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: "claimedCount" });
}

export function useClaimSlot() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const claimSlot = (slotId: number, ipfsHash: string, xHandle: string, displayName: string, price: bigint) => {
    writeContract({
      address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: "claimSlot",
      args: [BigInt(slotId), ipfsHash, xHandle, displayName],
      value: price,
    });
  };

  return { claimSlot, isPending, isConfirming, isSuccess, error, hash, reset };
}
