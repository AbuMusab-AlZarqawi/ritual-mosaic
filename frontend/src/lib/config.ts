import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { defineChain } from "viem";

export const ritualTestnet = defineChain({
  id: 1979,
  name: "Ritual Testnet",
  nativeCurrency: { decimals: 18, name: "RITUAL", symbol: "RITUAL" },
  rpcUrls: { default: { http: [process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.ritualfoundation.org"] } },
  testnet: true,
});

export const wagmiConfig = getDefaultConfig({
  appName: "RitualMosaic",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "YOUR_PROJECT_ID",
  chains: [ritualTestnet],
  ssr: true,
});

export const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "") as `0x${string}`;

export const CONTRACT_ABI = [
  { inputs: [{ name: "slotId", type: "uint256" }, { name: "ipfsHash", type: "string" }, { name: "xHandle", type: "string" }, { name: "displayName", type: "string" }], name: "claimSlot", outputs: [], stateMutability: "payable", type: "function" },
  { inputs: [], name: "getAllSlots", outputs: [{ components: [{ name: "claimer", type: "address" }, { name: "ipfsHash", type: "string" }, { name: "xHandle", type: "string" }, { name: "displayName", type: "string" }, { name: "claimedAt", type: "uint256" }, { name: "claimed", type: "bool" }], type: "tuple[]" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "slotPrice", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "claimedCount", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { anonymous: false, inputs: [{ indexed: true, name: "slotId", type: "uint256" }, { indexed: true, name: "claimer", type: "address" }, { name: "ipfsHash", type: "string" }, { name: "xHandle", type: "string" }, { name: "displayName", type: "string" }, { name: "timestamp", type: "uint256" }], name: "SlotClaimed", type: "event" },
] as const;
