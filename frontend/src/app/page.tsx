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

  while (slots.length < 334) {
    slots.push({ claimed: false, ipfsHash: "", xHandle: "", displayName: "", claimer: "" });
  }

  const names = slots.filter(s => s.claimed && s.displayName).map(s => s.displayName);
  const recentClaimers = slots.filter(s => s.claimed && s.displayName).slice(-12);

  const handleSuccess = () => {
    setTimeout(() => { refetch(); setRefreshKey(k => k + 1); }, 3000);
  };

  return (
    <main className="w-screen h-screen flex flex-col overflow-hidden bg-[#032b1e]">

      {/* ── Header ── */}
      <header className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-white/8 bg-[#043D2C]/90 backdrop-blur-sm z-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          {/* Ritual knot icon */}
          <svg width="34" height="34" viewBox="0 0 100 100" className="flex-shrink-0">
            <rect width="100" height="100" rx="10" fill="#06503A" />
            <polygon points="50,8 64,22 50,36 36,22" fill="white" />
            <rect x="28" y="42" width="44" height="10" fill="white" transform="rotate(-45,50,47)" />
            <rect x="28" y="42" width="44" height="10" fill="white" transform="rotate(45,50,47)" />
            <polygon points="50,64 64,78 50,92 36,78" fill="white" />
          </svg>
          <div>
            <h1 className="text-white font-display text-lg leading-tight">Ritual Collage</h1>
            <p className="text-white/40 text-[11px] font-body leading-tight">
              A Commemorative Onchain Collage of the Ritual Community
            </p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <ConnectButton showBalance={false} chainStatus="icon" accountStatus="avatar" />
        </motion.div>
      </header>

      {/* ── Top decorative strip ── */}
      <div className="flex-shrink-0 h-10 flex items-center justify-center overflow-hidden border-b border-white/5 bg-[#032b1e]">
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="flex items-center gap-8 whitespace-nowrap"
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i} className="flex items-center gap-2 text-white/20 text-xs font-mono uppercase tracking-widest">
              <span className="text-white/15">◆</span>
              Ritual Community
              <span className="text-white/15">◆</span>
              Onchain Forever
              <span className="text-white/15">◆</span>
              Claim Your Spot
            </span>
          ))}
        </motion.div>
      </div>

      {/* ── Main Canvas ── */}
      <div className="flex-1 relative overflow-hidden">
        <MosaicCanvas
          key={refreshKey}
          slots={slots}
          onSlotClick={setSelectedSlot}
          names={names}
        />

        {/* Claim hint — fades */}
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ delay: 6, duration: 2 }}
          className="absolute bottom-16 left-1/2 -translate-x-1/2 pointer-events-none"
        >
          <div className="bg-black/40 backdrop-blur-sm rounded-full px-5 py-2 border border-white/10">
            <p className="text-white/60 text-xs font-body text-center whitespace-nowrap">
              ✦ Click any circle to claim your free spot in the collage
            </p>
          </div>
        </motion.div>
      </div>

      {/* ── Bottom recent claimers strip ── */}
      <div className="flex-shrink-0 h-12 flex items-center gap-0 overflow-hidden border-t border-white/5 bg-[#032b1e] px-4">
        {recentClaimers.length > 0 ? (
          <>
            <span className="text-white/25 text-xs font-mono uppercase tracking-widest mr-4 flex-shrink-0">
              Recent
            </span>
            <motion.div
              animate={{ x: ["0%", "-50%"] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="flex items-center gap-5 whitespace-nowrap"
            >
              {[...recentClaimers, ...recentClaimers].map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full overflow-hidden bg-white/10 flex-shrink-0">
                    {s.xHandle ? (
                      <img
                        src={`https://unavatar.io/x/${s.xHandle.replace(/https?:\/\/(www\.)?(x|twitter)\.com\//i, "").replace(/^@/, "")}`}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-emerald-800/50 flex items-center justify-center">
                        <span className="text-white/40 text-[8px]">{s.displayName[0]}</span>
                      </div>
                    )}
                  </div>
                  <span className="text-white/40 text-xs font-body">{s.displayName}</span>
                  <span className="text-white/10 text-xs">·</span>
                </div>
              ))}
            </motion.div>
          </>
        ) : (
          <p className="text-white/20 text-xs font-mono mx-auto">
            No claims yet — be the first to join the Ritual Collage ✦
          </p>
        )}
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
