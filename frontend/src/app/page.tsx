"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { MosaicCanvas } from "@/components/MosaicCanvas";
import { ClaimModal } from "@/components/ClaimModal";
import { useAllSlots, useClaimedCount } from "@/hooks/useContract";

export default function Home() {
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { data: rawSlots, refetch } = useAllSlots();
  const { data: claimedCount } = useClaimedCount();

  const slots = (rawSlots as any[] || []).map((s: any) => ({
    claimed: s.claimed,
    ipfsHash: s.ipfsHash,
    xHandle: s.xHandle,
    displayName: s.displayName,
    claimer: s.claimer,
  }));

  // Pad to 133 if contract not yet loaded
  while (slots.length < 133) {
    slots.push({ claimed: false, ipfsHash: "", xHandle: "", displayName: "", claimer: "" });
  }

  const names = slots.filter(s => s.claimed && s.displayName).map(s => s.displayName);

  const handleSuccess = () => {
    setTimeout(() => { refetch(); setRefreshKey(k => k + 1); }, 3000);
  };

  return (
    <main className="w-screen h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-ritual-darkgreen/80 backdrop-blur-sm z-10">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
          {/* Small knot icon */}
          <svg width="32" height="32" viewBox="0 0 100 100">
            <rect width="100" height="100" rx="8" fill="#06503A" />
            <polygon points="50,10 66,26 50,42 34,26" fill="white" />
            <rect x="30" y="45" width="40" height="10" fill="white" transform="rotate(-45,50,50)" />
            <rect x="30" y="45" width="40" height="10" fill="white" transform="rotate(45,50,50)" />
            <polygon points="50,58 66,74 50,90 34,74" fill="white" />
          </svg>
          <div>
            <h1 className="text-white font-display text-xl leading-none">Ritual Mosaic</h1>
            <p className="text-white/40 text-xs font-mono mt-0.5">
              {typeof claimedCount !== "undefined" ? `${claimedCount.toString()} / 133 slots claimed` : "133 diamond slots · Ritual Chain"}
            </p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-white/60 text-xs font-mono">
              {133 - (slots.filter(s => s.claimed).length)} slots remaining
            </span>
            <div className="w-32 h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-1000"
                style={{ width: `${(slots.filter(s => s.claimed).length / 133) * 100}%` }}
              />
            </div>
          </div>
          <ConnectButton showBalance={false} chainStatus="icon" accountStatus="avatar" />
        </motion.div>
      </header>

      {/* Canvas — full remaining height */}
      <div className="flex-1 relative overflow-hidden">
        <MosaicCanvas
          key={refreshKey}
          slots={slots}
          onSlotClick={setSelectedSlot}
          names={names}
        />

        {/* Instruction hint — fades after 5s */}
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ delay: 5, duration: 1.5 }}
          className="absolute bottom-14 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-full px-5 py-2.5 border border-white/10 pointer-events-none"
        >
          <p className="text-white/70 text-sm font-body text-center">
            ✦ Click any glowing slot to claim your spot in the mosaic
          </p>
        </motion.div>
      </div>

      {/* Claim Modal */}
      {selectedSlot !== null && (
        <ClaimModal
          slotId={selectedSlot}
          onClose={() => setSelectedSlot(null)}
          onSuccess={handleSuccess}
        />
      )}
    </main>
  );
}
